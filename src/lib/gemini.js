// Thin wrapper around the Gemini API's REST generateContent endpoint.
// The API key lives only in the user's browser (localStorage via
// useAssistantStore) — it is entered at runtime in Settings, never baked
// into the build, so it's safe even when this app is deployed publicly
// (e.g. GitHub Pages).
//
// This also implements function calling ("tool use"): askGemini can be given
// a list of tool declarations + an executor. If Gemini decides to call a
// tool (e.g. "start_pomodoro"), we run it against real app state and send
// the result back to Gemini in a follow-up turn, so the final reply reflects
// what actually happened — this is what lets the assistant act on the app,
// not just talk about it.
//
// Two extra capabilities beyond plain chat, both native to the Gemini API
// (no separate key/service needed):
//  - Web research: passing `enableSearch: true` adds Google Search grounding
//    as a tool, so Gemini can look things up live and cite sources.
//  - Drawing: generateGeminiImage() calls Gemini's native image-output model
//    (Nano Banana) so the assistant can produce an actual image from a text
//    prompt, not just describe one.
//
// PERFORMANCE: askGemini streams the response (streamGenerateContent + SSE)
// instead of waiting for the whole reply to finish generating. Pass
// `onDelta(textChunk)` to get text as it's produced — this is what makes the
// assistant feel like it's replying instantly instead of "loading" for
// seconds before anything shows up. Tool-call rounds still resolve as a
// whole (function calls arrive as a single chunk, not token-by-token), only
// the final natural-language reply streams token-by-token.
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const MAX_TOOL_ROUNDS = 4
export const DEFAULT_IMAGE_MODEL = 'gemini-2.5-flash-image'

export class GeminiError extends Error {}

function toParts(message) {
  const parts = []
  if (message.text) parts.push({ text: message.text })
  ;(message.attachments || []).forEach((a) => {
    if (a.data) parts.push({ inlineData: { mimeType: a.mimeType, data: a.data } })
  })
  return parts.length ? parts : [{ text: '' }]
}

// Pulls citation-worthy source links out of Gemini's grounding metadata, if
// search grounding was used for this turn. Shape has shifted across API
// versions, so this reads defensively and just returns [] if unrecognized.
function extractSources(candidate) {
  const chunks = candidate?.groundingMetadata?.groundingChunks || []
  const seen = new Set()
  const sources = []
  for (const c of chunks) {
    const url = c?.web?.uri
    if (!url || seen.has(url)) continue
    seen.add(url)
    sources.push({ title: c.web.title || url, url })
  }
  return sources
}

// Opens a streamGenerateContent request (Server-Sent Events) and yields each
// parsed JSON chunk as it arrives off the wire, instead of buffering the
// entire response before returning anything.
async function* streamGemini({ apiKey, model, systemInstruction, contents, tools, enableSearch }) {
  const toolsPayload = []
  if (tools?.length) toolsPayload.push({ functionDeclarations: tools })
  if (enableSearch) toolsPayload.push({ googleSearch: {} })

  const res = await fetch(`${BASE_URL}/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
      contents,
      tools: toolsPayload.length ? toolsPayload : undefined,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1536 },
    }),
  })

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}))
    const msg = body?.error?.message || `Request gagal (${res.status})`
    throw new GeminiError(msg)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // keep the trailing partial line for next read
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const jsonStr = trimmed.slice(5).trim()
      if (!jsonStr) continue
      try {
        yield JSON.parse(jsonStr)
      } catch {
        // Partial/malformed SSE frame — skip it, next frames still work.
      }
    }
  }
}

// tools: array of Gemini functionDeclarations (see assistantTools.js)
// executeTool: async (name, args) => JSON-serializable result
// onToolCall: optional callback(name, args) fired right before a tool runs, for UI feedback
// onDelta: optional callback(textChunk) fired as each streamed text chunk arrives
// enableSearch: when true, lets Gemini ground its answer in live Google
// Search results — this is what "AI bisa riset" turns on.
// Returns { text, sources } — sources is [] unless enableSearch found any.
export async function askGemini({ apiKey, model, systemInstruction, history, tools, executeTool, onToolCall, onDelta, enableSearch = false }) {
  if (!apiKey) throw new GeminiError('Belum ada Gemini API key. Tambahkan di Settings → AI Assistant.')

  const contents = history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: toParts(m) }))

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let candidate = null
    let promptFeedback = null
    const accumulatedParts = []

    for await (const chunk of streamGemini({ apiKey, model, systemInstruction, contents, tools, enableSearch })) {
      if (chunk?.promptFeedback) promptFeedback = chunk.promptFeedback
      const c = chunk?.candidates?.[0]
      if (!c) continue
      candidate = c // last chunk usually carries the fullest metadata (grounding, finishReason)
      const parts = c?.content?.parts || []
      for (const p of parts) {
        if (p.text) {
          onDelta?.(p.text)
          const last = accumulatedParts[accumulatedParts.length - 1]
          if (last && 'text' in last) last.text += p.text
          else accumulatedParts.push({ text: p.text })
        } else if (p.functionCall) {
          accumulatedParts.push({ functionCall: p.functionCall })
        }
      }
    }

    const functionCalls = accumulatedParts.filter((p) => p.functionCall).map((p) => p.functionCall)

    if (functionCalls.length > 0 && executeTool) {
      // Echo the model's function-call turn back into the conversation, then
      // append our function results, so the next round has full context.
      contents.push({ role: 'model', parts: accumulatedParts })

      const responseParts = []
      for (const call of functionCalls) {
        onToolCall?.(call.name, call.args || {})
        const result = await executeTool(call.name, call.args || {})
        responseParts.push({ functionResponse: { name: call.name, response: result } })
      }
      contents.push({ role: 'function', parts: responseParts })
      continue // ask Gemini to produce a final natural-language reply
    }

    const text = accumulatedParts.map((p) => p.text).filter(Boolean).join('')
    if (!text) {
      const blockReason = promptFeedback?.blockReason
      throw new GeminiError(blockReason ? `Diblokir oleh Gemini: ${blockReason}` : 'Tidak ada respons dari Gemini.')
    }
    return { text, sources: extractSources(candidate) }
  }

  throw new GeminiError('Terlalu banyak aksi berantai, coba pesan yang lebih sederhana.')
}

// Generates an image from a text prompt using Gemini's native image-output
// model. Returns { mimeType, data } (data = base64), ready to drop straight
// into an <img src="data:...;base64,..."> or an attachment object.
export async function generateGeminiImage({ apiKey, model = DEFAULT_IMAGE_MODEL, prompt }) {
  if (!apiKey) throw new GeminiError('Belum ada Gemini API key. Tambahkan di Settings → AI Assistant untuk pakai fitur gambar.')
  if (!prompt?.trim()) throw new GeminiError('Prompt gambar kosong.')

  const res = await fetch(`${BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new GeminiError(body?.error?.message || `Request gagal (${res.status})`)
  }

  const data = await res.json()
  const parts = data?.candidates?.[0]?.content?.parts || []
  const imagePart = parts.find((p) => p.inlineData)
  if (!imagePart) {
    const blockReason = data?.promptFeedback?.blockReason
    throw new GeminiError(blockReason ? `Gambar diblokir: ${blockReason}` : 'Model tidak mengembalikan gambar untuk prompt ini. Coba deskripsi lain.')
  }
  return { mimeType: imagePart.inlineData.mimeType || 'image/png', data: imagePart.inlineData.data }
}

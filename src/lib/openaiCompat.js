// Thin wrapper around the OpenAI-compatible /chat/completions endpoint that
// Groq, OpenRouter, Cerebras, and Together AI all expose with the same
// request/response shape (only the base URL + key + model differ). Mirrors
// the same public interface as gemini.js (askGemini) so AssistantPage.jsx
// can call either one interchangeably.
//
// API keys live only in the user's browser (localStorage via
// useAssistantStore) — entered at runtime in Settings, never baked into the
// build, so it's safe even when this app is deployed publicly.
//
// PERFORMANCE: askOpenAICompat streams the response (stream: true + SSE)
// instead of waiting for the whole reply to finish generating. Pass
// `onDelta(textChunk)` to get text as it's produced, so replies start
// appearing immediately instead of after a long "loading" pause.
const MAX_TOOL_ROUNDS = 4
const TEXT_MIME_TYPES = ['text/plain', 'text/markdown', 'text/csv', 'application/json']

export class OpenAICompatError extends Error {}

function decodeBase64Text(base64) {
  try {
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    return new TextDecoder('utf-8').decode(bytes)
  } catch {
    return ''
  }
}

// Converts our internal { text, attachments } message shape into OpenAI's
// content format. Images become image_url parts (vision models only); plain
// text-ish files (txt/md/csv/json) get decoded and inlined as text so the
// model can actually read them even without multimodal support. PDFs aren't
// readable by these text-only APIs, so we just note the filename.
function toContent(message, supportsVision) {
  const attachments = message.attachments || []
  if (attachments.length === 0) return message.text || ''

  const parts = []
  if (message.text) parts.push({ type: 'text', text: message.text })

  for (const a of attachments) {
    if (!a.data) continue
    if (a.mimeType?.startsWith('image/')) {
      if (supportsVision) {
        parts.push({ type: 'image_url', image_url: { url: `data:${a.mimeType};base64,${a.data}` } })
      } else {
        parts.push({ type: 'text', text: `[Lampiran gambar "${a.name}" — model/provider ini tidak mendukung vision, jadi gambar tidak bisa dibaca.]` })
      }
    } else if (TEXT_MIME_TYPES.includes(a.mimeType)) {
      const decoded = decodeBase64Text(a.data)
      parts.push({ type: 'text', text: `--- Isi lampiran "${a.name}" ---\n${decoded}\n--- akhir lampiran ---` })
    } else {
      parts.push({ type: 'text', text: `[Lampiran "${a.name}" (${a.mimeType}) — format ini tidak bisa dibaca langsung oleh provider ini.]` })
    }
  }
  return parts.length ? parts : (message.text || '')
}

function toOpenAITools(toolDeclarations) {
  return (toolDeclarations || []).map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }))
}

// Opens a streamed /chat/completions request and yields each parsed SSE
// data-frame as it arrives, instead of buffering the whole response first.
async function* streamChatCompletions({ apiKey, baseURL, model, messages, tools }) {
  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages,
      tools: tools?.length ? tools : undefined,
      temperature: 0.7,
      max_tokens: 1536,
      stream: true,
    }),
  })

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}))
    const msg = body?.error?.message || `Request gagal (${res.status})`
    throw new OpenAICompatError(msg)
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
      const payload = trimmed.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      try {
        yield JSON.parse(payload)
      } catch {
        // Partial/malformed SSE frame — skip it, next frames still work.
      }
    }
  }
}

// tools: array in the same shape as gemini.js's TOOL_DECLARATIONS (name/description/parameters)
// executeTool: async (name, args) => JSON-serializable result
// onToolCall: optional callback(name, args) fired right before a tool runs, for UI feedback
// onDelta: optional callback(textChunk) fired as each streamed text chunk arrives
export async function askOpenAICompat({ apiKey, baseURL, model, systemInstruction, history, tools, executeTool, onToolCall, onDelta, supportsVision = true }) {
  // apiKey is optional here (not just for built-in providers, which always
  // require one) — self-hosted servers like Ollama/vLLM/LM Studio typically
  // don't check auth at all, so a custom provider with no key is valid.
  if (!baseURL) throw new OpenAICompatError('Provider ini belum dikonfigurasi dengan benar (baseURL kosong).')

  const messages = []
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction })
  for (const m of history) {
    messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: toContent(m, supportsVision) })
  }

  const openAITools = toOpenAITools(tools)

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let content = ''
    let finishReason = null
    const toolCallsAcc = [] // sparse array indexed by the delta's tool_call index

    for await (const chunk of streamChatCompletions({ apiKey, baseURL, model, messages, tools: openAITools })) {
      const choice = chunk?.choices?.[0]
      if (!choice) continue
      if (choice.finish_reason) finishReason = choice.finish_reason
      const delta = choice.delta || {}
      if (delta.content) {
        content += delta.content
        onDelta?.(delta.content)
      }
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0
          if (!toolCallsAcc[idx]) toolCallsAcc[idx] = { id: tc.id, function: { name: '', arguments: '' } }
          if (tc.id) toolCallsAcc[idx].id = tc.id
          if (tc.function?.name) toolCallsAcc[idx].function.name += tc.function.name
          if (tc.function?.arguments) toolCallsAcc[idx].function.arguments += tc.function.arguments
        }
      }
    }

    const toolCalls = toolCallsAcc.filter(Boolean)

    if (toolCalls.length > 0 && executeTool) {
      // Echo the assistant's tool-call turn back into the conversation, then
      // append each tool's result as a `tool` message, so the next round has
      // full context to produce a final natural-language reply.
      messages.push({ role: 'assistant', content: content || null, tool_calls: toolCalls })

      for (const call of toolCalls) {
        let args = {}
        try { args = JSON.parse(call.function?.arguments || '{}') } catch { args = {} }
        onToolCall?.(call.function?.name, args)
        const result = await executeTool(call.function?.name, args)
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) })
      }
      continue // ask the model to produce a final natural-language reply
    }

    if (!content) {
      throw new OpenAICompatError(finishReason ? `Tidak ada respons (finish_reason: ${finishReason}).` : 'Tidak ada respons dari provider.')
    }
    return { text: content, sources: [] }
  }

  throw new OpenAICompatError('Terlalu banyak aksi berantai, coba pesan yang lebih sederhana.')
}

import { useAssistantStore } from '@/store/useAssistantStore'
import { askGemini, GeminiError } from '@/lib/gemini'
import { askOpenAICompat, OpenAICompatError } from '@/lib/openaiCompat'
import { PROVIDERS, PROVIDER_LIST, buildCustomProviderConfig } from '@/lib/providers'
import { buildContextSummary } from '@/lib/assistantContext'
import { TOOL_DECLARATIONS, executeTool, matchNavigationCommand } from '@/lib/assistantTools'
import { uid } from '@/lib/utils'
import { useTts } from '@/hooks/useTts'

export const SYSTEM_PROMPT = `Kamu adalah asisten produktivitas pribadi di dalam aplikasi bernama AIR.
Jawab singkat, praktis, dan actionable dalam Bahasa Indonesia (kecuali diminta bahasa lain).
Kamu boleh menjawab pertanyaan apa saja, tidak harus soal produktivitas.
Jika diberi ringkasan data pengguna, gunakan itu untuk memberi saran yang relevan dan spesifik saat relevan — jangan mengarang data yang tidak ada di ringkasan.
Kamu bisa menerima lampiran gambar, PDF, atau file teks dari pengguna — analisis isinya kalau relevan dengan pertanyaan.
Kamu juga punya kemampuan bertindak langsung di aplikasi lewat fungsi-fungsi yang tersedia, yang mencakup SEMUA fitur di aplikasi ini: Tasks, Pomodoro, Habits, Projects, Goals, Notes, Journal, Brainstorm, Library, Bookmarks, dan Calendar (create/update/delete, termasuk menambahkan catatan/journal ke sebuah acara lewat add_event_note), serta berpindah halaman (navigate_to_page) kapan pun pengguna minta dibukakan sebuah halaman/fitur. Kalau permintaan pengguna cocok dengan salah satu fungsi itu, langsung panggil fungsinya — jangan cuma menjelaskan caranya secara manual. Setelah fungsi dijalankan, konfirmasi ke pengguna dengan singkat apa yang barusan kamu lakukan.
Kamu juga bisa MENGGAMBAR: kalau pengguna minta dibuatkan gambar/ilustrasi/poster/sketsa, panggil fungsi generate_image — jangan cuma mendeskripsikan gambarnya, benar-benar buat gambarnya.
Kalau kamu diberi akses riset web (pencarian Google real-time), gunakan itu untuk pertanyaan yang butuh info terkini/faktual/spesifik yang mungkin di luar pengetahuanmu, dan sebutkan secara natural kalau jawabanmu berdasarkan hasil pencarian.
Kamu bisa dipanggil dari halaman mana saja lewat tombol mengambang, jadi pengguna mungkin sedang berada di halaman yang berbeda-beda — tetap bantu berdasarkan permintaannya, tidak perlu menyebut-nyebut halaman saat ini kecuali relevan.`

// Runs the given history through whichever provider is active, using the
// right client (Gemini's native shape vs the OpenAI-compatible shape shared
// by Groq/OpenRouter/Cerebras/Together). Throws a plain Error with a
// human-readable message on failure so the caller doesn't need to know
// which provider-specific error class was thrown. Always resolves to
// { text, sources } — sources is [] for providers/turns without grounding.
async function askActiveProvider({ providerConfig, providerState, systemInstruction, history, tools, executeTool, onToolCall, onDelta, enableSearch }) {
  if (providerConfig.kind === 'gemini') {
    try {
      return await askGemini({
        apiKey: providerState.apiKey,
        model: providerState.model,
        systemInstruction,
        history,
        tools,
        executeTool,
        onToolCall,
        onDelta,
        enableSearch,
      })
    } catch (err) {
      throw new Error(err instanceof GeminiError ? err.message : 'Terjadi kesalahan saat menghubungi Gemini.')
    }
  }

  try {
    return await askOpenAICompat({
      apiKey: providerState.apiKey,
      baseURL: providerConfig.baseURL,
      model: providerState.model,
      systemInstruction,
      history,
      tools,
      executeTool,
      onToolCall,
      onDelta,
      supportsVision: providerConfig.supportsVision,
    })
  } catch (err) {
    throw new Error(err instanceof OpenAICompatError ? err.message : `Terjadi kesalahan saat menghubungi ${providerConfig.label}.`)
  }
}

// Central place that both the full-page Assistant and the global floating
// widget use to talk to the AI. Message history lives in useAssistantStore,
// so a conversation started from one entry point continues seamlessly in
// the other.
export function useAssistantChat() {
  const { providers, activeProvider, setActiveProvider, messages, includeContext, addMessage, updateMessage, clearMessages, setIncludeContext, autoSpeak, setAutoSpeak, replyLanguage, setReplyLanguage, voice, setVoice, researchEnabled, setResearchEnabled, loading, setLoading, customProviders, assistantName } = useAssistantStore()
  const { speak } = useTts()
  // Custom (user-added, self-hosted or otherwise not-built-in) providers are
  // merged in alongside the built-in ones so activeProvider/enabledProviders
  // work identically for both — see lib/providers.js#buildCustomProviderConfig.
  const customConfigs = customProviders.map(buildCustomProviderConfig)
  const allProviders = { ...PROVIDERS, ...Object.fromEntries(customConfigs.map((c) => [c.id, c])) }
  const allProviderList = [...PROVIDER_LIST, ...customConfigs]
  const providerConfig = allProviders[activeProvider] || PROVIDERS.gemini
  const providerState = providers[activeProvider] || { apiKey: '', model: providerConfig.defaultModel }
  const enabledProviders = allProviderList.filter((p) => providers[p.id]?.enabled)
  // Self-hosted custom providers often need no API key at all — being
  // "configured" for them just means a baseURL is set. Built-in providers
  // (Gemini, Groq, etc.) always require a real key.
  const hasKey = providerConfig.isCustom ? Boolean(providerConfig.baseURL) : Boolean(providerState.apiKey)

  const send = async (text, attachments = []) => {
    const content = (text ?? '').trim()
    if ((!content && attachments.length === 0) || loading) return { ok: false }
    if (!hasKey) {
      const msg = enabledProviders.length === 0
        ? 'Belum ada provider AI yang aktif. Atur dulu di Settings → AI Assistant.'
        : `Tambahkan API key ${providerConfig.label} dulu di Settings`
      return { ok: false, error: msg }
    }

    // Fast-path: simple "buka/open <halaman>" commands are matched and
    // executed locally, deterministically — no AI round-trip involved. This
    // is what actually makes "buka notes"-style requests reliable, since the
    // model itself can't be trusted to always call navigate_to_page (see
    // matchNavigationCommand's doc comment for the full reasoning). Only
    // applies to plain-text messages with no attachments, so anything more
    // complex (mixed with another request, files attached, etc.) still goes
    // through the normal AI flow below.
    if (attachments.length === 0) {
      const navSlug = matchNavigationCommand(content)
      if (navSlug) {
        const userMsg = { id: uid(), role: 'user', text: content, attachments: [], createdAt: new Date().toISOString() }
        addMessage(userMsg)
        const result = await executeTool('navigate_to_page', { page: navSlug })
        addMessage({
          id: uid(),
          role: 'assistant',
          text: result.message,
          actions: [{ name: 'navigate_to_page', ok: result.ok, message: result.message }],
          generatedImages: [],
          sources: [],
          createdAt: new Date().toISOString(),
        })
        if (autoSpeak) speak(result.message)
        return { ok: true }
      }
    }

    const userMsg = { id: uid(), role: 'user', text: content, attachments, createdAt: new Date().toISOString() }
    addMessage(userMsg)
    setLoading(true)

    const actionsTaken = []
    const generatedImages = []
    const runTool = async (name, args) => {
      const result = await executeTool(name, args)
      actionsTaken.push({ name, ok: result.ok, message: result.message })
      // Images are heavy (base64) and only needed by the chat UI, not by the
      // model — keep them out of what gets echoed back into the next round's
      // request so we don't bloat the prompt/cost.
      if (result.image) generatedImages.push(result.image)
      const { image, ...forModel } = result
      return forModel
    }

    // Streaming: the first text chunk creates the assistant's bubble right
    // away; every chunk after that just appends to it. `loading` itself
    // stays true for the whole request (not just until the first chunk) —
    // it's also what gates the wake-word background listener
    // (`!loading` in FloatingAssistant), so flipping it early would let
    // wake-word recognition restart mid-reply and fight the mic with
    // whatever's still in flight. The UI hides the "Berpikir..." indicator
    // once a streaming message exists instead, so there's no dead air.
    let assistantMsgId = null
    const onDelta = (chunk) => {
      if (!assistantMsgId) {
        assistantMsgId = uid()
        addMessage({
          id: assistantMsgId,
          role: 'assistant',
          text: chunk,
          actions: [],
          generatedImages: [],
          sources: [],
          createdAt: new Date().toISOString(),
          streaming: true,
        })
      } else {
        updateMessage(assistantMsgId, (prev) => ({ text: (prev.text || '') + chunk }))
      }
    }

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, text: m.text, attachments: m.attachments }))
      const contextSummary = includeContext ? await buildContextSummary() : null
      let systemInstruction = SYSTEM_PROMPT
      if (assistantName && assistantName.trim()) {
        systemInstruction += `\n\nNama kamu adalah "${assistantName.trim()}" — itulah nama yang dipakai pengguna untuk memanggilmu (termasuk lewat wake word "Hei/Hey ${assistantName.trim()}"). Kalau relevan/ditanya, kenalkan dirimu dengan nama itu.`
      }
      if (replyLanguage && replyLanguage !== 'auto') {
        systemInstruction += `\n\nPENTING: Apa pun bahasa yang dipakai pengguna, SELALU balas dalam bahasa: ${replyLanguage}.`
      }
      if (contextSummary) {
        systemInstruction += `\n\nRingkasan data pengguna saat ini:\n${contextSummary}`
      }
      // Web-search grounding is a Gemini-native capability — only wired up
      // when Gemini is the active provider.
      const enableSearch = researchEnabled && providerConfig.kind === 'gemini'
      const { text: reply, sources } = await askActiveProvider({
        providerConfig,
        providerState,
        systemInstruction,
        history,
        tools: TOOL_DECLARATIONS,
        executeTool: runTool,
        onDelta,
        enableSearch,
      })
      if (assistantMsgId) {
        updateMessage(assistantMsgId, { text: reply, actions: actionsTaken, generatedImages, sources, streaming: false })
      } else {
        addMessage({
          id: uid(),
          role: 'assistant',
          text: reply,
          actions: actionsTaken,
          generatedImages,
          sources,
          createdAt: new Date().toISOString(),
        })
      }
      if (autoSpeak) speak(reply)
      return { ok: true }
    } catch (err) {
      const errText = `⚠️ ${err.message}`
      if (assistantMsgId) {
        updateMessage(assistantMsgId, { text: errText, actions: actionsTaken, generatedImages, streaming: false, isError: true })
      } else {
        addMessage({ id: uid(), role: 'assistant', text: errText, actions: actionsTaken, generatedImages, createdAt: new Date().toISOString(), isError: true })
      }
      return { ok: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    providers,
    providerConfig,
    providerState,
    activeProvider,
    setActiveProvider,
    enabledProviders,
    hasKey,
    messages,
    loading,
    send,
    clearMessages,
    includeContext,
    setIncludeContext,
    autoSpeak,
    setAutoSpeak,
    replyLanguage,
    setReplyLanguage,
    voice,
    setVoice,
    researchEnabled,
    setResearchEnabled,
  }
}

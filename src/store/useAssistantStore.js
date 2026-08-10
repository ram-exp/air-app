import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PROVIDER_LIST, defaultProviderState } from '@/lib/providers'

// Strips heavy base64 attachment data before persisting to localStorage —
// only keeps small metadata so history stays lightweight across reloads.
// The image/file itself is only available in-memory for the current tab
// session; after a refresh, past attachments show as a plain label.
function stripAttachmentData(messages) {
  return messages.map((m) => ({
    ...m,
    attachments: (m.attachments || []).map(({ data, ...meta }) => meta),
  }))
}

export const useAssistantStore = create(
  persist(
    (set, get) => ({
      // providers: { [id]: { apiKey, model, enabled } } — see lib/providers.js
      providers: defaultProviderState(),
      activeProvider: 'gemini',
      includeContext: true,
      autoSpeak: false, // when true, AI reads its replies out loud automatically
      messages: [], // { id, role: 'user'|'assistant', text, attachments?, createdAt }

      // customProviders: user-added OpenAI-compatible endpoints (self-hosted
      // Ollama/vLLM, a personal proxy, or any provider not in the built-in
      // list). Each is { id, label, baseURL, defaultModel, supportsVision }.
      // Its apiKey/model/enabled state lives in `providers` just like the
      // built-in ones — see lib/providers.js#buildCustomProviderConfig.
      customProviders: [],
      // show up alongside the built-in list in Settings, so a model the
      // provider just released doesn't have to be retyped every time.
      customModels: {},

      // replyLanguage: 'auto' lets the model match whatever language the user
      // writes in (default); anything else pins every reply to that language
      // regardless of what language the user types in.
      replyLanguage: 'auto',

      // voice: TTS playback settings — voiceURI picks a specific installed
      // browser voice (per pickVoice() in lib/tts.js), lang is the fallback
      // used to auto-pick a voice when voiceURI isn't set/available.
      voice: { voiceURI: '', lang: 'id-ID', rate: 1, pitch: 1 },

      // assistantName: user-facing name of the AI assistant, shown in the
      // UI and told to the model itself (see SYSTEM_PROMPT injection in
      // useAssistantChat). Defaults to 'JARVIS' but is fully renameable —
      // changing it also re-derives the wake phrase below, so "Hey JARVIS"
      // becomes "Hey <new name>" automatically.
      assistantName: 'JARVIS',

      // Wake word: when enabled, the assistant listens in the background
      // (via useWakeWord) and opens itself + starts recording the moment
      // the phrase is heard — no click needed, Jarvis-style. `wakeWord`
      // stores the base phrase (kept for persistence/back-compat); actual
      // detection matches both "hei <name>" and "hey <name>" — see
      // getWakePhrases() in lib/phraseMatch.js.
      wakeWordEnabled: false,
      wakeWord: 'hei jarvis',

      // ttsProvider picks which engine reads replies aloud: 'browser' (free,
      // native OS/browser voices, zero network round-trip — fastest and the
      // default), 'elevenlabs', 'openai', 'google' (Google Cloud TTS — big
      // free tier), or 'camb' (Camb.ai). Remote providers need their own API
      // key (separate from the chat provider keys above) plus a chosen voice.
      ttsProvider: 'browser',
      ttsKeys: { elevenlabs: '', openai: '', google: '', camb: '' },
      elevenLabsVoiceId: '',
      openaiVoice: 'alloy',
      googleVoice: 'id-ID-Standard-A',
      cambVoiceId: '',

      // Barge-in: while the assistant is speaking, listen for one of these
      // phrases (comma-separated) and stop playback immediately so the user
      // doesn't have to wait for it to finish before talking again.
      interruptEnabled: true,
      interruptPhrases: 'stop, oke, okay, berhenti',

      // Research: lets the assistant ground its answers in live Google
      // Search results (Gemini-native — only takes effect when Gemini is
      // the active chat provider).
      researchEnabled: true,

      // loading: true while a send() request is in flight. Lives in the
      // shared store (not local useState) because useAssistantChat() is
      // called from two places at once — the full AssistantPage and the
      // always-mounted FloatingAssistant widget — and they need to agree on
      // whether a request is running (for the "Berpikir..." indicator, the
      // wake-word gate, and preventing double-submits from either UI).
      loading: false,
      setLoading: (loading) => set({ loading }),

      setProviderKey: (id, apiKey) => set((s) => ({ providers: { ...s.providers, [id]: { ...s.providers[id], apiKey } } })),
      setProviderModel: (id, model) => set((s) => ({ providers: { ...s.providers, [id]: { ...s.providers[id], model } } })),
      setProviderEnabled: (id, enabled) => set((s) => {
        const providers = { ...s.providers, [id]: { ...s.providers[id], enabled } }
        // If the currently-active provider just got disabled, fall back to
        // any other enabled provider — built-in or custom — (or leave as-is
        // if none are enabled).
        let activeProvider = s.activeProvider
        if (!enabled && activeProvider === id) {
          const candidateIds = [...PROVIDER_LIST.map((p) => p.id), ...s.customProviders.map((p) => p.id)]
          const fallback = candidateIds.find((cid) => cid !== id && providers[cid]?.enabled)
          activeProvider = fallback || activeProvider
        }
        return { providers, activeProvider }
      }),
      setActiveProvider: (id) => set({ activeProvider: id }),

      addCustomProvider: ({ label, baseURL, defaultModel, supportsVision }) => set((s) => {
        const id = `custom_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
        return {
          customProviders: [...s.customProviders, { id, label: label || 'Custom', baseURL, defaultModel: defaultModel || '', supportsVision: !!supportsVision }],
          providers: { ...s.providers, [id]: { apiKey: '', model: defaultModel || '', enabled: false } },
        }
      }),
      updateCustomProvider: (id, patch) => set((s) => ({
        customProviders: s.customProviders.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      })),
      removeCustomProvider: (id) => set((s) => {
        const { [id]: _removed, ...restProviders } = s.providers
        const activeProvider = s.activeProvider === id ? 'gemini' : s.activeProvider
        return {
          customProviders: s.customProviders.filter((p) => p.id !== id),
          providers: restProviders,
          activeProvider,
        }
      }),

      setIncludeContext: (includeContext) => set({ includeContext }),
      setAutoSpeak: (autoSpeak) => set({ autoSpeak }),
      setReplyLanguage: (replyLanguage) => set({ replyLanguage }),
      setVoice: (patch) => set((s) => ({ voice: { ...s.voice, ...patch } })),
      setWakeWordEnabled: (wakeWordEnabled) => set({ wakeWordEnabled }),
      setWakeWord: (wakeWord) => set({ wakeWord }),
      // Renames the assistant and keeps the wake phrase in sync with it
      // (e.g. renaming to "Nova" turns "hei jarvis" into "hei nova"), unless
      // the user had already customized wakeWord to something that doesn't
      // just follow the "hei/hey <old name>" pattern — in that case we leave
      // their custom phrase alone.
      setAssistantName: (name) => set((s) => {
        const clean = (name || '').trim() || 'JARVIS'
        const prevAuto = `hei ${s.assistantName.trim().toLowerCase()}`
        const isUnmodified = s.wakeWord.trim().toLowerCase() === prevAuto
        return {
          assistantName: clean,
          wakeWord: isUnmodified ? `hei ${clean.toLowerCase()}` : s.wakeWord,
        }
      }),
      setTtsProvider: (ttsProvider) => set({ ttsProvider }),
      setTtsKey: (provider, apiKey) => set((s) => ({ ttsKeys: { ...s.ttsKeys, [provider]: apiKey } })),
      setElevenLabsVoiceId: (elevenLabsVoiceId) => set({ elevenLabsVoiceId }),
      setOpenaiVoice: (openaiVoice) => set({ openaiVoice }),
      setGoogleVoice: (googleVoice) => set({ googleVoice }),
      setCambVoiceId: (cambVoiceId) => set({ cambVoiceId }),
      setInterruptEnabled: (interruptEnabled) => set({ interruptEnabled }),
      setInterruptPhrases: (interruptPhrases) => set({ interruptPhrases }),
      setResearchEnabled: (researchEnabled) => set({ researchEnabled }),
      addCustomModel: (id, model) => set((s) => {
        const clean = (model || '').trim()
        const list = s.customModels[id] || []
        if (!clean || list.includes(clean)) return {}
        return { customModels: { ...s.customModels, [id]: [...list, clean] } }
      }),
      removeCustomModel: (id, model) => set((s) => ({
        customModels: { ...s.customModels, [id]: (s.customModels[id] || []).filter((m) => m !== model) },
      })),
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      // Patches an existing message in place by id — used to append streamed
      // text chunks to the assistant's bubble as they arrive, instead of
      // waiting for the full reply before showing anything. `patch` can be
      // an object to shallow-merge, or a function (prevMessage) => patchObj.
      updateMessage: (id, patch) => set((s) => ({
        messages: s.messages.map((m) => (m.id === id ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)),
      })),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'meridian_assistant',
      version: 10,
      // Belt-and-suspenders on top of the version-based migration above:
      // always ensure every built-in provider id has an entry in
      // `providers`, no matter what's in localStorage or what version it
      // was saved at. This is what actually prevents the "Cannot read
      // properties of undefined (reading 'enabled')" crash class for good —
      // the versioned migration only backfills once at that specific
      // version bump, but `merge` runs on every single load.
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...persistedState }
        const providers = { ...currentState.providers, ...(persistedState?.providers || {}) }
        for (const p of PROVIDER_LIST) {
          if (!providers[p.id]) providers[p.id] = { apiKey: '', model: p.defaultModel, enabled: false }
        }
        return { ...merged, providers }
      },
      // `loading` is transient request state, not user data — never persist
      // it, or a tab closed/refreshed mid-request would reload stuck with
      // loading permanently true (chat input disabled forever).
      partialize: (state) => {
        const { loading, ...rest } = state
        return { ...rest, messages: stripAttachmentData(rest.messages) }
      },
      migrate: (persistedState, version) => {
        let s = persistedState || {}
        if (version < 2) {
          // Old shape: top-level apiKey/model were always Gemini's.
          const providers = defaultProviderState()
          if (s.apiKey) {
            providers.gemini = { apiKey: s.apiKey, model: s.model || providers.gemini.model, enabled: true }
          }
          const { apiKey, model, ...rest } = s
          s = { ...rest, providers, activeProvider: 'gemini' }
        }
        if (version < 3) {
          s = {
            ...s,
            customModels: s.customModels || {},
            replyLanguage: s.replyLanguage || 'auto',
            voice: s.voice || { voiceURI: '', lang: 'id-ID', rate: 1, pitch: 1 },
          }
        }
        if (version < 4) {
          s = {
            ...s,
            wakeWordEnabled: s.wakeWordEnabled ?? false,
            wakeWord: s.wakeWord || 'hei jarvis',
          }
        }
        if (version < 5) {
          s = {
            ...s,
            ttsProvider: s.ttsProvider || 'browser',
            ttsKeys: s.ttsKeys || { elevenlabs: '', openai: '' },
            elevenLabsVoiceId: s.elevenLabsVoiceId || '',
            openaiVoice: s.openaiVoice || 'alloy',
            interruptEnabled: s.interruptEnabled ?? true,
            interruptPhrases: s.interruptPhrases || 'stop, oke, okay, berhenti',
          }
        }
        if (version < 6) {
          s = { ...s, researchEnabled: s.researchEnabled ?? true }
        }
        if (version < 7) {
          s = {
            ...s,
            ttsKeys: { elevenlabs: '', openai: '', google: '', camb: '', ...(s.ttsKeys || {}) },
            googleVoice: s.googleVoice || 'id-ID-Standard-A',
            cambVoiceId: s.cambVoiceId || '',
          }
        }
        if (version < 8) {
          s = { ...s, customProviders: s.customProviders || [] }
        }
        if (version < 9) {
          // Fills in `providers` entries for any built-in provider id added
          // after this user's state was first saved (e.g. Mistral, NVIDIA
          // NIM, etc. added later) — without this, providers[newId] stays
          // undefined and every place that reads providers[newId].enabled
          // crashes with "Cannot read properties of undefined".
          const providers = { ...s.providers }
          for (const p of PROVIDER_LIST) {
            if (!providers[p.id]) providers[p.id] = { apiKey: '', model: p.defaultModel, enabled: false }
          }
          s = { ...s, providers }
        }
        if (version < 10) {
          s = { ...s, assistantName: s.assistantName || 'JARVIS' }
        }
        return s
      },
    }
  )
)

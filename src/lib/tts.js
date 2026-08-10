// Thin wrapper around the browser's native SpeechSynthesis API, plus optional
// remote TTS backends (ElevenLabs, OpenAI) for higher-quality/custom voices.
// Only one thing (browser utterance OR remote audio) ever plays at a time —
// starting a new one always cancels whatever's currently going.

// Some browsers (Chrome especially) load voices asynchronously, so we warm
// the cache up front and refresh it when the list becomes available.
let cachedVoices = []
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => { cachedVoices = window.speechSynthesis.getVoices() }
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function getVoices() {
  if (!isSpeechSupported()) return []
  return cachedVoices.length ? cachedVoices : window.speechSynthesis.getVoices()
}

// Lets a component re-render once the async voice list finishes loading.
// Returns an unsubscribe function.
export function onVoicesChanged(callback) {
  if (!isSpeechSupported()) return () => {}
  const handler = () => { cachedVoices = window.speechSynthesis.getVoices(); callback(cachedVoices) }
  window.speechSynthesis.addEventListener('voiceschanged', handler)
  return () => window.speechSynthesis.removeEventListener('voiceschanged', handler)
}

// Strips markdown so it isn't read aloud literally ("asterisk asterisk",
// "hashtag", raw code, etc.) — mirrors what renderSafeMarkdown strips visually.
export function cleanTextForSpeech(text) {
  return (text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)]*)\)/g, '$1')
    .replace(/[*_#>~]+/g, ' ')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Picks the best available voice given a preferred voiceURI and/or lang,
// falling back to whatever the browser considers its default.
function pickVoice(preferredVoiceURI, lang) {
  const voices = getVoices()
  if (!voices.length) return null
  if (preferredVoiceURI) {
    const exact = voices.find((v) => v.voiceURI === preferredVoiceURI)
    if (exact) return exact
  }
  if (lang) {
    const langPrefix = lang.split('-')[0].toLowerCase()
    const byLang = voices.find((v) => v.lang?.toLowerCase().startsWith(langPrefix))
    if (byLang) return byLang
  }
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith('id')) ||
    voices.find((v) => v.default) ||
    voices[0]
  )
}

// -- Reactive "is something currently being spoken" state -------------------
// Both the browser engine and remote-audio engine funnel through this so any
// component (e.g. the barge-in interrupt listener) can react to playback
// starting/stopping without polling.
const speakingListeners = new Set()
let speakingState = false
function setSpeakingState(v) {
  if (speakingState === v) return
  speakingState = v
  speakingListeners.forEach((cb) => cb(v))
}
export function subscribeSpeaking(cb) {
  speakingListeners.add(cb)
  return () => speakingListeners.delete(cb)
}

// -- Remote TTS backends (ElevenLabs, OpenAI) --------------------------------
// Both call their API directly from the browser and play the returned audio
// via a plain <audio> element. Only one remote clip plays at a time.
let currentAudio = null
function stopRemoteAudio() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
}

async function speakElevenLabs(text, { apiKey, voiceId, rate = 1, onStart, onEnd, onError }) {
  if (!apiKey) { onError?.('API key ElevenLabs belum diisi di Settings.'); return }
  if (!voiceId) { onError?.('Voice ID ElevenLabs belum dipilih di Settings.'); return }
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })
    if (!res.ok) {
      let detail = ''
      try { detail = (await res.json())?.detail?.message || '' } catch { /* not json */ }
      onError?.(`ElevenLabs error ${res.status}${detail ? `: ${detail}` : ''}`)
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    stopRemoteAudio()
    window.speechSynthesis?.cancel()
    const audio = new Audio(url)
    audio.playbackRate = rate
    audio.onplay = () => { setSpeakingState(true); onStart?.() }
    const finish = () => { setSpeakingState(false); onEnd?.(); URL.revokeObjectURL(url); if (currentAudio === audio) currentAudio = null }
    audio.onended = finish
    audio.onerror = finish
    currentAudio = audio
    await audio.play()
  } catch (e) {
    onError?.(e?.message || 'Gagal memutar suara ElevenLabs.')
  }
}

const OPENAI_TTS_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']

async function speakOpenAI(text, { apiKey, voice = 'alloy', rate = 1, onStart, onEnd, onError }) {
  if (!apiKey) { onError?.('API key OpenAI belum diisi di Settings.'); return }
  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'tts-1', voice, input: text }),
    })
    if (!res.ok) {
      let detail = ''
      try { detail = (await res.json())?.error?.message || '' } catch { /* not json */ }
      onError?.(`OpenAI TTS error ${res.status}${detail ? `: ${detail}` : ''}`)
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    stopRemoteAudio()
    window.speechSynthesis?.cancel()
    const audio = new Audio(url)
    audio.playbackRate = rate
    audio.onplay = () => { setSpeakingState(true); onStart?.() }
    const finish = () => { setSpeakingState(false); onEnd?.(); URL.revokeObjectURL(url); if (currentAudio === audio) currentAudio = null }
    audio.onended = finish
    audio.onerror = finish
    currentAudio = audio
    await audio.play()
  } catch (e) {
    onError?.(e?.message || 'Gagal memutar suara OpenAI.')
  }
}

export { OPENAI_TTS_VOICES }

// A curated subset of Google Cloud TTS's Indonesian + English voices.
// Standard voices have a generous free tier (~4M characters/month); Wavenet
// voices sound noticeably better but have a smaller free allowance.
const GOOGLE_TTS_VOICES = [
  { id: 'id-ID-Standard-A', label: 'Indonesia — Standard A (wanita)' },
  { id: 'id-ID-Standard-B', label: 'Indonesia — Standard B (pria)' },
  { id: 'id-ID-Standard-C', label: 'Indonesia — Standard C (pria)' },
  { id: 'id-ID-Standard-D', label: 'Indonesia — Standard D (wanita)' },
  { id: 'id-ID-Wavenet-A', label: 'Indonesia — Wavenet A (wanita, lebih natural)' },
  { id: 'id-ID-Wavenet-B', label: 'Indonesia — Wavenet B (pria, lebih natural)' },
  { id: 'id-ID-Wavenet-C', label: 'Indonesia — Wavenet C (pria, lebih natural)' },
  { id: 'id-ID-Wavenet-D', label: 'Indonesia — Wavenet D (wanita, lebih natural)' },
  { id: 'en-US-Standard-C', label: 'English (US) — Standard C (wanita)' },
  { id: 'en-US-Neural2-D', label: 'English (US) — Neural2 D (pria)' },
]

async function speakGoogleCloud(text, { apiKey, voiceName = 'id-ID-Standard-A', rate = 1, onStart, onEnd, onError }) {
  if (!apiKey) { onError?.('API key Google Cloud TTS belum diisi di Settings.'); return }
  try {
    const languageCode = voiceName.split('-').slice(0, 2).join('-') || 'id-ID'
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode, name: voiceName },
        audioConfig: { audioEncoding: 'MP3', speakingRate: rate },
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      onError?.(`Google Cloud TTS error ${res.status}${body?.error?.message ? `: ${body.error.message}` : ''}`)
      return
    }
    const { audioContent } = await res.json()
    if (!audioContent) { onError?.('Google Cloud TTS tidak mengembalikan audio.'); return }
    const binary = atob(audioContent)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    stopRemoteAudio()
    window.speechSynthesis?.cancel()
    const audio = new Audio(url)
    audio.onplay = () => { setSpeakingState(true); onStart?.() }
    const finish = () => { setSpeakingState(false); onEnd?.(); URL.revokeObjectURL(url); if (currentAudio === audio) currentAudio = null }
    audio.onended = finish
    audio.onerror = finish
    currentAudio = audio
    await audio.play()
  } catch (e) {
    onError?.(e?.message || 'Gagal memutar suara Google Cloud TTS.')
  }
}

// Camb.ai's streaming TTS endpoint (/tts-stream) returns raw audio bytes
// directly in one response — no polling needed, unlike their async /tts job
// endpoint. voiceId is numeric (copy from Camb.ai Studio → Voice Library).
async function speakCamb(text, { apiKey, voiceId, lang = 'id-ID', rate = 1, onStart, onEnd, onError }) {
  if (!apiKey) { onError?.('API key Camb.ai belum diisi di Settings.'); return }
  if (!voiceId) { onError?.('Voice ID Camb.ai belum dipilih di Settings.'); return }
  try {
    const res = await fetch('https://client.camb.ai/apis/tts-stream', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice_id: Number(voiceId),
        language: (lang || 'id-ID').toLowerCase(),
        speech_model: 'mars-8.1-flash-beta',
        output_configuration: { format: 'mp3' },
      }),
    })
    if (!res.ok) {
      let detail = ''
      try { detail = (await res.json())?.message || '' } catch { /* not json */ }
      onError?.(`Camb.ai error ${res.status}${detail ? `: ${detail}` : ''}`)
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    stopRemoteAudio()
    window.speechSynthesis?.cancel()
    const audio = new Audio(url)
    audio.playbackRate = rate
    audio.onplay = () => { setSpeakingState(true); onStart?.() }
    const finish = () => { setSpeakingState(false); onEnd?.(); URL.revokeObjectURL(url); if (currentAudio === audio) currentAudio = null }
    audio.onended = finish
    audio.onerror = finish
    currentAudio = audio
    await audio.play()
  } catch (e) {
    onError?.(e?.message || 'Gagal memutar suara Camb.ai.')
  }
}

export { GOOGLE_TTS_VOICES }

// Speaks `text` aloud using whichever provider is passed in `opts.provider`
// ('browser' | 'elevenlabs' | 'openai' | 'google' | 'camb', default
// 'browser'). Cancels anything already playing first, since only one
// utterance/clip should ever be active. For the browser provider this is
// synchronous-ish (native API); for remote providers it kicks off an async
// fetch+play and reports back via onStart/onEnd/onError rather than a
// return value, since success can't be known synchronously. Returns false
// only for the "nothing to say" case.
export function speak(text, { provider = 'browser', rate = 1, pitch = 1, lang = 'id-ID', voiceURI, voice, apiKey, voiceId, voiceName, onStart, onEnd, onError } = {}) {
  const clean = cleanTextForSpeech(text)
  if (!clean) return false

  if (provider === 'elevenlabs') {
    speakElevenLabs(clean, { apiKey, voiceId, rate, onStart, onEnd, onError })
    return true
  }
  if (provider === 'openai') {
    speakOpenAI(clean, { apiKey, voice, rate, onStart, onEnd, onError })
    return true
  }
  if (provider === 'google') {
    speakGoogleCloud(clean, { apiKey, voiceName, rate, onStart, onEnd, onError })
    return true
  }
  if (provider === 'camb') {
    speakCamb(clean, { apiKey, voiceId, lang, rate, onStart, onEnd, onError })
    return true
  }

  if (!isSpeechSupported()) { onError?.('Text-to-speech browser tidak didukung.'); return false }

  stopRemoteAudio()
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(clean)
  const pickedVoice = pickVoice(voiceURI, lang)
  utterance.lang = pickedVoice?.lang || lang
  utterance.rate = rate
  utterance.pitch = pitch
  if (pickedVoice) utterance.voice = pickedVoice

  utterance.onstart = () => { setSpeakingState(true); onStart?.() }
  const finish = () => { setSpeakingState(false); onEnd?.() }
  utterance.onend = finish
  utterance.onerror = finish

  window.speechSynthesis.speak(utterance)
  return true
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
  stopRemoteAudio()
  setSpeakingState(false)
}

export function isSpeaking() {
  return (isSpeechSupported() && window.speechSynthesis.speaking) || !!currentAudio
}


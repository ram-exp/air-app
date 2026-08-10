import { useAssistantStore } from '@/store/useAssistantStore'
import { speak as speakEngine, stopSpeaking, isSpeaking, isSpeechSupported } from '@/lib/tts'

// Reads the user's chosen TTS provider + credentials/voice from the store and
// exposes a simple `speak(text, callbacks)` that always uses the right
// backend — browser voice, ElevenLabs, or OpenAI TTS — without every call
// site needing to know which one is active.
export function useTts() {
  const { ttsProvider, ttsKeys, elevenLabsVoiceId, openaiVoice, googleVoice, cambVoiceId, voice } = useAssistantStore()

  const speak = (text, { onStart, onEnd, onError } = {}) => {
    if (ttsProvider === 'elevenlabs') {
      return speakEngine(text, {
        provider: 'elevenlabs',
        apiKey: ttsKeys.elevenlabs,
        voiceId: elevenLabsVoiceId,
        rate: voice.rate,
        onStart,
        onEnd,
        onError,
      })
    }
    if (ttsProvider === 'openai') {
      return speakEngine(text, {
        provider: 'openai',
        apiKey: ttsKeys.openai,
        voice: openaiVoice,
        rate: voice.rate,
        onStart,
        onEnd,
        onError,
      })
    }
    if (ttsProvider === 'google') {
      return speakEngine(text, {
        provider: 'google',
        apiKey: ttsKeys.google,
        voiceName: googleVoice,
        rate: voice.rate,
        onStart,
        onEnd,
        onError,
      })
    }
    if (ttsProvider === 'camb') {
      return speakEngine(text, {
        provider: 'camb',
        apiKey: ttsKeys.camb,
        voiceId: cambVoiceId,
        lang: voice.lang,
        rate: voice.rate,
        onStart,
        onEnd,
        onError,
      })
    }
    return speakEngine(text, { provider: 'browser', ...voice, onStart, onEnd, onError })
  }

  // Browser voice needs speechSynthesis support; remote providers only need
  // their API key filled in — support itself isn't the blocker there.
  const supported = ttsProvider === 'browser' ? isSpeechSupported() : true

  return { speak, stop: stopSpeaking, isSpeaking, supported, provider: ttsProvider }
}

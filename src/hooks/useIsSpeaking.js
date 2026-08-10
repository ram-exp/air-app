import { useEffect, useState } from 'react'
import { subscribeSpeaking, isSpeaking } from '@/lib/tts'

// Reactively tracks whether the assistant is currently talking (browser TTS
// or remote ElevenLabs/OpenAI audio) — used to gate the barge-in interrupt
// listener and to pause wake-word listening while the assistant is speaking.
export function useIsSpeaking() {
  const [speaking, setSpeaking] = useState(() => isSpeaking())
  useEffect(() => subscribeSpeaking(setSpeaking), [])
  return speaking
}

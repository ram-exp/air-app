import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useTts } from '@/hooks/useTts'

// Tracks which message (by id) is currently being read aloud, so a chat UI
// can show a play/stop icon per assistant bubble. Independent from
// auto-speak — this is the "tap to hear this message" control. Uses
// whichever TTS provider (browser/ElevenLabs/OpenAI) is active in Settings.
export function useVoiceOutput() {
  const [speakingId, setSpeakingId] = useState(null)
  const mountedRef = useRef(true)
  const { speak, stop: stopEngine, supported } = useTts()

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopEngine()
    }
  }, [])

  const speakMessage = (id, text) => {
    if (speakingId === id) {
      stopEngine()
      setSpeakingId(null)
      return
    }
    stopEngine()
    const ok = speak(text, {
      onStart: () => mountedRef.current && setSpeakingId(id),
      onEnd: () => mountedRef.current && setSpeakingId((cur) => (cur === id ? null : cur)),
      onError: (msg) => {
        if (mountedRef.current) setSpeakingId((cur) => (cur === id ? null : cur))
        toast.error(msg)
      },
    })
    if (!ok) setSpeakingId(null)
  }

  const stop = () => {
    stopEngine()
    setSpeakingId(null)
  }

  return { speakingId, speakMessage, stop, supported }
}

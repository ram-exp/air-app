import { useEffect, useRef } from 'react'
import { containsAnyPhrase } from '@/lib/phraseMatch'

// Listens ONLY while the assistant is speaking, for a barge-in phrase like
// "stop" or "oke" — lets the user cut it off mid-sentence instead of having
// to wait for it to finish before they can talk again.
//
// `phrases` is a plain array of trigger words/phrases (loosely matched, case
// and punctuation-insensitive). Pass `enabled: false` (e.g. assistant isn't
// currently speaking) to tear the listener down.
export function useVoiceInterrupt({ enabled, phrases, onInterrupt, lang = 'id-ID' }) {
  const recognitionRef = useRef(null)
  const shouldRunRef = useRef(false)
  const onInterruptRef = useRef(onInterrupt)
  onInterruptRef.current = onInterrupt

  // Keep the phrase list stable across renders unless it actually changes,
  // so the effect below doesn't restart the listener every render.
  const phrasesKey = (phrases || []).join('|')

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const list = phrasesKey ? phrasesKey.split('|').filter(Boolean) : []

    if (!enabled || !SpeechRecognition || list.length === 0) {
      shouldRunRef.current = false
      recognitionRef.current?.stop()
      return
    }

    shouldRunRef.current = true

    const start = () => {
      if (!shouldRunRef.current) return

      const recognition = new SpeechRecognition()
      recognition.lang = lang
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript
          if (containsAnyPhrase(transcript, list)) {
            shouldRunRef.current = false
            try { recognition.stop() } catch { /* no-op */ }
            onInterruptRef.current?.()
            return
          }
        }
      }

      recognition.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          shouldRunRef.current = false
        }
      }

      recognition.onend = () => {
        if (shouldRunRef.current) start()
      }

      recognitionRef.current = recognition
      try {
        recognition.start()
      } catch {
        // A session may already be active mid-restart — ignore, onend/onerror will retry.
      }
    }

    start()

    return () => {
      shouldRunRef.current = false
      recognitionRef.current?.stop()
    }
  }, [enabled, phrasesKey, lang])
}

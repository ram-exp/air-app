import { useEffect, useRef } from 'react'
import { containsAnyPhrase } from '@/lib/phraseMatch'

// Listens in the background for a wake phrase (e.g. "hei jarvis"/"hey jarvis")
// and fires `onWake` the moment it's heard — no button press needed,
// Tony Stark-style.
//
// Only one SpeechRecognition session can usefully run at a time, so this hook
// is meant to be OFF (`enabled: false`) whenever something else needs the
// mic — while the user is actively dictating a command, while the assistant
// is talking back (avoids the mic picking up its own voice), or while the
// panel is mid-send. The caller drives that via the `enabled` flag.
//
// Because "always listening" browser recognition tends to auto-stop after a
// few seconds of silence, this hook restarts itself in a loop for as long as
// `enabled` stays true, so it behaves like a persistent background listener.
//
// `phrases` accepts an array so multiple variants (e.g. "hei jarvis" and
// "hey jarvis") can all trigger the same wake — any single string via
// `phrase` still works for back-compat.
export function useWakeWord({ enabled, phrase, phrases, onWake, onError, lang = 'id-ID' }) {
  const recognitionRef = useRef(null)
  const shouldRunRef = useRef(false)
  const onWakeRef = useRef(onWake)
  onWakeRef.current = onWake
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  const targets = (phrases && phrases.length ? phrases : [phrase]).filter((p) => (p || '').trim())
  const targetsKey = targets.join('|')

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!enabled) {
      shouldRunRef.current = false
      recognitionRef.current?.stop()
      return
    }
    if (!SpeechRecognition) {
      onErrorRef.current?.('unsupported')
      return
    }
    if (targets.length === 0) return

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
          if (containsAnyPhrase(transcript, targets)) {
            shouldRunRef.current = false
            try { recognition.stop() } catch { /* no-op */ }
            onWakeRef.current?.()
            return
          }
        }
      }

      recognition.onerror = (e) => {
        // 'no-speech' / 'aborted' / 'network' are routine on a long-running
        // listener — onend below handles restarting. A denied permission is
        // the one case worth giving up on entirely, and the one case worth
        // actually telling the user about (previously this failed 100%
        // silently — mic blocked meant the wake word just never worked,
        // with zero indication why).
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          shouldRunRef.current = false
          onErrorRef.current?.('not-allowed')
        }
      }

      recognition.onend = () => {
        if (shouldRunRef.current) start()
      }

      recognitionRef.current = recognition
      try {
        recognition.start()
      } catch {
        // Fires if a session is already active (e.g. rapid enable/disable
        // toggling) — the pending onend/onerror will trigger a clean retry.
      }
    }

    start()

    return () => {
      shouldRunRef.current = false
      recognitionRef.current?.stop()
    }
  }, [enabled, targetsKey, lang])
}

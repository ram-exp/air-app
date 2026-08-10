import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

// Wraps the browser's Web Speech API into a small start/stop toggle.
// `onResult(transcript)` is called once per finished utterance — the caller
// decides how to merge it into whatever input state it owns.
export function useVoiceInput(onResult) {
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  const toggle = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice input belum didukung di browser ini. Coba pakai Chrome atau Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'id-ID'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ')
      onResultRef.current?.(transcript)
    }

    recognition.onerror = (e) => {
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        toast.error('Gagal menangkap suara. Coba lagi.')
      }
      setIsRecording(false)
    }

    recognition.onend = () => setIsRecording(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  return { isRecording, toggle }
}

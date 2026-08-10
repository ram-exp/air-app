import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, X, Send, Mic, MicOff, Loader2, Maximize2, Trash2, Paperclip, Volume2, VolumeX } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button, Textarea } from '@/components/ui'
import { useAssistantChat } from '@/hooks/useAssistantChat'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useVoiceOutput } from '@/hooks/useVoiceOutput'
import { useWakeWord } from '@/hooks/useWakeWord'
import { useVoiceInterrupt } from '@/hooks/useVoiceInterrupt'
import { useIsSpeaking } from '@/hooks/useIsSpeaking'
import { useAssistantStore } from '@/store/useAssistantStore'
import { useTts } from '@/hooks/useTts'
import { parsePhraseList, getWakePhrases } from '@/lib/phraseMatch'
import { MessageBubble, AttachmentThumb } from '@/components/assistant/ChatBits'
import { filesToAttachments, humanFileSize, MAX_ATTACHMENTS, ACCEPTED_TYPES } from '@/lib/attachments'
import { cn } from '@/lib/utils'

const QUICK_ACTIONS = [
  'Set pomodoro 15 menit.',
  'Buatin task baru prioritas tinggi.',
  'Ringkas apa yang penting hari ini.',
]

// Instant, canned acknowledgements spoken the moment the wake word is heard
// — no AI round-trip and nothing needs to be typed out first. Purely a
// "yes, I'm listening" cue, picked at random for a bit of variety.
const WAKE_ACK_PHRASES = ['Yes, Sir.', 'Ready to help, Sir.']

export default function FloatingAssistant() {
  const { hasKey, enabledProviders, providerConfig, messages, loading, send, clearMessages, autoSpeak, setAutoSpeak } = useAssistantChat()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [pending, setPending] = useState([])
  const scrollRef = useRef()
  const fileRef = useRef()
  const panelRef = useRef()

  const autoSendRef = useRef(false)
  const { isRecording, toggle: toggleRecording } = useVoiceInput((transcript) => {
    if (autoSendRef.current) {
      // Came from a wake-word trigger — go straight to the AI, no click needed.
      autoSendRef.current = false
      doSend(transcript)
    } else {
      setInput((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript))
    }
  })
  const { speakingId, speakMessage, stop: stopSpeaking, supported: speechSupported } = useVoiceOutput()
  const onSpeakMessage = (id, text) => speakMessage(id, text)
  // Raw speak() (not tied to a chat bubble) — used for the instant wake-word
  // acknowledgement below, so it can play immediately without waiting on any
  // message being typed/rendered first.
  const { speak: speakRaw } = useTts()

  // Reactive "assistant is currently talking" flag — works across the
  // browser voice AND remote ElevenLabs/OpenAI audio, since lib/tts funnels
  // both through the same speaking-state pub/sub.
  const assistantSpeaking = useIsSpeaking()

  // Wake word ("Hei, Jarvis"-style): listens in the background and, on its
  // own, opens the panel, records the command, and sends it — fully
  // hands-free. Paused whenever a command is already being captured, the AI
  // is mid-reply, or it's currently talking (avoids hearing itself).
  const { wakeWordEnabled, assistantName, interruptEnabled, interruptPhrases, setWakeWordEnabled } = useAssistantStore()
  const wakePhrases = getWakePhrases(assistantName)
  const isRecordingRef = useRef(isRecording)
  isRecordingRef.current = isRecording
  const wakeWordErrorShownRef = useRef(false)
  useEffect(() => {
    if (wakeWordEnabled) wakeWordErrorShownRef.current = false
  }, [wakeWordEnabled])
  useWakeWord({
    enabled: wakeWordEnabled && hasKey && !isRecording && !loading && !assistantSpeaking,
    phrases: wakePhrases,
    onError: (kind) => {
      // Only surface this once per enable — otherwise a denied-permission
      // browser would toast on every restart loop.
      if (wakeWordErrorShownRef.current) return
      wakeWordErrorShownRef.current = true
      if (kind === 'not-allowed') {
        toast.error('Izin microphone ditolak — wake word butuh akses mic. Cek pengaturan izin situs di browser lu.')
        setWakeWordEnabled(false)
      } else if (kind === 'unsupported') {
        toast.error('Browser ini tidak mendukung speech recognition. Coba pakai Chrome/Edge.')
      }
    },
    onWake: () => {
      // Instant voice acknowledgement — spoken immediately, straight from
      // the wake detection, with no AI call and nothing typed out first.
      const ack = WAKE_ACK_PHRASES[Math.floor(Math.random() * WAKE_ACK_PHRASES.length)]
      speakRaw(ack)
      toast.success(`"Hey ${assistantName}" — ${ack}`)
      setOpen(true)
      autoSendRef.current = true
      // Small delay lets the wake-word recognition session fully release the
      // mic before the command-capture one claims it.
      setTimeout(() => {
        if (!isRecordingRef.current) toggleRecording()
      }, 250)
    },
  })

  // Barge-in: while the assistant is talking, listen for "stop"/"oke" (or
  // whatever's configured) and cut it off immediately — no more waiting for
  // it to finish before you can speak again.
  useVoiceInterrupt({
    enabled: interruptEnabled && assistantSpeaking,
    phrases: parsePhraseList(interruptPhrases),
    onInterrupt: () => {
      stopSpeaking()
      toast('Oke, berhenti.', { icon: '🤫' })
    },
  })

  // If recording ends without ever producing a result (silence, error,
  // manual stop mid-listen), clear the pending auto-send flag so a later
  // manual mic tap doesn't unexpectedly auto-send.
  const wasRecordingRef = useRef(isRecording)
  useEffect(() => {
    if (wasRecordingRef.current && !isRecording) autoSendRef.current = false
    wasRecordingRef.current = isRecording
  }, [isRecording])

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const onPickFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (pending.length + files.length > MAX_ATTACHMENTS) {
      toast.error(`Maksimal ${MAX_ATTACHMENTS} lampiran per pesan`)
      return
    }
    const { accepted, rejected } = await filesToAttachments(files)
    rejected.forEach((r) => toast.error(`${r.file.name}: ${r.reason}`))
    setPending((p) => [...p, ...accepted])
  }

  const removePending = (idx) => setPending((p) => p.filter((_, i) => i !== idx))

  const doSend = async (text) => {
    const content = (text ?? input).trim()
    if (!content && pending.length === 0) return
    const attachments = pending
    setInput('')
    setPending([])
    const result = await send(content, attachments)
    if (!result.ok && result.error) toast.error(result.error)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend() }
  }

  return (
    <div className="fixed right-4 md:right-6 bottom-6 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div
          ref={panelRef}
          className="w-[92vw] max-w-[380px] h-[min(600px,70vh)] flex flex-col rounded-3xl overflow-hidden glass-solid shadow-2xl shadow-black/20 border border-border-light dark:border-border-dark animate-pop origin-bottom-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark shrink-0">
            <div className="flex items-center gap-2 font-display font-semibold text-sm">
              <span className="h-7 w-7 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center">
                <Sparkles size={13} />
              </span>
              Asisten AI
            </div>
            <div className="flex items-center gap-1">
              {speechSupported && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-7 w-7 rounded-full', autoSpeak && '!bg-primary-500/15 !text-primary-500')}
                  onClick={() => { setAutoSpeak(!autoSpeak); stopSpeaking() }}
                  title={autoSpeak ? 'AI bersuara aktif — klik untuk matikan' : 'Aktifkan AI bersuara'}
                >
                  {autoSpeak ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </Button>
              )}
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => { clearMessages(); stopSpeaking() }} title="Bersihkan chat">
                  <Trash2 size={13} />
                </Button>
              )}
              <Link to="/assistant" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" title="Buka halaman penuh">
                  <Maximize2 size={13} />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setOpen(false)} title="Tutup">
                <X size={14} />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {enabledProviders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-2">
                <Sparkles size={20} className="text-amber-500 mb-2" />
                <p className="text-xs text-muted-light dark:text-muted-dark">
                  Belum ada provider AI aktif. Atur dulu di <Link to="/settings" className="text-primary-500 font-medium" onClick={() => setOpen(false)}>Settings</Link>.
                </p>
              </div>
            ) : !hasKey ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-2">
                <Sparkles size={20} className="text-amber-500 mb-2" />
                <p className="text-xs text-muted-light dark:text-muted-dark">
                  Tambahkan API key {providerConfig.label} di <Link to="/settings" className="text-primary-500 font-medium" onClick={() => setOpen(false)}>Settings</Link>.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-2">
                <div className="h-10 w-10 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center mb-2">
                  <Sparkles size={18} />
                </div>
                <p className="text-xs text-muted-light dark:text-muted-dark max-w-[240px] mb-3">Suruh langsung, dari halaman mana pun — nggak perlu buka halaman Assistant.</p>
                <div className="flex flex-col gap-1.5 w-full">
                  {QUICK_ACTIONS.map((q) => (
                    <button key={q} onClick={() => doSend(q)} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-300 transition-colors text-left">{q}</button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  m={m}
                  compact
                  onSpeak={onSpeakMessage}
                  isSpeaking={speakingId === m.id}
                  speechSupported={speechSupported}
                />
              ))
            )}
            {loading && !messages.some((m) => m.streaming) && (
              <div className="flex justify-start animate-fade-in">
                <div className="rounded-2xl rounded-bl-md px-3 py-2 bg-black/[0.05] dark:bg-white/[0.07] flex items-center gap-2 text-xs text-muted-light dark:text-muted-dark">
                  <Loader2 size={12} className="animate-spin" /> Berpikir...
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border-light dark:border-border-dark p-2.5 shrink-0">
            {pending.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {pending.map((a, i) => (
                  <div key={i}>
                    <AttachmentThumb a={a} onRemove={() => removePending(i)} size="sm" />
                    <p className="text-[8px] text-muted-light dark:text-muted-dark mt-0.5 w-12 truncate">{humanFileSize(a.size)}</p>
                  </div>
                ))}
              </div>
            )}
            {isRecording && (
              <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-rose-500">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" /> Mendengarkan...
              </div>
            )}
            <div className="flex items-end gap-1.5">
              <input ref={fileRef} type="file" multiple accept={ACCEPTED_TYPES.join(',')} className="hidden" onChange={onPickFiles} />
              <Button variant="secondary" size="icon" type="button" className="h-9 w-9 shrink-0" onClick={() => fileRef.current?.click()} title="Lampirkan file" disabled={!hasKey}>
                <Paperclip size={14} />
              </Button>
              <Button
                variant={isRecording ? 'primary' : 'secondary'}
                size="icon"
                type="button"
                className={cn('h-9 w-9 shrink-0', isRecording && 'animate-pulse')}
                onClick={toggleRecording}
                title={isRecording ? 'Berhenti merekam' : 'Bicara ke AI'}
                disabled={!hasKey}
              >
                {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
              </Button>
              <Textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Suruh AI-nya..."
                disabled={!hasKey}
                className="flex-1 max-h-24 !text-[13px] !py-2"
              />
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => doSend()} disabled={!hasKey || loading || (!input.trim() && pending.length === 0)}>
                <Send size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <Button
        size="icon"
        onClick={() => setOpen((o) => !o)}
        title={open ? 'Tutup asisten' : 'Buka asisten AI'}
        className={cn(
          'h-13 w-13 !h-13 !w-13 rounded-full shadow-lg shadow-primary-500/30 relative',
          open && 'rotate-90'
        )}
        style={{ height: '3.25rem', width: '3.25rem' }}
      >
        {open ? <X size={20} /> : <Sparkles size={20} />}
        {!open && loading && (
          <span className="absolute inset-0 rounded-full ring-2 ring-primary-400 animate-ping" />
        )}
      </Button>
    </div>
  )
}

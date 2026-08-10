import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Send, Loader2, Trash2, Settings as SettingsIcon, AlertCircle, Paperclip, X, Mic, MicOff, BrainCircuit, Zap, Volume2, VolumeX } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, Button, Textarea } from '@/components/ui'
import { useAssistantChat } from '@/hooks/useAssistantChat'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useVoiceOutput } from '@/hooks/useVoiceOutput'
import { MessageBubble, AttachmentThumb } from '@/components/assistant/ChatBits'
import { filesToAttachments, humanFileSize, MAX_ATTACHMENTS, ACCEPTED_TYPES } from '@/lib/attachments'
import { cn } from '@/lib/utils'

const QUICK_ACTIONS = [
  'Set pomodoro 15 menit buat fokus sekarang.',
  'Buatin task baru: review desain, prioritas tinggi.',
  'Tandai habit olahraga selesai hari ini.',
  'Simpan ide baru di brainstorm: redesain onboarding.',
  'Ringkas apa yang paling penting buat gue kerjain hari ini.',
]

export default function AssistantPage() {
  const {
    providers, providerConfig, providerState, activeProvider, setActiveProvider,
    enabledProviders, hasKey, messages, loading, send, clearMessages,
    includeContext, setIncludeContext, autoSpeak, setAutoSpeak,
  } = useAssistantChat()
  const [input, setInput] = useState('')
  const [pending, setPending] = useState([])
  const scrollRef = useRef()
  const fileRef = useRef()

  const { isRecording, toggle: toggleRecording } = useVoiceInput((transcript) => {
    setInput((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript))
  })
  const { speakingId, speakMessage, stop: stopSpeaking, supported: speechSupported } = useVoiceOutput()
  const onSpeakMessage = (id, text) => speakMessage(id, text)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

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
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-3 animate-fade-in">
        <h1 className="font-display text-xl font-semibold flex items-center gap-2">
          <span className="h-8 w-8 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center">
            <Sparkles size={16} />
          </span>
          AI Assistant
        </h1>
        <div className="flex items-center gap-2">
          {enabledProviders.length > 0 && (
            <div className="relative">
              <select
                value={activeProvider}
                onChange={(e) => setActiveProvider(e.target.value)}
                title="Pilih provider AI"
                className="h-9 pl-3 pr-7 rounded-full text-xs font-medium bg-black/[0.04] dark:bg-white/[0.06] border-none outline-none appearance-none cursor-pointer"
              >
                {enabledProviders.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}{!providers[p.id]?.apiKey ? ' (no key)' : ''}</option>
                ))}
              </select>
            </div>
          )}
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIncludeContext(!includeContext)}
            title={includeContext ? 'Konteks produktivitas aktif — klik untuk matikan' : 'Konteks produktivitas mati — klik untuk aktifkan'}
            className={cn(
              'rounded-full transition-all duration-200',
              includeContext && '!bg-primary-500/15 !text-primary-500 ring-1 ring-primary-500/40'
            )}
          >
            <BrainCircuit size={15} className={includeContext ? 'animate-pop' : ''} />
          </Button>
          {speechSupported && (
            <Button
              variant="secondary"
              size="icon"
              onClick={() => { setAutoSpeak(!autoSpeak); stopSpeaking() }}
              title={autoSpeak ? 'AI bersuara aktif — klik untuk matikan' : 'AI bersuara mati — klik untuk aktifkan balasan otomatis diucapkan'}
              className={cn(
                'rounded-full transition-all duration-200',
                autoSpeak && '!bg-primary-500/15 !text-primary-500 ring-1 ring-primary-500/40'
              )}
            >
              {autoSpeak ? <Volume2 size={15} className="animate-pop" /> : <VolumeX size={15} />}
            </Button>
          )}
          {messages.length > 0 && (
            <Button
              variant="secondary"
              size="icon"
              onClick={() => { clearMessages(); stopSpeaking() }}
              title="Bersihkan chat"
              className="rounded-full"
            >
              <Trash2 size={15} />
            </Button>
          )}
          <Link to="/settings">
            <Button
              variant="secondary"
              size="icon"
              title="Atur API key"
              className="rounded-full"
            >
              <SettingsIcon size={15} />
            </Button>
          </Link>
        </div>
      </div>

      {enabledProviders.length === 0 ? (
        <Card className="mb-3 flex items-center gap-3 border-amber-500/30 animate-fade-in">
          <AlertCircle size={18} className="text-amber-500 shrink-0" />
          <p className="text-sm">
            Belum ada provider AI yang aktif. Buka <Link to="/settings" className="text-primary-500 font-medium">Settings → AI Assistant</Link>, isi API key salah satu provider (semuanya ada free tier), lalu aktifkan.
          </p>
        </Card>
      ) : !hasKey ? (
        <Card className="mb-3 flex items-center gap-3 border-amber-500/30 animate-fade-in">
          <AlertCircle size={18} className="text-amber-500 shrink-0" />
          <p className="text-sm">
            Belum ada API key untuk <strong>{providerConfig.label}</strong>. Buka <Link to="/settings" className="text-primary-500 font-medium">Settings → AI Assistant</Link> untuk menambahkannya, atau pilih provider lain di pojok kanan atas.
          </p>
        </Card>
      ) : null}

      <Card className="flex-1 flex flex-col min-h-0 !p-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <div className="h-12 w-12 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center mb-3">
                <Zap size={22} />
              </div>
              <h3 className="font-display font-semibold mb-1">Tanya, atau langsung suruh gue kerjain</h3>
              <p className="text-sm text-muted-light dark:text-muted-dark max-w-sm mb-5">Bisa bikin/nyelesain task, ngatur timer Pomodoro, nandain habit, nyimpen ide, bookmark, catatan — semua fitur bisa lo perintah langsung dari chat atau suara. Coba salah satu di bawah ini.</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {QUICK_ACTIONS.map((q) => (
                  <button key={q} onClick={() => doSend(q)} className="text-xs px-3 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-300 transition-colors text-left">{q}</button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <MessageBubble
                key={m.id}
                m={m}
                onSpeak={onSpeakMessage}
                isSpeaking={speakingId === m.id}
                speechSupported={speechSupported}
              />
            ))
          )}
          {loading && !messages.some((m) => m.streaming) && (
            <div className="flex justify-start animate-fade-in">
              <div className="rounded-2xl rounded-bl-md px-4 py-2.5 bg-black/[0.05] dark:bg-white/[0.07] flex items-center gap-2 text-sm text-muted-light dark:text-muted-dark">
                <Loader2 size={14} className="animate-spin" /> Berpikir...
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border-light dark:border-border-dark p-3 shrink-0">
          {pending.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pending.map((a, i) => (
                <div key={i}>
                  <AttachmentThumb a={a} onRemove={() => removePending(i)} />
                  <p className="text-[9px] text-muted-light dark:text-muted-dark mt-0.5 w-16 truncate">{humanFileSize(a.size)}</p>
                </div>
              ))}
            </div>
          )}
          {isRecording && (
            <div className="flex items-center gap-1.5 mb-2 text-xs text-rose-500">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" /> Mendengarkan... bicara sekarang
            </div>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" multiple accept={ACCEPTED_TYPES.join(',')} className="hidden" onChange={onPickFiles} />
            <Button variant="secondary" size="icon" type="button" onClick={() => fileRef.current?.click()} title="Lampirkan gambar/file">
              <Paperclip size={16} />
            </Button>
            <Button
              variant={isRecording ? 'primary' : 'secondary'}
              size="icon"
              type="button"
              onClick={toggleRecording}
              title={isRecording ? 'Berhenti merekam' : 'Bicara ke AI'}
              className={isRecording ? 'animate-pulse' : ''}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            </Button>
            <Textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Tulis atau ucapkan perintah... (Enter untuk kirim)"
              className="flex-1 max-h-32"
            />
            <Button size="icon" onClick={() => doSend()} disabled={loading || (!input.trim() && pending.length === 0)}><Send size={16} /></Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

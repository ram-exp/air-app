import { useState } from 'react'
import { Copy, ArrowDownUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, Button, Textarea, Tabs } from '@/components/ui'

export default function Base64Tool() {
  const [mode, setMode] = useState('encode')
  const [input, setInput] = useState('Hello, AIR!')
  const [error, setError] = useState('')

  let output = ''
  try {
    output = mode === 'encode' ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input)))
    if (error) setError('')
  } catch {
    output = ''
  }

  const copy = () => { navigator.clipboard.writeText(output); toast.success('Copied') }
  const swap = () => { setMode(mode === 'encode' ? 'decode' : 'encode'); setInput(output) }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <Tabs tabs={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} active={mode} onChange={setMode} />
        <Button variant="secondary" size="sm" onClick={swap}><ArrowDownUp size={14} /> Swap</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">{mode === 'encode' ? 'Text' : 'Base64'}</label>
          <Textarea rows={8} className="font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-light dark:text-muted-dark">{mode === 'encode' ? 'Base64' : 'Text'}</label>
            <button onClick={copy} className="text-xs text-primary-500 flex items-center gap-1"><Copy size={12} /> Copy</button>
          </div>
          <Textarea rows={8} className="font-mono text-sm" value={output || 'Invalid input for decoding'} readOnly />
        </div>
      </div>
    </Card>
  )
}

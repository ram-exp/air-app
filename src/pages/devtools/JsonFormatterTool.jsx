import { useState } from 'react'
import { Copy, Sparkles, Minimize2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, Button, Textarea } from '@/components/ui'

export default function JsonFormatterTool() {
  const [input, setInput] = useState('{"name":"AIR","version":1,"features":["tasks","habits","goals"]}')
  const [error, setError] = useState('')

  const format = (spacing) => {
    try {
      const parsed = JSON.parse(input)
      setInput(JSON.stringify(parsed, null, spacing))
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }
  const copy = () => { navigator.clipboard.writeText(input); toast.success('Copied') }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-light dark:text-muted-dark">Paste JSON, then prettify, minify, or validate it.</p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => format(2)}><Sparkles size={13} /> Prettify</Button>
          <Button size="sm" variant="secondary" onClick={() => format(0)}><Minimize2 size={13} /> Minify</Button>
          <Button size="icon" onClick={copy}><Copy size={14} /></Button>
        </div>
      </div>
      <Textarea rows={14} className="font-mono text-xs" value={input} onChange={(e) => { setInput(e.target.value); setError('') }} />
      {error && <p className="text-xs text-rose-500 mt-2">Invalid JSON: {error}</p>}
    </Card>
  )
}

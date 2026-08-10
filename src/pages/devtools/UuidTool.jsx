import { useState } from 'react'
import { Copy, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, Button, Input } from '@/components/ui'

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export default function UuidTool() {
  const [count, setCount] = useState(5)
  const [list, setList] = useState(() => Array.from({ length: 5 }, uuidv4))

  const generate = () => setList(Array.from({ length: Math.max(1, Math.min(50, Number(count))) }, uuidv4))
  const copyAll = () => { navigator.clipboard.writeText(list.join('\n')); toast.success('Copied all') }
  const copyOne = (u) => { navigator.clipboard.writeText(u); toast.success('Copied') }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Input type="number" min="1" max="50" value={count} onChange={(e) => setCount(e.target.value)} className="w-24" />
        <Button onClick={generate}><RefreshCw size={14} /> Generate</Button>
        <Button variant="secondary" onClick={copyAll}><Copy size={14} /> Copy all</Button>
      </div>
      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {list.map((u, i) => (
          <div key={i} className="flex items-center gap-2 text-sm font-mono px-3 py-2 rounded-lg bg-black/[0.04] dark:bg-white/[0.06]">
            <span className="flex-1 truncate">{u}</span>
            <button onClick={() => copyOne(u)} className="hover:text-primary-500"><Copy size={13} /></button>
          </div>
        ))}
      </div>
    </Card>
  )
}

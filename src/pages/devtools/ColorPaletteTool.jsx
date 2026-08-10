import { useState } from 'react'
import { Copy, Plus, RefreshCw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button, Card } from '@/components/ui'
import { uid } from '@/lib/utils'

function randomHex() {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
}

export default function ColorPaletteTool() {
  const [colors, setColors] = useState(() => Array.from({ length: 5 }, () => ({ id: uid(), hex: randomHex() })))

  const copy = (hex) => { navigator.clipboard.writeText(hex); toast.success(`Copied ${hex}`) }
  const regenerate = () => setColors(Array.from({ length: colors.length }, () => ({ id: uid(), hex: randomHex() })))
  const addColor = () => setColors((c) => [...c, { id: uid(), hex: randomHex() }])
  const removeColor = (id) => setColors((c) => c.filter((x) => x.id !== id))
  const updateColor = (id, hex) => setColors((c) => c.map((x) => (x.id === id ? { ...x, hex } : x)))

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-light dark:text-muted-dark">Generate and fine-tune a color palette.</p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={addColor}><Plus size={14} /> Add</Button>
          <Button size="sm" onClick={regenerate}><RefreshCw size={14} /> Randomize</Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {colors.map((c) => (
          <div key={c.id} className="rounded-2xl overflow-hidden border border-border-light dark:border-border-dark group">
            <div className="h-24" style={{ backgroundColor: c.hex }} />
            <div className="p-2 flex items-center gap-1">
              <input value={c.hex} onChange={(e) => updateColor(c.id, e.target.value)} className="flex-1 min-w-0 text-xs font-mono bg-transparent outline-none" />
              <button onClick={() => copy(c.hex)} className="hover:text-primary-500"><Copy size={13} /></button>
              <button onClick={() => removeColor(c.id)} className="opacity-0 group-hover:opacity-100 hover:text-rose-500"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

import { useState } from 'react'
import { Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, Button, Input, Select } from '@/components/ui'

export default function GradientTool() {
  const [c1, setC1] = useState('#5A4FFF')
  const [c2, setC2] = useState('#2FD9C4')
  const [angle, setAngle] = useState(135)
  const [type, setType] = useState('linear')

  const css = type === 'linear'
    ? `background: linear-gradient(${angle}deg, ${c1}, ${c2});`
    : `background: radial-gradient(circle, ${c1}, ${c2});`

  const copy = () => { navigator.clipboard.writeText(css); toast.success('CSS copied') }

  return (
    <Card>
      <div
        className="h-40 rounded-2xl mb-4"
        style={{ background: type === 'linear' ? `linear-gradient(${angle}deg, ${c1}, ${c2})` : `radial-gradient(circle, ${c1}, ${c2})` }}
      />
      <div className="grid sm:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Color 1</label>
          <input type="color" value={c1} onChange={(e) => setC1(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Color 2</label>
          <input type="color" value={c2} onChange={(e) => setC2(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Type</label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-light dark:text-muted-dark mb-1 block">Angle</label>
          <Input type="number" value={angle} onChange={(e) => setAngle(e.target.value)} disabled={type === 'radial'} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs font-mono bg-black/[0.04] dark:bg-white/[0.06] rounded-xl px-3 py-2.5 overflow-x-auto">{css}</code>
        <Button size="icon" onClick={copy}><Copy size={15} /></Button>
      </div>
    </Card>
  )
}

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function TasksTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="tasksFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2FD9C4" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#2FD9C4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} width={28} />
        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, background: 'var(--color-surface-dark)', color: '#fff' }} />
        <Area type="monotone" dataKey="completed" stroke="#1EC4B0" strokeWidth={2.5} fill="url(#tasksFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

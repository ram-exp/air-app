import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function GoalsBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.15} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="title" width={140} tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, background: 'var(--color-surface-dark)', color: '#fff' }} />
        <Bar dataKey="progress" radius={[0, 8, 8, 0]} fill="#5A4FFF" maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  )
}

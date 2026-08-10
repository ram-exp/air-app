import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

const COLORS = { primary: '#5A4FFF', teal: '#1EC4B0', amber: '#F7A331', rose: '#F4506A' }

export default function HabitStreakChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} width={28} />
        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, background: 'var(--color-surface-dark)', color: '#fff' }} />
        <Bar dataKey="streak" radius={[8, 8, 0, 0]} maxBarSize={40}>
          {data.map((d, i) => <Cell key={i} fill={COLORS[d.color] || COLORS.primary} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function WeeklyFocusChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} width={28} />
        <Tooltip
          cursor={{ fill: 'currentColor', opacity: 0.06 }}
          contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, background: 'var(--color-surface-dark)', color: '#fff' }}
        />
        <Bar dataKey="minutes" radius={[8, 8, 8, 8]} fill="#5A4FFF" maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}

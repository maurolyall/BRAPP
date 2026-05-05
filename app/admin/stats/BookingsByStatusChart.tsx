'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Props {
  data: { name: string; value: number; color: string }[]
}

export default function BookingsByStatusChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin datos aún.</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${Number(value)} bookings`, '']} />
        <Legend iconType="circle" iconSize={7} formatter={(value) => <span style={{ fontSize: 10, color: '#6c757d' }}>{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}

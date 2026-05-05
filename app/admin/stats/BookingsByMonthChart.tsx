'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Props {
  data: { mes: string; bookings: number }[]
}

export default function BookingsByMonthChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.bookings, 0)
  if (total === 0) return <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin datos aún.</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip formatter={(value) => [`${Number(value)} bookings`, '']} />
        <Line type="monotone" dataKey="bookings" stroke="#E60611" strokeWidth={2.5} dot={{ fill: '#E60611', r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

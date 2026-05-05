'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#E60611', '#2563eb', '#7c3aed', '#059669', '#d97706', '#16a34a']

interface Props {
  data: { name: string; value: number }[]
}

export default function BookingsByCategoryChart({ data }: Props) {
  if (data.length === 0) return <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin datos aún.</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={32}>
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: '#f3f3f3' }} formatter={(value: number) => [`${value} bookings`, '']} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

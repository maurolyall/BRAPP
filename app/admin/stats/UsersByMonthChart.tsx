'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

interface Props {
  data: { mes: string; clientes: number; proveedores: number }[]
}

export default function UsersByMonthChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.clientes + d.proveedores, 0)
  if (total === 0) return <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin datos aún.</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#6c757d' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip />
        <Legend iconType="circle" iconSize={7} formatter={(value) => <span style={{ fontSize: 10, color: '#6c757d' }}>{value}</span>} />
        <Bar dataKey="clientes" fill="#2563eb" radius={[4, 4, 0, 0]} />
        <Bar dataKey="proveedores" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

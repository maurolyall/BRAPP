'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

interface Props {
  data: { date: string; impressions: number; clicks: number }[]
}

export default function AdStatsChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.impressions + d.clicks, 0)

  if (total === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
        Sin datos en los últimos 30 días.
      </p>
    )
  }

  const formatted = data.map((d) => ({
    ...d,
    label: d.date.slice(5), // "MM-DD"
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#6c757d' }}
          axisLine={false}
          tickLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6c757d' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          formatter={(value, name) => [
            Number(value).toLocaleString('es-AR'),
            name === 'impressions' ? 'Impresiones' : 'Clicks',
          ]}
          labelFormatter={(label) => `Fecha: ${label}`}
        />
        <Legend
          formatter={(value) => value === 'impressions' ? 'Impresiones' : 'Clicks'}
          wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
        />
        <Line
          type="monotone"
          dataKey="impressions"
          stroke="#2563eb"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="clicks"
          stroke="#7c3aed"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

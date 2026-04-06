export const ACTIVE_STATUSES = ['searching', 'pending', 'confirmed']

export const STATUS_LABEL: Record<string, string> = {
  searching:  'Buscando proveedor',
  pending:    'Pendiente',
  confirmed:  'Confirmada',
  completed:  'Completada',
  cancelled:  'Cancelada',
}

export const DATE_LABEL: Record<string, string> = {
  today:      'Hoy',
  coordinate: 'A coordinar',
}

export const ROADMAP_STEPS = [
  { key: 'searching', label: 'Buscando proveedor' },
  { key: 'pending',   label: 'Pendiente' },
  { key: 'confirmed', label: 'Confirmada' },
  { key: 'completed', label: 'Completada' },
]

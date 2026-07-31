export interface ChatStep {
  id: string
  question: string
  chips?: string[]
  freeText?: boolean   // si true, muestra input de texto libre además de chips
}

export interface CategoryFlow {
  steps: ChatStep[]
}

// Flujo específico por categoría (match por nombre normalizado)
const FLOWS: Record<string, CategoryFlow> = {
  'limpieza': {
    steps: [
      { id: 'type', question: '¿Qué tipo de limpieza necesitás?', chips: ['Limpieza general', 'Limpieza profunda', 'Post obra', 'Mudanza (entrada/salida)', 'Otro'] },
      { id: 'rooms', question: '¿Cuántos ambientes tiene el lugar?', chips: ['1', '2', '3', '4', '5+'] },
      { id: 'products', question: '¿Necesitás que lleven productos de limpieza?', chips: ['Sí', 'No'] },
    ],
  },
  'plomero': {
    steps: [
      { id: 'type', question: '¿Qué tipo de trabajo necesitás?', chips: ['Pérdida de agua', 'Destapación', 'Instalación', 'Calefacción', 'Otro'] },
      { id: 'urgency', question: '¿Es urgente?', chips: ['Sí, es urgente', 'Puede esperar unos días'] },
    ],
  },
  'electricista': {
    steps: [
      { id: 'type', question: '¿Qué tipo de trabajo necesitás?', chips: ['Instalación nueva', 'Reparación', 'Revisión/inspección', 'Iluminación', 'Otro'] },
      { id: 'urgency', question: '¿Es urgente?', chips: ['Sí, sin luz', 'No, puede esperar'] },
    ],
  },
  'albanil': {
    steps: [
      { id: 'type', question: '¿Qué tipo de trabajo necesitás?', chips: ['Reparación', 'Construcción', 'Revestimiento', 'Pintura', 'Otro'] },
      { id: 'size', question: '¿Qué tamaño tiene el trabajo?', chips: ['Pequeño (horas)', 'Mediano (1-2 días)', 'Grande (+3 días)'] },
    ],
  },
  'cerrajero': {
    steps: [
      { id: 'type', question: '¿Qué necesitás?', chips: ['Abrir puerta', 'Cambiar cerradura', 'Copia de llaves', 'Instalar cerradura', 'Otro'] },
      { id: 'urgency', question: '¿Es urgente?', chips: ['Sí, estoy afuera', 'No, puedo esperar'] },
    ],
  },
  'jardinero': {
    steps: [
      { id: 'type', question: '¿Qué tipo de trabajo necesitás?', chips: ['Corte de césped', 'Poda', 'Diseño de jardín', 'Mantenimiento', 'Otro'] },
      { id: 'size', question: '¿Qué tamaño tiene el jardín?', chips: ['Pequeño', 'Mediano', 'Grande'] },
    ],
  },
  'pintor': {
    steps: [
      { id: 'type', question: '¿Qué necesitás pintar?', chips: ['Interior', 'Exterior', 'Frente', 'Rejas/metal', 'Otro'] },
      { id: 'rooms', question: '¿Cuántos ambientes?', chips: ['1', '2-3', '4-5', 'Toda la casa'] },
    ],
  },
  'cocinero': {
    steps: [
      { id: 'type', question: '¿Para qué ocasión?', chips: ['Evento/fiesta', 'Servicio semanal', 'Preparación de viandas', 'Otro'] },
      { id: 'people', question: '¿Para cuántas personas?', chips: ['1-5', '6-15', '16-30', '+30'] },
    ],
  },
}

// Flujo genérico para categorías sin flujo específico
const DEFAULT_FLOW: CategoryFlow = {
  steps: [
    { id: 'description', question: '¿Qué necesitás exactamente?', freeText: true, chips: ['Reparación', 'Instalación', 'Mantenimiento', 'Otro'] },
    { id: 'urgency', question: '¿Con qué urgencia lo necesitás?', chips: ['Hoy o mañana', 'Esta semana', 'Sin urgencia'] },
  ],
}

export function getFlowForCategory(categoryName: string): CategoryFlow {
  const normalized = categoryName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const key = Object.keys(FLOWS).find((k) => normalized.includes(k))
  return key ? FLOWS[key] : DEFAULT_FLOW
}

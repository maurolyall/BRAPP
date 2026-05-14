import { createClient } from '@/lib/supabaseClient'
import { UserRole } from '@/types'

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos.',
  'Email not confirmed': 'Confirmá tu email antes de ingresar.',
  'Too many requests': 'Demasiados intentos. Esperá unos minutos.',
  'User not found': 'No existe una cuenta con ese email.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  'User already registered': 'Ya existe una cuenta con ese email.',
  'Email already in use': 'Ya existe una cuenta con ese email.',
}

function translateError(msg: string): string {
  return AUTH_ERRORS[msg] ?? 'Ocurrió un error. Intentá de nuevo.'
}

export async function login(email: string, password: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error ? translateError(error.message) : null }
}

export async function register(
  email: string,
  password: string,
  fullName: string,
  role: UserRole
) {
  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
    },
  })

  if (error) {
    return { error: translateError(error.message) }
  }

  return { error: null }
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

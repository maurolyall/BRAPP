import { createClient } from '@/lib/supabaseClient'
import { UserRole } from '@/types'

export async function login(email: string, password: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error?.message ?? null }
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
    return { error: error.message }
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

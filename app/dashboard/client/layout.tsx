import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabaseServer'

export default async function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (profile?.role === 'provider') {
    redirect('/dashboard/provider')
  }

  return <>{children}</>
}

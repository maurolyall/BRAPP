import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabaseServer'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import BottomNav from '@/components/dashboard/BottomNav'
import ToastProvider from '@/components/ui/ToastProvider'
import DashboardMain from '@/components/dashboard/DashboardMain'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'user'

  return (
    <ToastProvider>
      <main className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-body)' }}>
        <DashboardHeader />
        <DashboardMain>{children}</DashboardMain>
        <BottomNav role={role} userId={user.id} />
      </main>
    </ToastProvider>
  )
}

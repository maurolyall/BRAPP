import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabaseServer'
import PublicHeader from '@/components/layout/PublicHeader'
import BottomNav from '@/components/dashboard/BottomNav'
import ToastProvider from '@/components/ui/ToastProvider'

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
        <PublicHeader logoHref="/dashboard" />
        <div className="flex-1 px-4 pt-8 pb-40">
          {children}
        </div>
        <BottomNav role={role} />
      </main>
    </ToastProvider>
  )
}

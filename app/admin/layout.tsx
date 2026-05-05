import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabaseServer'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-body)' }}>
      <AdminSidebar />
      <main className="flex-1 ml-56 p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}

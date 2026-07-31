import { createServerClient } from '@/lib/supabaseServer'
import GuidedChatView from '@/components/dashboard/client/GuidedChatView'

export default async function GeneralChatPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: categories }, { data: profile }] = await Promise.all([
    supabase.from('service_categories').select('id, name').eq('active', true).order('name'),
    supabase.from('profiles').select('address, city, full_name').eq('id', user!.id).single(),
  ])

  const userAddress = [profile?.address, profile?.city].filter(Boolean).join(', ') || ''

  return <GuidedChatView categories={categories ?? []} userAddress={userAddress} />
}

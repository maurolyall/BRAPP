import { createServerClient } from '@/lib/supabaseServer'
import ProfileCompletionCard from '@/components/dashboard/provider/ProfileCompletionCard'
import ProfileTabs from '@/components/dashboard/provider/ProfileTabs'

export default async function ProviderProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: categories }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone, date_of_birth, dni, cuit, business_name, city, address, floor_apt, lot, avatar_url').eq('id', user!.id).single(),
    supabase.from('provider_categories').select('category_id, service_categories(id, name, icon_url)').eq('provider_id', user!.id),
  ])

  const completionItems = [
    !!profile?.full_name,
    !!profile?.phone,
    !!profile?.date_of_birth,
    !!profile?.dni,
    !!profile?.cuit,
    !!profile?.business_name,
    !!profile?.city,
    !!profile?.address,
    !!profile?.floor_apt,
    !!profile?.lot,
  ]
  const percentage = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100)

  return (
    <div className="flex flex-col gap-4">
      <div className="animate-fade-in">
        <ProfileCompletionCard percentage={percentage} />
      </div>
      <div className="animate-fade-in" style={{ animationDelay: '80ms' }}>
        <ProfileTabs
          userId={user!.id}
          avatarUrl={profile?.avatar_url ?? null}
          profile={{
            full_name: profile?.full_name ?? '',
            phone: profile?.phone ?? '',
            date_of_birth: profile?.date_of_birth ?? '',
            dni: profile?.dni ?? '',
            cuit: profile?.cuit ?? '',
            business_name: profile?.business_name ?? '',
            city: profile?.city ?? '',
            address: profile?.address ?? '',
            floor_apt: profile?.floor_apt ?? '',
            lot: profile?.lot ?? '',
          }}
          categories={(categories ?? []).map((c) => {
            const sc = c.service_categories as unknown as { id: string; name: string; icon_url: string | null } | null
            return { id: c.category_id, name: sc?.name ?? '', icon_url: sc?.icon_url ?? null }
          })}
        />
      </div>
    </div>
  )
}

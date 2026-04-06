import { createServerClient } from '@/lib/supabaseServer'
import AvatarUpload from '@/components/dashboard/provider/AvatarUpload'
import ClientProfileForm from '@/components/dashboard/client/ProfileForm'

export default async function ClientProfileEditPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, date_of_birth, city, address, floor_apt, lot, avatar_url')
    .eq('id', user!.id)
    .single()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>Editar perfil</h1>
      <AvatarUpload userId={user!.id} avatarUrl={profile?.avatar_url ?? null} />
      <ClientProfileForm
        profile={{
          full_name: profile?.full_name ?? '',
          phone: profile?.phone ?? '',
          date_of_birth: profile?.date_of_birth ?? '',
          city: profile?.city ?? '',
          address: profile?.address ?? '',
          floor_apt: profile?.floor_apt ?? '',
          lot: profile?.lot ?? '',
        }}
      />
    </div>
  )
}

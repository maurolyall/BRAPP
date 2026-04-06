import { createServerClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import BookingRequestForm from '@/components/dashboard/client/BookingRequestForm'

interface Props {
  params: Promise<{ categoryId: string }>
}

export default async function BookingRequestPage({ params }: Props) {
  const { categoryId } = await params
  const supabase = await createServerClient()

  const [{ data: category }, { data: { user } }] = await Promise.all([
    supabase
      .from('service_categories')
      .select('id, name')
      .eq('id', categoryId)
      .single(),
    supabase.auth.getUser(),
  ])

  if (!category) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('address, floor_apt, lot, city')
    .eq('id', user!.id)
    .single()

  const defaultAddress = [
    profile?.address,
    profile?.floor_apt,
    profile?.lot,
    profile?.city,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold animate-fade-in" style={{ color: 'var(--text-dark)' }}>
        {category.name}
      </h1>
      <div className="animate-fade-in" style={{ animationDelay: '60ms' }}>
        <BookingRequestForm
          userId={user!.id}
          categoryId={category.id}
          defaultAddress={defaultAddress}
        />
      </div>
    </div>
  )
}

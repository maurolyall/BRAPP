import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabaseServer'
import ServiceConfigForm from '@/components/dashboard/provider/ServiceConfigForm'
import BackButton from '@/components/ui/BackButton'

interface Props {
  params: Promise<{ categoryId: string }>
}

export default async function ServiceConfigPage({ params }: Props) {
  const { categoryId } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: pc }, { data: category }] = await Promise.all([
    supabase
      .from('provider_categories')
      .select('professional_description, visit_price, labor_warranty, years_experience')
      .eq('provider_id', user!.id)
      .eq('category_id', categoryId)
      .single(),
    supabase
      .from('service_categories')
      .select('name, icon_url')
      .eq('id', categoryId)
      .single(),
  ])

  if (!pc || !category) notFound()

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex items-center gap-3">
        <BackButton href="/dashboard/provider/profile" />
        <div className="flex items-center gap-3">
          {category.icon_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={category.icon_url} alt={category.name} className="w-10 h-10 object-contain" />
          )}
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>
            {category.name}
          </h1>
        </div>
      </div>

      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
      >
        <ServiceConfigForm
          providerId={user!.id}
          categoryId={categoryId}
          categoryName={category.name}
          initialData={{
            professional_description: pc.professional_description,
            visit_price: pc.visit_price,
            labor_warranty: pc.labor_warranty,
            years_experience: pc.years_experience,
          }}
        />
      </div>
    </div>
  )
}

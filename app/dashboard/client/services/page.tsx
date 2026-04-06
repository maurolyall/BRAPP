import { createServerClient } from '@/lib/supabaseServer'
import ServiceCategoryGrid from '@/components/dashboard/client/ServiceCategoryGrid'

export default async function ClientServicesPage() {
  const supabase = await createServerClient()

  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, name, icon_url')
    .eq('active', true)
    .order('name')

  return (
    <div className="flex flex-col gap-4">
      <div className="animate-fade-in">
        <ServiceCategoryGrid categories={categories ?? []} />
      </div>
    </div>
  )
}

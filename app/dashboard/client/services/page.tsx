import { createServerClient } from '@/lib/supabaseServer'
import ServiceCategoryGrid from '@/components/dashboard/client/ServiceCategoryGrid'
import AdSlider from '@/components/dashboard/AdSlider'
import Link from 'next/link'

export default async function ClientServicesPage() {
  const supabase = await createServerClient()

  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, name, icon_url')
    .eq('active', true)
    .order('name')

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-in">
        <ServiceCategoryGrid categories={categories ?? []} />
      </div>

      {/* Beneficios */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-1.5" style={{ color: 'var(--text-dark)' }}>
            Beneficios Botón
            <img src="/icons/tag.svg" alt="beneficios" width={20} height={20} />
          </h2>
          <Link
            href="#"
            className="text-xs font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            Ver todos los beneficios
          </Link>
        </div>
        <AdSlider target="client" />
      </div>
    </div>
  )
}

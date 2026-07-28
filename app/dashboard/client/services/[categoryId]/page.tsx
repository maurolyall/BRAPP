import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import ServiceChatView from '@/components/dashboard/client/ServiceChatView'

interface Props {
  params: Promise<{ categoryId: string }>
}

/**
 * Las solicitudes ya no se crean por formulario: la orden la genera el bot de
 * MoP durante la conversación. Esta página abre el chat con el pedido inicial
 * ya enviado.
 */
export default async function ServiceChatPage({ params }: Props) {
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

  return (
    // La vista lee `?new=1` con useSearchParams, que necesita un límite de Suspense.
    <Suspense fallback={<div className="flex-1" />}>
      <ServiceChatView
        currentUserId={user!.id}
        categoryId={category.id}
        categoryName={category.name}
      />
    </Suspense>
  )
}

import { createServerClient } from '@/lib/supabaseServer'
import ServiceCategoryGrid from '@/components/dashboard/client/ServiceCategoryGrid'
import StoriesRow from '@/components/dashboard/stories/StoriesRow'

export default async function ClientServicesPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: categories }, { data: stories }, { data: views }] = await Promise.all([
    supabase
      .from('service_categories')
      .select('id, name, icon_url')
      .eq('active', true)
      .order('name'),

    supabase
      .from('stories')
      .select('id, title, image_url, link_url, created_at')
      .eq('active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('sort_order', { ascending: true }),

    user
      ? supabase
          .from('story_views')
          .select('story_id')
          .eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
  ])

  const viewedIds = (views ?? []).map((v: { story_id: string }) => v.story_id)

  return (
    <div className="flex flex-col gap-5">
      {stories && stories.length > 0 && (
        <StoriesRow
          stories={stories}
          currentUserId={user?.id ?? ''}
          viewedIds={viewedIds}
        />
      )}
      <div className="animate-fade-in">
        <ServiceCategoryGrid categories={categories ?? []} />
      </div>
    </div>
  )
}

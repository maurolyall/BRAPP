import { createAdminClient } from '@/lib/supabaseAdmin'
import { createServerClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import StoriesAdminClient from './StoriesAdminClient'

export default async function AdminStoriesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminClient = createAdminClient()

  const [{ data: stories }, { data: views }] = await Promise.all([
    adminClient
      .from('stories')
      .select('id, title, image_url, link_url, sort_order, active, expires_at, created_at')
      .order('sort_order', { ascending: true }),

    adminClient
      .from('story_views')
      .select('story_id'),
  ])

  // Count views per story
  const viewCounts: Record<string, number> = {}
  for (const v of views ?? []) {
    viewCounts[v.story_id] = (viewCounts[v.story_id] ?? 0) + 1
  }

  const storiesWithViews = (stories ?? []).map((s) => ({
    ...s,
    view_count: viewCounts[s.id] ?? 0,
  }))

  return <StoriesAdminClient initialStories={storiesWithViews} />
}

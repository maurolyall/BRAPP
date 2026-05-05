import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const name = formData.get('name') as string
  const file = formData.get('icon') as File | null

  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  const adminClient = createAdminClient()
  let icon_url: string | null = null

  if (file && file.size > 0) {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await adminClient.storage
      .from('category-icons')
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: urlData } = adminClient.storage.from('category-icons').getPublicUrl(path)
    icon_url = urlData.publicUrl
  }

  const { error } = await adminClient
    .from('service_categories')
    .insert({ name: name.trim(), icon_url, active: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  try {
    const { data: site } = await supabaseAdmin
      .from('sites').select('id').eq('url', url).single()

    if (!site) return NextResponse.json({ competitors: [] })

    const { data } = await supabaseAdmin
      .from('competitors').select('*').eq('site_id', site.id).order('created_at')

    return NextResponse.json({ competitors: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { siteUrl, competitorUrl, name } = await req.json()

  try {
    const { data: site } = await supabaseAdmin
      .from('sites')
      .upsert({ url: siteUrl }, { onConflict: 'url' })
      .select().single()

    const { data, error } = await supabaseAdmin
      .from('competitors')
      .insert({ site_id: site!.id, url: competitorUrl, name: name || competitorUrl })
      .select().single()

    if (error) throw error
    return NextResponse.json({ competitor: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  try {
    await supabaseAdmin.from('competitors').delete().eq('id', id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

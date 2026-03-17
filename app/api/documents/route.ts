import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  try {
    const { data: site } = await supabaseAdmin
      .from('sites')
      .select('id')
      .eq('url', url)
      .single()

    if (!site) return NextResponse.json({ documents: [] })

    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('site_id', site.id)

    if (error) throw error
    return NextResponse.json({ documents: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { url, type, content } = await req.json()

  try {
    // Ensure site exists
    const { data: site } = await supabaseAdmin
      .from('sites')
      .upsert({ url }, { onConflict: 'url' })
      .select()
      .single()

    if (!site) throw new Error('Could not find or create site')

    // Upsert document
    const { data, error } = await supabaseAdmin
      .from('documents')
      .upsert(
        { site_id: site.id, type, content, updated_at: new Date().toISOString() },
        { onConflict: 'site_id,type' }
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ document: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

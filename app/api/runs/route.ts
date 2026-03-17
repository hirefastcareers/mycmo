import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST: save a completed run to Supabase
export async function POST(req: NextRequest) {
  const { url, title, agentResults, pageSpeed, triggeredBy = 'manual' } = await req.json()

  try {
    // Upsert site
    const { data: site, error: siteErr } = await supabaseAdmin
      .from('sites')
      .upsert({ url, title }, { onConflict: 'url' })
      .select()
      .single()

    if (siteErr) throw siteErr

    // Create run
    const { data: run, error: runErr } = await supabaseAdmin
      .from('runs')
      .insert({ site_id: site.id, triggered_by: triggeredBy })
      .select()
      .single()

    if (runErr) throw runErr

    // Save agent results
    if (agentResults && Object.keys(agentResults).length > 0) {
      const rows = Object.entries(agentResults).map(([agentId, data]: [string, any]) => ({
        run_id: run.id,
        agent_id: agentId,
        result: data.result || '',
        summary: data.summary || '',
        status: data.status || 'done',
      }))

      const { error: agentErr } = await supabaseAdmin.from('agent_results').insert(rows)
      if (agentErr) throw agentErr
    }

    // Save PageSpeed
    if (pageSpeed && !pageSpeed.error) {
      const { error: psErr } = await supabaseAdmin.from('pagespeed_results').insert({
        run_id: run.id,
        performance: pageSpeed.performance,
        accessibility: pageSpeed.accessibility,
        best_practices: pageSpeed.bestPractices,
        seo: pageSpeed.seo,
        lcp: pageSpeed.coreWebVitals?.lcp,
        tbt: pageSpeed.coreWebVitals?.tbt,
        cls: pageSpeed.coreWebVitals?.cls,
        fcp: pageSpeed.coreWebVitals?.fcp,
      })
      if (psErr) console.error('PageSpeed save error:', psErr)
    }

    return NextResponse.json({ success: true, runId: run.id, siteId: site.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET: fetch run history for a site
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const runId = searchParams.get('runId')

  try {
    if (runId) {
      // Fetch specific run with all agent results
      const { data, error } = await supabaseAdmin
        .from('runs')
        .select(`*, agent_results(*), pagespeed_results(*), sites(url, title)`)
        .eq('id', runId)
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    if (url) {
      // Fetch all runs for a site (last 30)
      const { data: site } = await supabaseAdmin
        .from('sites')
        .select('id')
        .eq('url', url)
        .single()

      if (!site) return NextResponse.json({ runs: [] })

      const { data, error } = await supabaseAdmin
        .from('runs')
        .select(`id, triggered_by, created_at, pagespeed_results(performance, seo, accessibility, best_practices)`)
        .eq('site_id', site.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) throw error
      return NextResponse.json({ runs: data || [] })
    }

    // Fetch all tracked sites
    const { data, error } = await supabaseAdmin
      .from('sites')
      .select('*, runs(count)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ sites: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

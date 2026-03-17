import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { AGENTS } from '@/lib/agents'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const BASE_URL = process.env.NEXTAUTH_URL!

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Load all tracked sites from Supabase
  const { data: sites } = await supabaseAdmin
    .from('sites')
    .select('*')
    .order('created_at')

  if (!sites?.length) {
    return NextResponse.json({ message: 'No sites tracked yet. Analyse a URL first.' })
  }

  const summary: any[] = []

  for (const site of sites) {
    console.log(`[CRON] Processing: ${site.url}`)

    try {
      // Scrape
      const scrapeRes = await fetch(`${BASE_URL}/api/scrape`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: site.url }),
      })
      const siteData = await scrapeRes.json()
      if (siteData.error) throw new Error(siteData.error)

      // Create run record
      const { data: run } = await supabaseAdmin
        .from('runs')
        .insert({ site_id: site.id, triggered_by: 'cron' })
        .select().single()

      if (!run) throw new Error('Failed to create run')

      // PageSpeed
      const psRes = await fetch(`${BASE_URL}/api/pagespeed`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: site.url }),
      })
      const ps = await psRes.json()
      if (!ps.error) {
        await supabaseAdmin.from('pagespeed_results').insert({
          run_id: run.id,
          performance: ps.performance, accessibility: ps.accessibility,
          best_practices: ps.bestPractices, seo: ps.seo,
          lcp: ps.coreWebVitals?.lcp, tbt: ps.coreWebVitals?.tbt,
          cls: ps.coreWebVitals?.cls, fcp: ps.coreWebVitals?.fcp,
        })
      }

      // Get yesterday's results for diff comparison
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const { data: prevRun } = await supabaseAdmin
        .from('runs')
        .select('id')
        .eq('site_id', site.id)
        .lt('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const prevResults: Record<string, string> = {}
      if (prevRun) {
        const { data: prevAgents } = await supabaseAdmin
          .from('agent_results')
          .select('agent_id, result')
          .eq('run_id', prevRun.id)

        prevAgents?.forEach((r: any) => { prevResults[r.agent_id] = r.result })
      }

      // Run each agent
      const siteContext = `URL: ${siteData.url}\nTitle: ${siteData.title}\nMeta: ${siteData.metaDescription}\nH1s: ${siteData.h1?.join(', ')}\nBody: ${siteData.bodyText?.slice(0, 2000)}`

      for (const agent of AGENTS) {
        try {
          const prevContext = prevResults[agent.id]
            ? `\n\nYESTERDAY'S ANALYSIS:\n${prevResults[agent.id].slice(0, 500)}\n\nFocus on what has CHANGED or NEW opportunities since yesterday. Lead with "Changes since yesterday:" if anything is different.`
            : ''

          const message = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1200,
            system: agent.systemPrompt,
            messages: [{
              role: 'user',
              content: `${siteContext}${prevContext}\n\nProvide your full daily analysis.`,
            }],
          })

          const result = message.content.filter(b => b.type === 'text').map(b => (b as any).text).join('')
          const lines = result.split('\n').filter((l: string) => l.trim())
          const summary_text = (lines[0] || '').replace(/^[#*>\-\d.\s]+/, '').slice(0, 100)

          await supabaseAdmin.from('agent_results').insert({
            run_id: run.id, agent_id: agent.id,
            result, summary: summary_text, status: 'done',
          })

          console.log(`[CRON] ${agent.name} ✓ for ${site.url}`)
        } catch (err: any) {
          await supabaseAdmin.from('agent_results').insert({
            run_id: run.id, agent_id: agent.id,
            result: '', summary: err.message, status: 'error',
          })
        }
      }

      summary.push({ url: site.url, runId: run.id, status: 'done' })
    } catch (err: any) {
      console.error(`[CRON] Failed for ${site.url}: ${err.message}`)
      summary.push({ url: site.url, status: 'error', error: err.message })
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    processed: summary.length,
    summary,
  })
}

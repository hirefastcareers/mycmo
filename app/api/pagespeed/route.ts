import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  try {
    const apiKey = process.env.PAGESPEED_API_KEY
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile${apiKey ? `&key=${apiKey}` : ''}`

    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      throw new Error(`PageSpeed API error: ${response.status}`)
    }

    const data = await response.json()
    const categories = data.lighthouseResult?.categories || {}
    const audits = data.lighthouseResult?.audits || {}

    return NextResponse.json({
      performance: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100),
      coreWebVitals: {
        lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
        tbt: audits['total-blocking-time']?.displayValue || 'N/A',
        cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
        fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

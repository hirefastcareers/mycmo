import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  try {
    const normalised = url.startsWith('http') ? url : `https://${url}`

    const response = await fetch(normalised, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyCMO/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove noise
    $('script, style, nav, footer, noscript, iframe').remove()

    const data = {
      url: normalised,
      title: $('title').text().trim(),
      metaDescription: $('meta[name="description"]').attr('content') || '',
      metaKeywords: $('meta[name="keywords"]').attr('content') || '',
      ogTitle: $('meta[property="og:title"]').attr('content') || '',
      ogDescription: $('meta[property="og:description"]').attr('content') || '',
      h1: $('h1').map((_, el) => $(el).text().trim()).get(),
      h2: $('h2').map((_, el) => $(el).text().trim()).get().slice(0, 10),
      h3: $('h3').map((_, el) => $(el).text().trim()).get().slice(0, 10),
      bodyText: $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000),
      links: {
        internal: $('a[href^="/"], a[href^="' + normalised + '"]').length,
        external: $('a[href^="http"]').not('[href^="' + normalised + '"]').length,
      },
      images: {
        total: $('img').length,
        withAlt: $('img[alt]').length,
        withoutAlt: $('img:not([alt])').length,
      },
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

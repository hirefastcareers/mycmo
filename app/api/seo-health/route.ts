import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { siteData, pageSpeed } = await req.json()

  const checks = []

  // Meta title
  const titleLen = siteData.title?.length || 0
  checks.push({
    label: 'Meta Title',
    passed: titleLen >= 30 && titleLen <= 60,
    value: titleLen > 0 ? `${titleLen} chars` : 'Missing',
    detail: titleLen === 0 ? 'No meta title found' : titleLen < 30 ? 'Too short (aim for 30-60 chars)' : titleLen > 60 ? 'Too long (will be truncated in SERPs)' : 'Good length',
  })

  // Meta description
  const descLen = siteData.metaDescription?.length || 0
  checks.push({
    label: 'Meta Description',
    passed: descLen >= 120 && descLen <= 160,
    value: descLen > 0 ? `${descLen} chars` : 'Missing',
    detail: descLen === 0 ? 'No meta description found' : descLen < 120 ? 'Too short (aim for 120-160 chars)' : descLen > 160 ? 'Too long (will be truncated)' : 'Good length',
  })

  // H1
  const h1Count = siteData.h1?.length || 0
  checks.push({
    label: 'H1 Heading',
    passed: h1Count === 1,
    value: h1Count === 0 ? 'Missing' : `${h1Count} found`,
    detail: h1Count === 0 ? 'No H1 found — add one main heading' : h1Count > 1 ? 'Multiple H1s — use only one per page' : 'Good',
  })

  // Mobile friendly (from pagespeed)
  if (pageSpeed) {
    checks.push({
      label: 'Mobile Friendly',
      passed: pageSpeed.performance >= 50,
      value: pageSpeed.performance >= 50 ? 'Yes' : 'Issues found',
      detail: pageSpeed.performance >= 50 ? 'Passes mobile performance threshold' : 'Performance score too low for mobile',
    })
  }

  // Image alt tags
  const totalImages = siteData.images?.total || 0
  const missingAlt = siteData.images?.withoutAlt || 0
  checks.push({
    label: 'Image Alt Tags',
    passed: missingAlt === 0,
    value: `${totalImages - missingAlt}/${totalImages}`,
    detail: missingAlt === 0 ? 'All images have alt text' : `${missingAlt} image${missingAlt > 1 ? 's' : ''} missing alt text`,
  })

  // Internal links
  const internalLinks = siteData.links?.internal || 0
  checks.push({
    label: 'Internal Links',
    passed: internalLinks >= 3,
    value: `${internalLinks} int / ${siteData.links?.external || 0} ext`,
    detail: internalLinks < 3 ? 'Add more internal links for better crawlability' : 'Good internal linking',
  })

  // OG tags
  const hasOg = !!(siteData.ogTitle || siteData.ogDescription)
  checks.push({
    label: 'Open Graph Tags',
    passed: hasOg,
    value: hasOg ? 'Present' : 'Missing',
    detail: hasOg ? 'OG tags found for social sharing' : 'Add og:title and og:description for better social previews',
  })

  // SEO score from PageSpeed
  if (pageSpeed) {
    checks.push({
      label: 'PageSpeed SEO Score',
      passed: pageSpeed.seo >= 90,
      value: `${pageSpeed.seo}/100`,
      detail: pageSpeed.seo >= 90 ? 'Excellent SEO score' : pageSpeed.seo >= 70 ? 'Good but room to improve' : 'Needs attention',
    })
  }

  const passed = checks.filter(c => c.passed).length
  const total = checks.length

  return NextResponse.json({ checks, passed, total, score: Math.round((passed / total) * 100) })
}

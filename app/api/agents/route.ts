import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { AGENTS } from '@/lib/agents'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { agentId, siteData } = await req.json()

  const agent = AGENTS.find((a) => a.id === agentId)
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  const siteContext = `
WEBSITE URL: ${siteData.url}
PAGE TITLE: ${siteData.title}
META DESCRIPTION: ${siteData.metaDescription}
OG TITLE: ${siteData.ogTitle}
OG DESCRIPTION: ${siteData.ogDescription}
H1 HEADINGS: ${siteData.h1?.join(' | ')}
H2 HEADINGS: ${siteData.h2?.join(' | ')}
H3 HEADINGS: ${siteData.h3?.join(' | ')}
INTERNAL LINKS: ${siteData.links?.internal} | EXTERNAL LINKS: ${siteData.links?.external}
IMAGES: ${siteData.images?.total} total, ${siteData.images?.withoutAlt} missing alt tags
PAGE BODY TEXT (first 3000 chars):
${siteData.bodyText}
  `.trim()

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: agent.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Here is the scraped data from the website I want you to analyse:\n\n${siteContext}\n\nPlease provide your full analysis and recommendations based on this actual content.`,
        },
      ],
    })

    const text = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as any).text)
      .join('')

    return NextResponse.json({ result: text })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

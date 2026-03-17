import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { messages, siteData } = await req.json()

  const siteContext = siteData ? `
You have full context about the user's website:
URL: ${siteData.url}
Title: ${siteData.title}
Meta Description: ${siteData.metaDescription}
H1s: ${siteData.h1?.join(', ')}
Body text snippet: ${siteData.bodyText?.slice(0, 1000)}
` : ''

  const systemPrompt = `You are an expert CMO (Chief Marketing Officer) and growth strategist. You are sharp, direct, and commercially focused — no corporate waffle.
${siteContext}
You coordinate marketing across Reddit, SEO, Twitter/X, content, Hacker News, and GEO (AI search).

When the user asks questions, give them specific, actionable advice based on their actual website and business. Be honest about weaknesses. Think like a senior marketer who has seen hundreds of startups.

Keep responses concise and practical. Use bullet points when listing actions. Always end with one clear "do this next" recommendation.`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: messages.map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
        })

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }

        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'
import { getServerSession } from 'next-auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated with Twitter' }, { status: 401 })
  }

  const { text } = await req.json()

  if (!text) {
    return NextResponse.json({ error: 'Tweet text required' }, { status: 400 })
  }

  try {
    const client = new TwitterApi((session as any).accessToken)
    const tweet = await client.v2.tweet(text)
    return NextResponse.json({ success: true, id: tweet.data.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

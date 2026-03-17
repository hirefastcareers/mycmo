import { NextRequest, NextResponse } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'

export async function POST(req: NextRequest) {
  const { query, accessToken } = await req.json()

  // Use user's access token if available (connected account), otherwise bearer token
  const token = accessToken || process.env.TWITTER_BEARER_TOKEN

  if (!token) {
    return NextResponse.json({ error: 'No Twitter token available. Connect your Twitter account.' }, { status: 401 })
  }

  try {
    const client = accessToken
      ? new TwitterApi(accessToken)
      : new TwitterApi(token)

    const readClient = client.readOnly

    // Search for recent tweets about the topic
    const searchResults = await readClient.v2.search(query, {
      max_results: 10,
      'tweet.fields': ['public_metrics', 'created_at', 'author_id'],
      'user.fields': ['name', 'username'],
      expansions: ['author_id'],
    })

    const users = new Map(
      (searchResults.includes?.users || []).map((u: any) => [u.id, u])
    )

    const tweets = (searchResults.data?.data || []).map((tweet: any) => {
      const author = users.get(tweet.author_id) as any
      return {
        id: tweet.id,
        text: tweet.text,
        author: author?.name || 'Unknown',
        username: author?.username || '',
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
        created_at: tweet.created_at,
        url: `https://x.com/${author?.username}/status/${tweet.id}`,
      }
    })

    return NextResponse.json({ tweets })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

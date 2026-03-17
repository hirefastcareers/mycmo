import { NextRequest, NextResponse } from 'next/server'

// Reddit's public JSON API — no key needed, just a descriptive User-Agent
const REDDIT_UA = 'MyCMO/1.0 (personal marketing tool)'

interface RedditPost {
  id: string
  title: string
  subreddit: string
  url: string
  score: number
  num_comments: number
  selftext: string
  created_utc: number
  permalink: string
  author: string
}

async function searchReddit(query: string, limit = 5): Promise<RedditPost[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=week&limit=${limit}&type=link`,
      {
        headers: { 'User-Agent': REDDIT_UA },
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.data?.children || []).map((c: any) => c.data)
  } catch {
    return []
  }
}

async function getSubredditPosts(subreddit: string, limit = 3): Promise<RedditPost[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
      {
        headers: { 'User-Agent': REDDIT_UA },
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.data?.children || []).map((c: any) => c.data)
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  const { siteTitle, keywords, subreddits } = await req.json()

  // Parse subreddits from agent result text if provided
  const subredditList: string[] = subreddits || []

  // Always add some fallbacks based on common marketing/SEO subreddits
  const fallbackSubreddits = ['entrepreneur', 'smallbusiness', 'SEO', 'startups', 'marketing']

  const allSubreddits = [...new Set([...subredditList, ...fallbackSubreddits])].slice(0, 5)

  try {
    // Run searches in parallel
    const [searchResults, ...subredditResults] = await Promise.all([
      searchReddit(keywords || siteTitle, 6),
      ...allSubreddits.map(sub => getSubredditPosts(sub, 2)),
    ])

    const subredditPosts = subredditResults.flat()

    return NextResponse.json({
      searchResults: searchResults.map(p => ({
        id: p.id,
        title: p.title,
        subreddit: p.subreddit,
        score: p.score,
        comments: p.num_comments,
        url: `https://reddit.com${p.permalink}`,
        age: formatAge(p.created_utc),
        snippet: p.selftext?.slice(0, 150) || '',
      })),
      subredditPosts: subredditPosts.map(p => ({
        id: p.id,
        title: p.title,
        subreddit: p.subreddit,
        score: p.score,
        comments: p.num_comments,
        url: `https://reddit.com${p.permalink}`,
        age: formatAge(p.created_utc),
      })),
      subredditsChecked: allSubreddits,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function formatAge(utc: number): string {
  const diff = Date.now() / 1000 - utc
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

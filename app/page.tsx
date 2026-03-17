'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AGENTS } from '@/lib/agents'

// ─── Types ─────────────────────────────────────────────────────────
type SiteData = {
  url: string; title: string; metaDescription: string; ogTitle: string
  ogDescription: string; h1: string[]; h2: string[]; bodyText: string
  links: { internal: number; external: number }
  images: { total: number; withAlt: number; withoutAlt: number }
}
type PageSpeed = {
  performance: number; accessibility: number; bestPractices: number; seo: number
  coreWebVitals: { lcp: string; tbt: string; cls: string; fcp: string }
}
type AgentCard = {
  id: string; name: string; icon: string; color: string
  status: 'idle' | 'running' | 'done' | 'error'
  summary: string; result: string; expanded: boolean
}
type SeoCheck = { label: string; passed: boolean; value: string; detail: string }
type RedditPost = { id: string; title: string; subreddit: string; score: number; comments: number; url: string; age: string }
type Tweet = { id: string; text: string; author: string; username: string; likes: number; retweets: number; url: string }
type ChatMessage = { role: 'user' | 'assistant'; content: string }
type Document = { type: string; content: string }
type Competitor = { id: string; url: string; name: string }
type HistoryRun = { id: string; created_at: string; triggered_by: string; pagespeed_results: any[] }

type ActiveTab = 'feed' | 'pagespeed' | 'reddit' | 'twitter' | 'documents' | 'competitors' | 'history'

// ─── Sub-components ─────────────────────────────────────────────────
function RobotIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="#1c2333" />
      <rect x="8" y="9" width="16" height="11" rx="2" fill="#3b82f6" />
      <rect x="10" y="11" width="4" height="4" rx="1" fill="white" opacity="0.9" />
      <rect x="18" y="11" width="4" height="4" rx="1" fill="white" opacity="0.9" />
      <rect x="11" y="12" width="2" height="2" rx="0.5" fill="#1c2333" />
      <rect x="19" y="12" width="2" height="2" rx="0.5" fill="#1c2333" />
      <rect x="13" y="22" width="6" height="2" rx="1" fill="#3b82f6" />
      <rect x="9" y="20" width="2" height="5" rx="1" fill="#2563eb" />
      <rect x="21" y="20" width="2" height="5" rx="1" fill="#2563eb" />
      <rect x="13" y="24" width="2" height="4" rx="1" fill="#2563eb" />
      <rect x="17" y="24" width="2" height="4" rx="1" fill="#2563eb" />
      <rect x="14" y="6" width="4" height="4" rx="1" fill="#2563eb" />
      <rect x="15" y="4" width="2" height="3" rx="1" fill="#3b82f6" />
    </svg>
  )
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 90 ? '#22c55e' : score >= 50 ? '#f0a030' : '#ef4444'
  const r = 22, circ = 2 * Math.PI * r, dash = (score / 100) * circ
  return (
    <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="28" cy="28" r={r} fill="none" stroke="#1e2535" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      <text x="28" y="33" textAnchor="middle" fill={color} fontSize="12" fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: '28px 28px' }}>{score}</text>
    </svg>
  )
}

function Spinner() {
  return <div style={{ width: 14, height: 14, border: '2px solid #f0a030', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
}

function SectionLabel({ children }: { children: string }) {
  return <div style={{ padding: '8px 14px 4px', color: '#6e7681', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</div>
}

// ─── Main Component ────────────────────────────────────────────────
export default function Dashboard() {
  const [url, setUrl] = useState('')
  const [analysing, setAnalysing] = useState(false)
  const [siteData, setSiteData] = useState<SiteData | null>(null)
  const [pageSpeed, setPageSpeed] = useState<PageSpeed | null>(null)
  const [seoHealth, setSeoHealth] = useState<{ checks: SeoCheck[]; passed: number; total: number } | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [cards, setCards] = useState<AgentCard[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed')
  const [redditPosts, setRedditPosts] = useState<RedditPost[]>([])
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [redditLoading, setRedditLoading] = useState(false)
  const [twitterLoading, setTwitterLoading] = useState(false)
  const [documents, setDocuments] = useState<Record<string, string>>({ brand_voice: '', product_info: '', competitor_analysis: '' })
  const [editingDoc, setEditingDoc] = useState<string | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [newCompetitor, setNewCompetitor] = useState('')
  const [history, setHistory] = useState<HistoryRun[]>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatStreaming, setChatStreaming] = useState(false)
  const [started, setStarted] = useState(false)
  const [psExpanded, setPsExpanded] = useState(true)
  const [seoExpanded, setSeoExpanded] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  const addLog = useCallback((msg: string) => setLogs(p => [...p.slice(-60), msg]), [])

  const updateCard = useCallback((id: string, patch: Partial<AgentCard>) =>
    setCards(p => p.map(c => c.id === id ? { ...c, ...patch } : c)), [])

  const initCards = (): AgentCard[] => AGENTS.map(a => ({
    id: a.id, name: a.name, icon: a.icon, color: a.color,
    status: 'idle', summary: 'Waiting to run...', result: '', expanded: false,
  }))

  const runAgent = async (agentId: string, site: SiteData) => {
    const agent = AGENTS.find(a => a.id === agentId)!
    updateCard(agentId, { status: 'running', summary: 'Analysing your site...' })
    try {
      const res = await fetch('/api/agents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, siteData: site }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const lines = data.result.split('\n').filter((l: string) => l.trim())
      const summary = (lines[0] || '').replace(/^[#*>\-\d.\s]+/, '').slice(0, 90)
      updateCard(agentId, { status: 'done', result: data.result, summary: summary || 'Analysis complete', expanded: false })
      addLog(`> ${agent.name} complete ✓`)
      return { result: data.result, summary }
    } catch (err: any) {
      updateCard(agentId, { status: 'error', summary: err.message })
      addLog(`> ${agent.name} failed`)
      return null
    }
  }

  const loadReddit = async (site: SiteData) => {
    setRedditLoading(true)
    try {
      const res = await fetch('/api/reddit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteTitle: site.title, keywords: site.h1?.[0] || site.title }),
      })
      const data = await res.json()
      setRedditPosts([...(data.searchResults || []), ...(data.subredditPosts || [])].slice(0, 12))
      addLog(`> Reddit: found ${data.searchResults?.length || 0} relevant threads`)
    } catch { addLog('> Reddit feed unavailable') }
    finally { setRedditLoading(false) }
  }

  const loadTwitter = async (site: SiteData) => {
    setTwitterLoading(true)
    try {
      const query = site.title?.split(' ').slice(0, 3).join(' ') || site.url
      const res = await fetch('/api/twitter-feed', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (!data.error) setTweets(data.tweets || [])
      addLog(`> Twitter/X: found ${data.tweets?.length || 0} relevant posts`)
    } catch { addLog('> Twitter feed unavailable (check Bearer Token)') }
    finally { setTwitterLoading(false) }
  }

  const loadDocuments = async (siteUrl: string) => {
    try {
      const res = await fetch(`/api/documents?url=${encodeURIComponent(siteUrl)}`)
      const data = await res.json()
      const docs: Record<string, string> = { brand_voice: '', product_info: '', competitor_analysis: '' }
      data.documents?.forEach((d: any) => { docs[d.type] = d.content || '' })
      setDocuments(docs)
    } catch { }
  }

  const saveDocument = async (type: string, content: string, siteUrl: string) => {
    await fetch('/api/documents', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: siteUrl, type, content }),
    })
    setDocuments(p => ({ ...p, [type]: content }))
    setEditingDoc(null)
  }

  const loadCompetitors = async (siteUrl: string) => {
    try {
      const res = await fetch(`/api/competitors?url=${encodeURIComponent(siteUrl)}`)
      const data = await res.json()
      setCompetitors(data.competitors || [])
    } catch { }
  }

  const addCompetitor = async (siteUrl: string) => {
    if (!newCompetitor.trim()) return
    const res = await fetch('/api/competitors', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteUrl, competitorUrl: newCompetitor.trim(), name: newCompetitor.trim() }),
    })
    const data = await res.json()
    if (data.competitor) {
      setCompetitors(p => [...p, data.competitor])
      setNewCompetitor('')
    }
  }

  const removeCompetitor = async (id: string) => {
    await fetch('/api/competitors', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setCompetitors(p => p.filter(c => c.id !== id))
  }

  const loadHistory = async (siteUrl: string) => {
    try {
      const res = await fetch(`/api/runs?url=${encodeURIComponent(siteUrl)}`)
      const data = await res.json()
      setHistory(data.runs || [])
    } catch { }
  }

  const analyse = async () => {
    if (!url.trim() || analysing) return
    const normalised = url.startsWith('http') ? url : `https://${url}`
    setAnalysing(true)
    setStarted(true)
    setSiteData(null)
    setPageSpeed(null)
    setSeoHealth(null)
    setCards(initCards())
    setLogs([])
    setChatMessages([])
    setRedditPosts([])
    setTweets([])
    setActiveTab('feed')

    try {
      addLog(`> Connecting to ${normalised}...`)
      addLog(`> Scanning page structure...`)

      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalised }),
      })
      const site: SiteData = await scrapeRes.json()
      if ((site as any).error) throw new Error((site as any).error)
      setSiteData(site)
      addLog(`> Found: "${site.title}"`)
      addLog(`> Scanning for SEO issues...`)

      // PageSpeed + SEO health in parallel
      Promise.all([
        fetch('/api/pagespeed', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: normalised }),
        }).then(r => r.json()).then(async ps => {
          if (!ps.error) {
            setPageSpeed(ps)
            addLog(`> PageSpeed: ${ps.performance} perf · ${ps.seo} SEO · ${ps.accessibility} a11y`)
            // SEO health
            const healthRes = await fetch('/api/seo-health', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ siteData: site, pageSpeed: ps }),
            })
            const health = await healthRes.json()
            setSeoHealth(health)
            addLog(`> SEO Health: ${health.passed}/${health.total} checks passed`)
          }
        }),
        loadReddit(site),
        loadTwitter(site),
        loadDocuments(normalised),
        loadCompetitors(normalised),
        loadHistory(normalised),
      ])

      addLog(`> Picking the best threads for your feed...`)
      addLog(`> Scanning Twitter/X for growth opportunities...`)
      addLog(`> Identifying content opportunities based on your site...`)

      // Run agents sequentially
      const agentResults: Record<string, any> = {}
      for (const agent of AGENTS) {
        const result = await runAgent(agent.id, site)
        if (result) agentResults[agent.id] = { ...result, status: 'done' }
      }

      // Save run to Supabase
      fetch('/api/runs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalised, title: site.title, agentResults }),
      }).catch(console.error)

      setChatMessages([{
        role: 'assistant',
        content: `Hi, I'm your AI CMO. I've analysed **${site.title || normalised}** and deployed all 6 agents. I can coordinate your SEO, GEO, Reddit, Twitter/X, content, and Hacker News strategy. What would you like to focus on first?`,
      }])
    } catch (err: any) {
      addLog(`> Error: ${err.message}`)
    } finally {
      setAnalysing(false)
    }
  }

  const sendChat = async () => {
    if (!chatInput.trim() || chatStreaming) return
    const userMsg: ChatMessage = { role: 'user', content: chatInput }
    setChatMessages(p => [...p, userMsg, { role: 'assistant', content: '' }])
    setChatInput('')
    setChatStreaming(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...chatMessages, userMsg], siteData }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setChatMessages(p => {
          const u = [...p]
          u[u.length - 1] = { role: 'assistant', content: u[u.length - 1].content + decoder.decode(value) }
          return u
        })
      }
    } catch (err: any) {
      setChatMessages(p => { const u = [...p]; u[u.length - 1] = { role: 'assistant', content: `Error: ${err.message}` }; return u })
    } finally {
      setChatStreaming(false)
    }
  }

  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'feed', label: 'CMO Feed', icon: '📡' },
    { id: 'pagespeed', label: 'Analytics', icon: '📊' },
    { id: 'reddit', label: 'Reddit', icon: '🟠' },
    { id: 'twitter', label: 'Twitter/X', icon: '✖' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'competitors', label: 'Competitors', icon: '⚔️' },
    { id: 'history', label: 'History', icon: '🕐' },
  ]

  const c = {
    page: { minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 13 } as React.CSSProperties,
    header: { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid #21262d', background: '#161b22' } as React.CSSProperties,
    urlBar: { display: 'flex', gap: 8, padding: '10px 14px', borderBottom: '1px solid #21262d' } as React.CSSProperties,
    input: { background: '#161b22', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' } as React.CSSProperties,
    btnPrimary: { padding: '7px 16px', background: '#1f6feb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' } as React.CSSProperties,
    terminal: { background: '#161b22', borderBottom: '1px solid #21262d', padding: '10px 14px', maxHeight: 130, overflowY: 'auto' as const },
    tabBar: { display: 'flex', gap: 0, borderBottom: '1px solid #21262d', background: '#161b22', overflowX: 'auto' as const },
    section: { borderBottom: '1px solid #21262d' } as React.CSSProperties,
    cardHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', userSelect: 'none' as const },
    pill: { background: '#21262d', border: '1px solid #30363d', borderRadius: 16, padding: '4px 10px', fontSize: 11, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 4 } as React.CSSProperties,
  }

  return (
    <div style={c.page}>
      {/* Header */}
      <div style={c.header}>
        <RobotIcon size={26} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>AI CMO</span>
        {siteData && (
          <span style={{ marginLeft: 'auto', color: '#8b949e', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
            {siteData.url}
          </span>
        )}
        {chatMessages.length > 0 && (
          <button onClick={() => setChatOpen(true)} style={{ ...c.btnPrimary, marginLeft: siteData ? 8 : 'auto', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RobotIcon size={14} /> Chat with CMO
          </button>
        )}
      </div>

      {/* URL bar */}
      <div style={c.urlBar}>
        <input
          value={url} onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyse()}
          placeholder="Enter your website URL..."
          style={{ ...c.input, flex: 1 }}
        />
        <button onClick={analyse} disabled={analysing || !url.trim()}
          style={{ ...c.btnPrimary, background: analysing ? '#2d333b' : '#1f6feb', color: analysing ? '#6e7681' : '#fff', cursor: analysing ? 'not-allowed' : 'pointer' }}>
          {analysing ? 'Running...' : 'Analyse →'}
        </button>
      </div>

      {/* Terminal log */}
      {logs.length > 0 && (
        <div style={c.terminal}>
          {logs.map((log, i) => <div key={i} style={{ color: '#f0a030', fontSize: 12, lineHeight: 1.65, marginBottom: 1 }}>{log}</div>)}
          {analysing && <div style={{ color: '#f0a030', opacity: 0.5 }}>█</div>}
          <div ref={logsEndRef} />
        </div>
      )}

      {/* Landing */}
      {!started && (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <RobotIcon size={52} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 16, marginBottom: 8 }}>Your AI CMO</h2>
          <p style={{ color: '#8b949e', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 28px' }}>
            Enter any website. Your CMO scrapes it, runs PageSpeed, pulls live Reddit &amp; Twitter data, then deploys 6 specialist agents across every marketing channel.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
            {AGENTS.map(a => (
              <div key={a.id} style={c.pill}><span>{a.icon}</span>{a.name}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['getaproseo.com', 'hirefast.co.uk', 'chambersvalley.co.uk'].map(site => (
              <button key={site} onClick={() => setUrl(`https://${site}`)}
                style={{ ...c.pill, cursor: 'pointer', background: 'transparent', border: '1px solid #21262d' }}>
                {site}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs + Content */}
      {started && (
        <>
          {/* Tab bar */}
          <div style={c.tabBar}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ padding: '9px 14px', background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #1f6feb' : '2px solid transparent', color: activeTab === tab.id ? '#e6edf3' : '#8b949e', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>

          {/* ── CMO FEED TAB ─────────────────────────────────── */}
          {activeTab === 'feed' && (
            <div>
              {cards.map(card => (
                <div key={card.id} style={c.section}>
                  <div onClick={() => card.status === 'done' && updateCard(card.id, { expanded: !card.expanded })}
                    style={{ ...c.cardHeader, cursor: card.status === 'done' ? 'pointer' : 'default' }}>
                    <div style={{ width: 28, height: 28, background: '#1c2333', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                      {card.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#e6edf3' }}>{card.name}</div>
                      <div style={{ color: '#8b949e', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {card.status === 'running' ? 'Analysing your site...' : card.summary}
                      </div>
                    </div>
                    {card.status === 'running' && <Spinner />}
                    {card.status === 'done' && <span style={{ color: '#6e7681', fontSize: 14 }}>{card.expanded ? '∧' : '∨'}</span>}
                    {card.status === 'error' && <span style={{ color: '#f85149', fontSize: 11 }}>⚠ error</span>}
                  </div>
                  {card.expanded && card.result && (
                    <div style={{ padding: '0 14px 16px 52px', color: '#c9d1d9', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', borderTop: '1px solid #21262d', paddingTop: 12 }}>
                      {card.result}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── ANALYTICS TAB ────────────────────────────────── */}
          {activeTab === 'pagespeed' && (
            <div>
              {pageSpeed ? (
                <>
                  {/* PageSpeed scores */}
                  <div style={c.section}>
                    <div style={c.cardHeader} onClick={() => setPsExpanded(v => !v)}>
                      <span>📊</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>Page Speed</div>
                        <div style={{ color: '#8b949e', fontSize: 12, marginTop: 2 }}>Performance {pageSpeed.performance} · SEO {pageSpeed.seo}</div>
                      </div>
                      <span style={{ color: '#6e7681' }}>{psExpanded ? '∧' : '∨'}</span>
                    </div>
                    {psExpanded && (
                      <div style={{ padding: '0 14px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16, textAlign: 'center' }}>
                          {[{ s: pageSpeed.performance, l: 'Performance' }, { s: pageSpeed.accessibility, l: 'Accessibility' }, { s: pageSpeed.bestPractices, l: 'Best Practices' }, { s: pageSpeed.seo, l: 'SEO' }].map(x => (
                            <div key={x.l}><ScoreRing score={x.s} /><div style={{ color: '#8b949e', fontSize: 11, marginTop: 4 }}>{x.l}</div></div>
                          ))}
                        </div>
                        <div style={{ background: '#161b22', borderRadius: 8, overflow: 'hidden' }}>
                          <div style={{ padding: '7px 12px', borderBottom: '1px solid #21262d', color: '#6e7681', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Core Web Vitals</div>
                          {[
                            { label: 'Largest Contentful Paint', val: pageSpeed.coreWebVitals.lcp, good: '< 2.5s' },
                            { label: 'Total Blocking Time', val: pageSpeed.coreWebVitals.tbt, good: '< 200ms' },
                            { label: 'Cumulative Layout Shift', val: pageSpeed.coreWebVitals.cls, good: '< 0.1' },
                            { label: 'First Contentful Paint', val: pageSpeed.coreWebVitals.fcp, good: '< 1.8s' },
                          ].map((item, i, arr) => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderBottom: i < arr.length - 1 ? '1px solid #21262d' : 'none' }}>
                              <div>
                                <div style={{ color: '#c9d1d9', fontSize: 12 }}>{item.label}</div>
                                <div style={{ color: '#6e7681', fontSize: 11 }}>Good: {item.good}</div>
                              </div>
                              <span style={{ color: '#f0a030', fontWeight: 600, fontSize: 12 }}>{item.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SEO Health */}
                  {seoHealth && (
                    <div style={c.section}>
                      <div style={c.cardHeader} onClick={() => setSeoExpanded(v => !v)}>
                        <span>🔍</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>SEO Health</div>
                          <div style={{ color: '#8b949e', fontSize: 12, marginTop: 2 }}>{seoHealth.passed}/{seoHealth.total} checks passed</div>
                        </div>
                        <span style={{ color: '#6e7681' }}>{seoExpanded ? '∧' : '∨'}</span>
                      </div>
                      {seoExpanded && (
                        <div style={{ padding: '0 14px 14px' }}>
                          {seoHealth.checks.map((check, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < seoHealth.checks.length - 1 ? '1px solid #21262d' : 'none' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: check.passed ? '#22c55e' : '#f85149', fontSize: 13 }}>{check.passed ? '✓' : '✗'}</span>
                                <div>
                                  <div style={{ color: '#c9d1d9', fontSize: 12 }}>{check.label}</div>
                                  <div style={{ color: '#6e7681', fontSize: 11 }}>{check.detail}</div>
                                </div>
                              </div>
                              <span style={{ color: check.passed ? '#22c55e' : '#f0a030', fontSize: 12, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{check.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: 32, textAlign: 'center', color: '#6e7681' }}>
                  {analysing ? <><Spinner /> <span style={{ marginLeft: 8 }}>Running PageSpeed...</span></> : 'Run an analysis first'}
                </div>
              )}
            </div>
          )}

          {/* ── REDDIT TAB ───────────────────────────────────── */}
          {activeTab === 'reddit' && (
            <div>
              <SectionLabel>Live Reddit Opportunities</SectionLabel>
              {redditLoading ? (
                <div style={{ padding: '20px 14px', display: 'flex', alignItems: 'center', gap: 8, color: '#8b949e' }}><Spinner /> Loading Reddit feed...</div>
              ) : redditPosts.length > 0 ? (
                redditPosts.map(post => (
                  <a key={post.id} href={post.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', padding: '12px 14px', borderBottom: '1px solid #21262d', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: '#ff4500', fontSize: 12, flexShrink: 0, marginTop: 1 }}>r/{post.subreddit}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#e6edf3', fontSize: 13, lineHeight: 1.4, marginBottom: 4 }}>{post.title}</div>
                        <div style={{ color: '#6e7681', fontSize: 11 }}>↑ {post.score} · 💬 {post.comments} · {post.age}</div>
                      </div>
                    </div>
                  </a>
                ))
              ) : (
                <div style={{ padding: '20px 14px', color: '#6e7681' }}>No Reddit posts found. Try analysing a site first.</div>
              )}
            </div>
          )}

          {/* ── TWITTER TAB ─────────────────────────────────── */}
          {activeTab === 'twitter' && (
            <div>
              <SectionLabel>Live Twitter/X Posts</SectionLabel>
              {twitterLoading ? (
                <div style={{ padding: '20px 14px', display: 'flex', alignItems: 'center', gap: 8, color: '#8b949e' }}><Spinner /> Loading Twitter/X feed...</div>
              ) : tweets.length > 0 ? (
                tweets.map(tweet => (
                  <a key={tweet.id} href={tweet.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', padding: '12px 14px', borderBottom: '1px solid #21262d', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 28, height: 28, background: '#21262d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                        {tweet.author?.[0] || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                          <span style={{ color: '#e6edf3', fontSize: 12, fontWeight: 600 }}>{tweet.author}</span>
                          <span style={{ color: '#6e7681', fontSize: 12 }}>@{tweet.username}</span>
                        </div>
                        <div style={{ color: '#c9d1d9', fontSize: 13, lineHeight: 1.5, marginBottom: 6 }}>{tweet.text}</div>
                        <div style={{ color: '#6e7681', fontSize: 11 }}>❤ {tweet.likes} · 🔁 {tweet.retweets}</div>
                      </div>
                    </div>
                  </a>
                ))
              ) : (
                <div style={{ padding: '20px 14px', color: '#6e7681' }}>
                  No tweets found. Add TWITTER_BEARER_TOKEN to .env.local to enable the Twitter/X feed.
                </div>
              )}
            </div>
          )}

          {/* ── DOCUMENTS TAB ───────────────────────────────── */}
          {activeTab === 'documents' && (
            <div>
              <SectionLabel>Documents</SectionLabel>
              {[
                { key: 'product_info', label: 'Product Information', icon: '📋' },
                { key: 'competitor_analysis', label: 'Competitor Analysis', icon: '⚔️' },
                { key: 'brand_voice', label: 'Brand Voice', icon: '🎙️' },
              ].map(doc => (
                <div key={doc.key} style={c.section}>
                  {editingDoc === doc.key ? (
                    <div style={{ padding: 14 }}>
                      <div style={{ fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{doc.icon}</span>{doc.label}
                      </div>
                      <textarea
                        defaultValue={documents[doc.key]}
                        id={`doc-${doc.key}`}
                        style={{ width: '100%', minHeight: 160, background: '#161b22', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', padding: '10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button onClick={() => {
                          const el = document.getElementById(`doc-${doc.key}`) as HTMLTextAreaElement
                          saveDocument(doc.key, el.value, siteData?.url || url)
                        }} style={{ ...c.btnPrimary }}>Save</button>
                        <button onClick={() => setEditingDoc(null)} style={{ ...c.btnPrimary, background: '#21262d', color: '#c9d1d9' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => setEditingDoc(doc.key)} style={{ ...c.cardHeader, cursor: 'pointer' }}>
                      <span style={{ fontSize: 16 }}>{doc.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{doc.label}</div>
                        <div style={{ color: '#8b949e', fontSize: 12, marginTop: 2 }}>
                          {documents[doc.key] ? documents[doc.key].slice(0, 80) + '...' : 'Click to add content →'}
                        </div>
                      </div>
                      <span style={{ color: '#6e7681' }}>›</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── COMPETITORS TAB ─────────────────────────────── */}
          {activeTab === 'competitors' && (
            <div>
              <SectionLabel>Competitors</SectionLabel>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #21262d', display: 'flex', gap: 8 }}>
                <input
                  value={newCompetitor}
                  onChange={e => setNewCompetitor(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && siteData && addCompetitor(siteData.url)}
                  placeholder="Add competitor URL..."
                  style={{ ...c.input, flex: 1 }}
                />
                <button onClick={() => siteData && addCompetitor(siteData.url)} style={c.btnPrimary}>+ Add</button>
              </div>
              {competitors.length === 0 ? (
                <div style={{ padding: '20px 14px', color: '#6e7681' }}>No competitors added yet. Add URLs to track them.</div>
              ) : (
                competitors.map(comp => (
                  <div key={comp.id} style={{ ...c.section, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px' }}>
                    <div style={{ width: 28, height: 28, background: '#21262d', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                      {comp.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#e6edf3', fontSize: 13 }}>{comp.name}</div>
                      <div style={{ color: '#6e7681', fontSize: 11 }}>{comp.url}</div>
                    </div>
                    <button onClick={() => removeCompetitor(comp.id)}
                      style={{ background: 'none', border: 'none', color: '#6e7681', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── HISTORY TAB ─────────────────────────────────── */}
          {activeTab === 'history' && (
            <div>
              <SectionLabel>Run History</SectionLabel>
              {history.length === 0 ? (
                <div style={{ padding: '20px 14px', color: '#6e7681' }}>No history yet. Runs are saved automatically after each analysis.</div>
              ) : (
                history.map(run => {
                  const ps = run.pagespeed_results?.[0]
                  return (
                    <div key={run.id} style={{ ...c.section, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#e6edf3', fontSize: 13 }}>
                          {new Date(run.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ color: '#6e7681', fontSize: 11, marginTop: 2 }}>
                          {run.triggered_by === 'cron' ? '🕐 Automatic daily run' : '👆 Manual analysis'}
                        </div>
                      </div>
                      {ps && (
                        <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                          <span style={{ color: ps.performance >= 90 ? '#22c55e' : ps.performance >= 50 ? '#f0a030' : '#ef4444' }}>⚡ {ps.performance}</span>
                          <span style={{ color: ps.seo >= 90 ? '#22c55e' : ps.seo >= 50 ? '#f0a030' : '#ef4444' }}>🔍 {ps.seo}</span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Chat overlay */}
      {chatOpen && (
        <div onClick={e => e.target === e.currentTarget && setChatOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '12px 12px 0 0', width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid #21262d' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RobotIcon size={22} /><span style={{ fontWeight: 600 }}>Chat with AI CMO</span>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ color: '#6e7681', fontSize: 11, marginBottom: 2 }}>AI CMO</div>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{
                  padding: '10px 12px', fontSize: 13, lineHeight: 1.65,
                  borderRadius: msg.role === 'user' ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
                  background: msg.role === 'user' ? '#1f6feb' : '#21262d',
                  color: msg.role === 'user' ? '#fff' : '#c9d1d9',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}>
                  {msg.content || <span style={{ opacity: 0.3 }}>█</span>}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid #21262d' }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                placeholder="Ask me anything..."
                style={{ ...c.input, flex: 1 }} />
              <button onClick={sendChat} disabled={chatStreaming || !chatInput.trim()}
                style={{ ...c.btnPrimary, background: chatStreaming ? '#2d333b' : '#1f6feb', color: chatStreaming ? '#6e7681' : '#fff' }}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d1117; }
        a { color: inherit; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
        input::placeholder, textarea::placeholder { color: #6e7681; }
      `}</style>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PASSWORD = 'marley2026'

function RobotIcon({ size = 32 }: { size?: number }) {
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

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        setError('Incorrect password')
        setLoading(false)
        return
      }

      router.replace('/')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d1117',
        color: '#e6edf3',
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          padding: '32px 26px 28px',
          borderRadius: 12,
          background: '#161b22',
          border: '1px solid #30363d',
          boxShadow: '0 18px 45px rgba(0,0,0,0.55)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
          <RobotIcon size={40} />
          <h1 style={{ marginTop: 14, fontSize: 18, fontWeight: 700 }}>AI CMO</h1>
          <p style={{ marginTop: 4, fontSize: 12, color: '#8b949e' }}>Password required to access your dashboard.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #30363d',
              background: '#0d1117',
              color: '#e6edf3',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
              marginBottom: 10,
            }}
          />

          {error && (
            <div
              style={{
                marginBottom: 10,
                fontSize: 12,
                color: '#f85149',
                background: '#240509',
                borderRadius: 6,
                padding: '6px 8px',
                border: '1px solid #f85149',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              background: loading ? '#2d333b' : '#1f6feb',
              color: loading ? '#6e7681' : '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              marginTop: 4,
            }}
          >
            {loading ? 'Checking…' : 'Unlock dashboard'}
          </button>
        </form>

        <p style={{ marginTop: 14, fontSize: 11, color: '#6e7681', textAlign: 'center' }}>
          Hint: this is a private workspace.
        </p>
      </div>
    </div>
  )
}


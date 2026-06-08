import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const nav = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    const r = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    })
    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      setError(j.message || 'Login failed')
      return
    }
    nav('/')
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Login</h2>
        <form onSubmit={onSubmit} style={{ marginTop: 10 }}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
          <label style={{ marginTop: 10 }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div style={{ marginTop: 10, color: 'crimson', fontWeight: 700 }}>{error}</div>}
          <div className="row" style={{ marginTop: 14 }}>
            <button type="submit">Login</button>
            <Link to="/register" style={{ color: '#2563eb', fontWeight: 800, textDecoration: 'none' }}>
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}


import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE

export default function Dashboard() {
  const [me, setMe] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
      .then(async (r) => (r.ok ? r.json() : null))
      .then(setMe)
  }, [])

  return (
    <div className="container">
      <div className="card">
        <h2>Dashboard</h2>
        <p style={{ marginTop: 8 }}>
          Welcome <b>{me ? me.userName : '...'}</b>
        </p>
        <p style={{ marginTop: 8 }}>
          Use the menu to manage Vehicles, Customers, Promotions, and view the Promotions Report.
        </p>
      </div>
    </div>
  )
}


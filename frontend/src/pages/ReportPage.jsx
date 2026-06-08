import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE

export default function ReportPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/api/report/customers-promotions`, { credentials: 'include' })
      .then(async (r) => {
        const j = await r.json().catch(() => [])
        setRows(Array.isArray(j) ? j : [])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container">
      <div className="card">
        <h2>Promotions Report</h2>
        <div style={{ marginTop: 8, color: '#444' }}>
          Rule: all customers are interested in all vehicles that have promotions.
        </div>

        {loading ? (
          <div style={{ marginTop: 14 }}>Loading...</div>
        ) : (
          <table className="table" style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Vehicle Brand</th>
                <th>Vehicle Model</th>
                <th>Promotion Title</th>
                <th>Discount Value</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td>
                    {r.FirstName} {r.LastName}
                  </td>
                  <td>{r.Brand}</td>
                  <td>{r.Model}</td>
                  <td>{r.Title}</td>
                  <td>{r.Discount_Value}</td>
                  <td>{r.Performance}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan="6" style={{ color: '#666' }}>
                    No data yet. Create customers, promotions, vehicles, and assign promotions to vehicles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}


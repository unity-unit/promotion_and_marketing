import React, { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE

const PROMO_TITLES = [
  'New Year sale',
  'Holiday Price Slash',
  'Weekend Flash Sale',
  'Clearance Discount Offer',
  'Seasonal Price Drop'
]

export default function PromotionPage() {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({
    Title: '',
    Description: '',
    Discount_Type: 'percentage',
    Discount_Value: '',
    Start_Date: new Date().toISOString().slice(0, 10),
    End_Date: new Date().toISOString().slice(0, 10),
    Status: 'Active'
  })
  const [editingId, setEditingId] = useState(null)

  const [vehicles, setVehicles] = useState([])
  const [promotionVehicles, setPromotionVehicles] = useState([])
  const [assignPromoId, setAssignPromoId] = useState('')
  const [assignVehicleId, setAssignVehicleId] = useState('')
  const [performance, setPerformance] = useState('')

  const apiPromo = useMemo(() => `${API_BASE}/api/promotions`, [])
  const apiVehicles = useMemo(() => `${API_BASE}/api/vehicles`, [])

  async function loadPromos() {
    const u = q ? `${apiPromo}?q=${encodeURIComponent(q)}` : apiPromo
    const r = await fetch(u, { credentials: 'include' })
    const j = await r.json().catch(() => [])
    setRows(Array.isArray(j) ? j : [])
  }

  async function loadVehicles() {
    const r = await fetch(apiVehicles, { credentials: 'include' })
    const j = await r.json().catch(() => [])
    setVehicles(Array.isArray(j) ? j : [])
  }

  async function loadLinks(promotionId) {
    if (!promotionId) {
      setPromotionVehicles([])
      return
    }
    const r = await fetch(`${API_BASE}/api/promotion-vehicles?promotionId=${promotionId}`, {
      credentials: 'include'
    })
    const j = await r.json().catch(() => [])
    setPromotionVehicles(Array.isArray(j) ? j : [])
  }

  useEffect(() => {
    loadPromos()
    loadVehicles()
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (assignPromoId) loadLinks(assignPromoId)
    // eslint-disable-next-line
  }, [assignPromoId])

  async function onSave(e) {
    e.preventDefault()
    const payload = {
      ...form,
      Discount_Value: Number(form.Discount_Value)
    }

    if (editingId) {
      await fetch(`${apiPromo}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
    } else {
      await fetch(apiPromo, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
    }

    setEditingId(null)
    setForm({
      Title: '',
      Description: '',
      Discount_Type: 'percentage',
      Discount_Value: '',
      Start_Date: new Date().toISOString().slice(0, 10),
      End_Date: new Date().toISOString().slice(0, 10),
      Status: 'Active'
    })
    loadPromos()
  }

  function startEdit(r) {
    setEditingId(r.id)
    setForm({
      Title: r.Title || '',
      Description: r.Description || '',
      Discount_Type: r.Discount_Type || 'percentage',
      Discount_Value: r.Discount_Value ?? '',
      Start_Date: r.Start_Date || new Date().toISOString().slice(0, 10),
      End_Date: r.End_Date || new Date().toISOString().slice(0, 10),
      Status: r.Status || 'Active'
    })
  }

  async function onDelete(id) {
    await fetch(`${apiPromo}/${id}`, { method: 'DELETE', credentials: 'include' })
    loadPromos()
    if (assignPromoId && String(assignPromoId) === String(id)) {
      setAssignPromoId('')
      setPromotionVehicles([])
    }
  }

  async function onAssign(e) {
    e.preventDefault()
    if (!assignPromoId || !assignVehicleId) return

    await fetch(`${API_BASE}/api/promotion-vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        PromotionId: Number(assignPromoId),
        VehicleId: Number(assignVehicleId),
        Performance: performance || 'Good'
      })
    })

    setPerformance('')
    loadLinks(assignPromoId)
  }

  async function onUnassign(promotionId, vehicleId) {
    await fetch(
      `${API_BASE}/api/promotion-vehicles?promotionId=${promotionId}&vehicleId=${vehicleId}`,
      { method: 'DELETE', credentials: 'include' }
    )
    loadLinks(promotionId)
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Promotions</h2>
        <div className="row" style={{ marginTop: 8 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
          <button className="secondary" type="button" onClick={loadPromos}>
            Search
          </button>
        </div>

        <div className="grid" style={{ marginTop: 14 }}>
          <div className="card" style={{ margin: 0 }}>
            <h3>{editingId ? 'Edit promotion' : 'Add promotion'}</h3>
            <form onSubmit={onSave}>
              <label>Title</label>
              <select value={form.Title} onChange={(e) => setForm({ ...form, Title: e.target.value })}>
                <option value="">Select title</option>
                {PROMO_TITLES.map((t) => (
                  <option value={t} key={t}>
                    {t}
                  </option>
                ))}
              </select>

              <label style={{ marginTop: 10 }}>Description</label>
              <textarea value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })} />

              <label style={{ marginTop: 10 }}>Discount_Type</label>
              <select value={form.Discount_Type} onChange={(e) => setForm({ ...form, Discount_Type: e.target.value })}>
                <option value="free">free</option>
                <option value="percentage">percentage</option>
                <option value="FLAT_RATE">FLAT_RATE</option>
                <option value="CASHBACK">CASHBACK</option>
                <option value="BUY_ONE">BUY_ONE</option>
                <option value="GET_ONE">GET_ONE</option>
                <option value="Bundle">Bundle</option>
                <option value="CASH">CASH</option>
              </select>

              <label style={{ marginTop: 10 }}>Discount_Value</label>
              <input value={form.Discount_Value} onChange={(e) => setForm({ ...form, Discount_Value: e.target.value })} />

              <label style={{ marginTop: 10 }}>Start_Date</label>
              <input value={form.Start_Date} onChange={(e) => setForm({ ...form, Start_Date: e.target.value })} />

              <label style={{ marginTop: 10 }}>End_Date</label>
              <input value={form.End_Date} onChange={(e) => setForm({ ...form, End_Date: e.target.value })} />

              <label style={{ marginTop: 10 }}>Status</label>
              <select value={form.Status} onChange={(e) => setForm({ ...form, Status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Blocked">Blocked</option>
              </select>

              <div className="row" style={{ marginTop: 14 }}>
                <button type="submit">Save</button>
                {editingId && (
                  <button
                    className="secondary"
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      setForm({
                        Title: '',
                        Description: '',
                        Discount_Type: 'percentage',
                        Discount_Value: '',
                        Start_Date: new Date().toISOString().slice(0, 10),
                        End_Date: new Date().toISOString().slice(0, 10),
                        Status: 'Active'
                      })
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="card" style={{ marginTop: 16, background: '#fff' }}>
              <h3>Assign Vehicles to Promotion</h3>
              <form onSubmit={onAssign}>
                <label>Promotion</label>
                <select value={assignPromoId} onChange={(e) => setAssignPromoId(e.target.value)}>
                  <option value="">Select promotion</option>
                  {rows.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.Title}
                    </option>
                  ))}
                </select>

                <label style={{ marginTop: 10 }}>Vehicle</label>
                <select value={assignVehicleId} onChange={(e) => setAssignVehicleId(e.target.value)}>
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.Brand} {v.Model} ({v.Plate_Number})
                    </option>
                  ))}
                </select>

                <label style={{ marginTop: 10 }}>Performance</label>
                <input value={performance} onChange={(e) => setPerformance(e.target.value)} placeholder="e.g. Excellent" />

                <div className="row" style={{ marginTop: 14 }}>
                  <button type="submit">Assign</button>
                </div>
              </form>
            </div>
          </div>

          <div className="card" style={{ margin: 0 }}>
            <h3>Promotions list</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.Title}</td>
                    <td>{r.Discount_Type}</td>
                    <td>{r.Discount_Value}</td>
                    <td>{r.Status}</td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <button className="secondary" type="button" onClick={() => startEdit(r)}>
                          Edit
                        </button>
                        <button className="secondary" type="button" onClick={() => onDelete(r.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="card" style={{ marginTop: 16 }}>
              <h3>Assigned vehicles (for selected promotion)</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>VehicleId</th>
                    <th>Performance</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {promotionVehicles.map((pv) => (
                    <tr key={pv.id}>
                      <td>{pv.VehicleId}</td>
                      <td>{pv.Performance}</td>
                      <td>
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => onUnassign(pv.PromotionId, pv.VehicleId)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!promotionVehicles.length && (
                    <tr>
                      <td colSpan="3" style={{ color: '#666' }}>
                        Select a promotion to view assigned vehicles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


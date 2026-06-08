import React, { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE

function emptyVehicle() {
  return {
    Plate_Number: '',
    Brand: '',
    Model: '',
    Year: '',
    Vehicle_Type: '',
    Purchase_Price: '',
    Status: ''
  }
}

export default function VehiclePage() {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptyVehicle())
  const [editingId, setEditingId] = useState(null)

  const api = useMemo(() => `${API_BASE}/api/vehicles`, [])

  async function load() {
    const u = q ? `${api}?q=${encodeURIComponent(q)}` : api
    const r = await fetch(u, { credentials: 'include' })
    const j = await r.json().catch(() => [])
    setRows(Array.isArray(j) ? j : [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line
  }, [])

  async function onSave(e) {
    e.preventDefault()
    const payload = { ...form, Year: Number(form.Year), Purchase_Price: Number(form.Purchase_Price) }

    if (editingId) {
      await fetch(`${api}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
    } else {
      await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
    }

    setForm(emptyVehicle())
    setEditingId(null)
    load()
  }

  async function onDelete(id) {
    await fetch(`${api}/${id}`, { method: 'DELETE', credentials: 'include' })
    load()
  }

  function startEdit(r) {
    setEditingId(r.id)
    setForm({
      Plate_Number: r.Plate_Number || '',
      Brand: r.Brand || '',
      Model: r.Model || '',
      Year: r.Year ?? '',
      Vehicle_Type: r.Vehicle_Type || '',
      Purchase_Price: r.Purchase_Price ?? '',
      Status: r.Status || ''
    })
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Vehicles</h2>
        <div className="row" style={{ marginTop: 8 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
          <button className="secondary" type="button" onClick={load}>
            Search
          </button>
        </div>

        <div className="grid" style={{ marginTop: 14 }}>
          <div className="card" style={{ margin: 0 }}>
            <h3>{editingId ? 'Edit vehicle' : 'Add vehicle'}</h3>
            <form onSubmit={onSave}>
              <label>Plate_Number</label>
              <input value={form.Plate_Number} onChange={(e) => setForm({ ...form, Plate_Number: e.target.value })} />

              <label style={{ marginTop: 10 }}>Brand</label>
              <input value={form.Brand} onChange={(e) => setForm({ ...form, Brand: e.target.value })} />

              <label style={{ marginTop: 10 }}>Model</label>
              <input value={form.Model} onChange={(e) => setForm({ ...form, Model: e.target.value })} />

              <label style={{ marginTop: 10 }}>Year</label>
              <input value={form.Year} onChange={(e) => setForm({ ...form, Year: e.target.value })} />

              <label style={{ marginTop: 10 }}>Vehicle_Type</label>
              <input value={form.Vehicle_Type} onChange={(e) => setForm({ ...form, Vehicle_Type: e.target.value })} />

              <label style={{ marginTop: 10 }}>Purchase_Price</label>
              <input value={form.Purchase_Price} onChange={(e) => setForm({ ...form, Purchase_Price: e.target.value })} />

              <label style={{ marginTop: 10 }}>Status</label>
              <input value={form.Status} onChange={(e) => setForm({ ...form, Status: e.target.value })} />

              <div className="row" style={{ marginTop: 14 }}>
                <button type="submit">Save</button>
                {editingId && (
                  <button
                    className="secondary"
                    type="button"
                    onClick={() => {
                      setForm(emptyVehicle())
                      setEditingId(null)
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card" style={{ margin: 0 }}>
            <h3>List</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Plate</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.Plate_Number}</td>
                    <td>{r.Brand}</td>
                    <td>{r.Model}</td>
                    <td>{r.Year}</td>
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
          </div>
        </div>
      </div>
    </div>
  )
}


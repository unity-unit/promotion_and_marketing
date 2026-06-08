import React, { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE

function emptyCustomer() {
  return {
    FirstName: '',
    LastName: '',
    Email: '',
    PhoneNumber: '',
    CreatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    Status: 'Active'
  }
}

export default function CustomerPage() {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptyCustomer())
  const [editingId, setEditingId] = useState(null)

  const api = useMemo(() => `${API_BASE}/api/customers`, [])

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
    const payload = { ...form }

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

    setForm(emptyCustomer())
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
      FirstName: r.FirstName || '',
      LastName: r.LastName || '',
      Email: r.Email || '',
      PhoneNumber: r.PhoneNumber || '',
      CreatedAt: r.CreatedAt ? String(r.CreatedAt).slice(0, 19).replace('T', ' ') : '',
      Status: r.Status || 'Active'
    })
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Customers</h2>
        <div className="row" style={{ marginTop: 8 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
          <button className="secondary" type="button" onClick={load}>
            Search
          </button>
        </div>

        <div className="grid" style={{ marginTop: 14 }}>
          <div className="card" style={{ margin: 0 }}>
            <h3>{editingId ? 'Edit customer' : 'Add customer'}</h3>
            <form onSubmit={onSave}>
              <label>FirstName</label>
              <input value={form.FirstName} onChange={(e) => setForm({ ...form, FirstName: e.target.value })} />

              <label style={{ marginTop: 10 }}>LastName</label>
              <input value={form.LastName} onChange={(e) => setForm({ ...form, LastName: e.target.value })} />

              <label style={{ marginTop: 10 }}>Email</label>
              <input value={form.Email} onChange={(e) => setForm({ ...form, Email: e.target.value })} />

              <label style={{ marginTop: 10 }}>PhoneNumber</label>
              <input value={form.PhoneNumber} onChange={(e) => setForm({ ...form, PhoneNumber: e.target.value })} />

              <label style={{ marginTop: 10 }}>CreatedAt</label>
              <input value={form.CreatedAt} onChange={(e) => setForm({ ...form, CreatedAt: e.target.value })} />

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
                      setForm(emptyCustomer())
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
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.FirstName} {r.LastName}
                    </td>
                    <td>{r.Email}</td>
                    <td>{r.PhoneNumber}</td>
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


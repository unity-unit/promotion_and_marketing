import React from 'react'
import { Link } from 'react-router-dom'

export default function DashboardHome() {
  return (
    <div className="container">
      <div className="card">
        <h2>Welcome to SwiftWheels PMS</h2>
        <p style={{ marginTop: 8 }}>
          Please login or register to manage Vehicles, Customers, Promotions, and view the Promotions Report.
        </p>
        <div className="row" style={{ marginTop: 14 }}>
          <Link to="/login" style={{ padding: 10, borderRadius: 10, background: '#2563eb', color: 'white', fontWeight: 800, textDecoration: 'none' }}>
            Login
          </Link>
          <Link to="/register" style={{ padding: 10, borderRadius: 10, background: '#64748b', color: 'white', fontWeight: 800, textDecoration: 'none' }}>
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}


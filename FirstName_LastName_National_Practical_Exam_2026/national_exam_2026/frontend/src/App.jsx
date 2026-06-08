import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
// Login/Register pages are kept but not shown in the main navigation
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

import Dashboard from './pages/Dashboard.jsx'
import VehiclePage from './pages/VehiclePage.jsx'
import CustomerPage from './pages/CustomerPage.jsx'
import PromotionPage from './pages/PromotionPage.jsx'
import ReportPage from './pages/ReportPage.jsx'
import DashboardHome from './pages/DashboardHome.jsx'
import NavigationFooter from './pages/NavigationFooter.jsx'

function Protected({ children }) {
  const [me, setMe] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
    })
      .then(r => (r.ok ? r.json() : null))
      .then(setMe)
  }, [])

  if (me === null) return <div style={{ padding: 16 }}>Loading...</div>
  return me ? children : <Navigate to="/login" replace />
}

export default function App() {
  const apiBase = import.meta.env.VITE_API_BASE
  useEffect(() => {
    // no-op; keep env reference for bundlers
    void apiBase
  }, [apiBase])

  if (!me) {
    // will be set by Protected; this fallback route prevents blank home screens
  }

  return (
    <div className="appShell">
      <nav className="topNav">
        <div className="brand">SwiftWheels PMS</div>
        <div className="navLinks">
          <Link to="/">Home</Link>
          <Link to="/vehicles">Vehicles</Link>
          <Link to="/customers">Customers</Link>
          <Link to="/promotions">Promotions</Link>
          <Link to="/report">Report</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<DashboardHome />} />

        <Route path="/vehicles" element={<VehiclePage />} />
        <Route path="/customers" element={<CustomerPage />} />
        <Route path="/promotions" element={<PromotionPage />} />
        <Route path="/report" element={<ReportPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
      <NavigationFooter />
    </div>
  )
}



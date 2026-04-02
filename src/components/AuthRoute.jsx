import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Loading from './Loading'
import { useAuth } from '../context/AuthContext'

export const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, authError } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading fullPage message="Yuklanmoqda..." />
  }

  if (authError) {
    return (
      <div className="error-full-page" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Supabase ulanish xatosi</h2>
        <p>{authError}</p>
        <button onClick={() => window.location.reload()}>Beti qayta yuklash</button>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading, authError } = useAuth()

  if (loading) {
    return <Loading fullPage message="Yuklanmoqda..." />
  }

  if (authError) {
    return (
      <div className="error-full-page" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Supabase ulanish xatosi</h2>
        <p>{authError}</p>
        <button onClick={() => window.location.reload()}>Beti qayta yuklash</button>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

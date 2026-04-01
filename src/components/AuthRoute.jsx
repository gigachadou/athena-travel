import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Loading from './Loading'
import { useAuth } from '../context/AuthContext'

export const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading fullPage message="Yuklanmoqda..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <Loading fullPage message="Yuklanmoqda..." />
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OTPPage from './pages/OTPPage'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import TicketsListPage from './pages/TicketsListPage'
import TicketPage from './pages/TicketPage'
import AIPage from './pages/AIPage'
import MapPage from './pages/MapPage'
import ProfilePage from './pages/ProfilePage'
import ThisPlacePage from './pages/ThisPlacePage'
import NotFoundPage from './pages/NotFoundPage'
import Layout from './components/Layout'
import { PrivateRoute, PublicOnlyRoute } from './components/AuthRoute'

function App() {
  // Initialize theme and language on mount
  useState(() => {
    const savedSettings = localStorage.getItem('afina_settings')
    if (savedSettings) {
      const { darkMode, language } = JSON.parse(savedSettings)
      document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    }
  })

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/otp" element={<PublicOnlyRoute><OTPPage /></PublicOnlyRoute>} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/tickets" element={<TicketsListPage />} />
          <Route path="/ticket/:id" element={<TicketPage />} />
          <Route path="/ticket/:placeId/:ticketId" element={<TicketPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/place/:id" element={<ThisPlacePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  )
}

export default App

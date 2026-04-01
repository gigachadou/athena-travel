import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OTPPage from './pages/OTPPage'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import AIPage from './pages/AIPage'
import MapPage from './pages/MapPage'
import ProfilePage from './pages/ProfilePage'
import ThisPlacePage from './pages/ThisPlacePage'
import NotFoundPage from './pages/NotFoundPage'
import Layout from './components/Layout'

function App() {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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
        <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<RegisterPage setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/otp" element={<OTPPage setIsAuthenticated={setIsAuthenticated} />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<ProfilePage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/place/:id" element={<ThisPlacePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  )
}

export default App

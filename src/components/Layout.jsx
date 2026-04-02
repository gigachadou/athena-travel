import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header, Footer } from './Navigation'

const Layout = () => {
  const location = useLocation()
  
  // Hide global header on place details and ticket booking pages
  const hideHeader = location.pathname.startsWith('/place/') || location.pathname.startsWith('/ticket/')
  
  return (
    <div className="layout">
      {!hideHeader && <Header />}
      <main className={`main-content container ${hideHeader ? 'full-map-content' : ''}`}>
        <Outlet />
      </main>
      <Footer />
      <style>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding-bottom: 80px; /* Space for fixed footer */
        }
        .main-content {
          flex: 1;
          padding: 20px;
          animation: fadeIn 0.5s ease-out;
        }
        .full-map-content {
          padding: 0 !important;
          max-width: none !important;
        }
      `}</style>
    </div>
  )
}

export default Layout

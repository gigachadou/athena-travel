import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header, Footer } from './Navigation'

const Layout = () => {
  const location = useLocation()
  
  // Hide global header on place details and ticket booking pages for premium look
  const hideHeader = location.pathname.startsWith('/place/') || location.pathname.startsWith('/ticket/')
  const isMapPage = location.pathname === '/map'

  return (
    <div className="layout">
      {!hideHeader && <Header />}
      <main className={`main-content ${isMapPage || hideHeader ? 'full-map-content' : 'container'}`}>
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
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  )
}

export default Layout

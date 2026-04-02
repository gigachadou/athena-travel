import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header, Footer } from './Navigation'

const Layout = () => {
  const location = useLocation()
  const isPlacePage = location.pathname.startsWith('/place/')

  return (
    <div className="layout">
      {!isPlacePage && <Header />}
      <main className="main-content container">
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
      `}</style>
    </div>
  )
}

export default Layout

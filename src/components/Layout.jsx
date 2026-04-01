import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header, Footer } from './Navigation'

const Layout = () => {
  return (
    <div className="layout">
      <Header />
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

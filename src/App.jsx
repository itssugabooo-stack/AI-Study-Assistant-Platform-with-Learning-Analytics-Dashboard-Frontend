import { useState } from 'react'
import Taskbar from './components/Taskbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AboutPage from './pages/AboutPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [authMode, setAuthMode] = useState('login')

  function openAuth(mode) {
    setAuthMode(mode)
    setCurrentPage('login')
  }

  return (
    <>
      {currentPage === 'home' && (
        <Taskbar
          onLogin={() => openAuth('login')}
          onNavigate={setCurrentPage}
          onSignup={() => openAuth('signup')}
        />
      )}

      {currentPage === 'home' && (
        <HomePage
          onGetStarted={() => openAuth('signup')}
          onLogin={() => openAuth('login')}
        />
      )}
      {currentPage === 'login' && (
        <LoginPage
          initialMode={authMode}
          onBack={() => setCurrentPage('home')}
          onLogin={() => setCurrentPage('dashboard')}
        />
      )}
      {currentPage === 'about' && <AboutPage />}
      {currentPage === 'dashboard' && <DashboardPage onNavigate={setCurrentPage} />}  
    </>
  )
}

export default App

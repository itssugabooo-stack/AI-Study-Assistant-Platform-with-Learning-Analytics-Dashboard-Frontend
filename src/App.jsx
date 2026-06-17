import { useEffect, useState } from 'react'
import Taskbar from './components/Taskbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AboutPage from './pages/AboutPage'
import DashboardPage from './pages/DashboardPage'
import DocumentsPage from './pages/DocumentsPage'
import DocumentWorkspacePage from './pages/DocumentWorkspacePage'
import FlashcardsPage from './pages/FlashcardsPage'
import QuizHistoryPage from './pages/QuizHistoryPage'
import { getAnalytics, getCurrentUser } from './services/api'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [authMode, setAuthMode] = useState('login')
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('studypilot-theme')

    if (savedTheme) {
      return savedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [user, setUser] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [activeDocument, setActiveDocument] = useState(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('studypilot-theme', theme)
  }, [theme])

  useEffect(() => {
    const token = localStorage.getItem('studypilot-token')

    if (!token) {
      return
    }

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        setCurrentPage('dashboard')
      } catch (error) {
        localStorage.removeItem('studypilot-token')
      }
    }

    loadUser()
  }, [])

  useEffect(() => {
    if (currentPage !== 'dashboard' || !user) {
      return
    }

    async function loadAnalytics() {
      try {
        const data = await getAnalytics()
        setAnalytics(data)
      } catch (error) {
        setAnalytics(null)
      }
    }

    loadAnalytics()
  }, [currentPage, user])

  function openAuth(mode) {
    setAuthMode(mode)
    setCurrentPage('login')
  }

  async function handleAuthSuccess(token) {
    localStorage.setItem('studypilot-token', token)
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setCurrentPage('dashboard')
    } catch (error) {
      setUser(null)
      setCurrentPage('home')
    }
  }

  function handleLogout() {
    localStorage.removeItem('studypilot-token')
    setUser(null)
    setAnalytics(null)
    setActiveDocument(null)
    setCurrentPage('home')
  }

  function handleNavigate(page) {
    if (!user && page !== 'home' && page !== 'about' && page !== 'login') {
      setAuthMode('login')
      setCurrentPage('login')
      return
    }

    setCurrentPage(page)
  }

  return (
    <>
      {currentPage === 'home' && (
        <Taskbar
          onLogin={() => openAuth('login')}
          onNavigate={handleNavigate}
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
          onLoginSuccess={handleAuthSuccess}
        />
      )}

      {currentPage === 'about' && <AboutPage />}

      {currentPage === 'dashboard' && (
        <DashboardPage
          analytics={analytics}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          onToggleTheme={() => setTheme((currentTheme) => (
            currentTheme === 'light' ? 'dark' : 'light'
          ))}
          theme={theme}
          user={user}
        />
      )}

      {currentPage === 'documents' && (
        <DocumentsPage
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          onOpenDocument={(doc) => {
            setActiveDocument(doc)
            setCurrentPage('document-workspace')
          }}
        />
      )}

      {currentPage === 'document-workspace' && (
        <DocumentWorkspacePage
          user={user}
          document={activeDocument}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}

      {currentPage === 'flashcards' && (
        <FlashcardsPage
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}

      {currentPage === 'quiz-history' && (
        <QuizHistoryPage
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}
    </>
  )
}

export default App

import { useEffect, useState } from 'react'
import Taskbar from './components/Taskbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AboutPage from './pages/AboutPage'
import DashboardPage from './pages/DashboardPage'
import DocumentsPage from './pages/DocumentsPage'
import DocumentWorkspacePage from './pages/DocumentWorkspacePage'
import PracticePage from './pages/PracticePage'
import AITutorPage from './pages/AITutorPage'
import StudyPlanPage from './pages/StudyPlanPage'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [authMode, setAuthMode] = useState('login')
  const [selectedDocumentId, setSelectedDocumentId] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('studypilot-theme') || 'day')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('studypilot-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'day' ? 'night' : 'day'))
  }

  function openAuth(mode) {
    setAuthMode(mode)
    setCurrentPage('login')
  }

  function openDocument(documentId) {
    setSelectedDocumentId(documentId)
    setCurrentPage('document-workspace')
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

      {currentPage === 'document-workspace' && (
        <DocumentWorkspacePage
        documentId={selectedDocumentId}
        onNavigate={setCurrentPage}
        onToggleTheme={toggleTheme}
        theme={theme}
        />
      )}

      {currentPage === 'library' && <DocumentsPage onNavigate={setCurrentPage} onOpenDocument={openDocument} onToggleTheme={toggleTheme} theme={theme} />}
      {currentPage === 'practice' && <PracticePage onNavigate={setCurrentPage} onOpenDocument={openDocument} onToggleTheme={toggleTheme} theme={theme} />}
      {currentPage === 'ai-tutor' && <AITutorPage onNavigate={setCurrentPage} onOpenDocument={openDocument} onToggleTheme={toggleTheme} theme={theme} />}
      {currentPage === 'study-plan' && <StudyPlanPage onNavigate={setCurrentPage} onOpenDocument={openDocument} onToggleTheme={toggleTheme} theme={theme} />}
      {currentPage === 'about' && <AboutPage />}
      {currentPage === 'dashboard' && <DashboardPage onNavigate={setCurrentPage} onToggleTheme={toggleTheme} theme={theme} />}
    </>
  )
}

export default App

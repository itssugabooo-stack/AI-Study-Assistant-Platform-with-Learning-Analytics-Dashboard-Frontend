import { useState } from 'react'
import Taskbar from './components/Taskbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AboutPage from './pages/AboutPage'
import DashboardPage from './pages/DashboardPage'
import DocumentsPage from './pages/DocumentsPage'
import DocumentWorkspacePage from './pages/DocumentWorkspacePage'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [authMode, setAuthMode] = useState('login')
  const [selectedDocumentId, setSelectedDocumentId] = useState(null)

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
        />
      )}

      {currentPage === 'library' && <DocumentsPage onNavigate={setCurrentPage} onOpenDocument={openDocument} />}
      {currentPage === 'about' && <AboutPage />}
      {currentPage === 'dashboard' && <DashboardPage onNavigate={setCurrentPage} />}
    </>
  )
}

export default App

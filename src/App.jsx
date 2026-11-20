import { useEffect, useState, useSyncExternalStore } from 'react'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DocumentsPage from './pages/DocumentsPage'
import DocumentWorkspacePage from './pages/DocumentWorkspacePage'
import PracticePage from './pages/PracticePage'
import StudyPlanPage from './pages/StudyPlanPage'
import ErrorPage from './pages/ErrorPage'
import PageBoundary from './components/PageBoundary'
import WorkspaceShell from './components/WorkspaceShell'
import { logoutUser } from './api/auth'
import { getToken, sessionExpiredEvent } from './api/client'
import { authPath, documentPath, getLocation, navigateTo, readReturnPath, readRoute, subscribeToLocation, workspacePaths } from './routes'

function redirectToSignIn() {
  const url = new URL(getLocation())
  if (readRoute(url).workspace) {
    navigateTo(authPath('login', url.pathname + url.search), { replace: true })
  }
}

function App() {
  const location = useSyncExternalStore(subscribeToLocation, getLocation)
  const url = new URL(location)
  const route = readRoute(url)
  const currentPage = route.page
  const requiresSignIn = route.workspace && !getToken()
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('studypilot-theme')
    return savedTheme === 'day' || savedTheme === 'night' ? savedTheme : 'day'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('studypilot-theme', theme)
  }, [theme])

  useEffect(() => {
    if (requiresSignIn) redirectToSignIn()
  }, [requiresSignIn, location])

  useEffect(() => {
    if (currentPage !== 'home' && currentPage !== 'login') return
    const anchor = currentPage === 'home' && document.getElementById(new URL(location).hash.slice(1))
    if (anchor) anchor.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [currentPage, location])

  useEffect(() => {
    function handleStorage(event) {
      if ((event.key === 'access_token' || event.key === null) && !getToken()) redirectToSignIn()
    }

    window.addEventListener(sessionExpiredEvent, redirectToSignIn)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(sessionExpiredEvent, redirectToSignIn)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  function toggleTheme() {
    setTheme((current) => current === 'day' ? 'night' : 'day')
  }

  function openHome() {
    navigateTo('/', { replace: currentPage === 'not-found' })
  }

  function navigate(page) {
    navigateTo(workspacePaths[page])
  }

  function openUpload() {
    navigateTo(workspacePaths.library, { state: { showUpload: true } })
  }

  function openDocument(id, tool) {
    navigateTo(documentPath(id, tool))
  }

  function handleLogout() {
    logoutUser()
    navigateTo('/', { replace: true })
  }

  const themeControls = { theme, onToggleTheme: toggleTheme }
  const publicRecovery = { ...themeControls, onBack: openHome }

  if (requiresSignIn) return <main className="sp-page"><p role="status">Opening sign in…</p></main>

  if (currentPage === 'not-found') {
    return <ErrorPage {...publicRecovery} title="Page not found" description="This address doesn’t match a page in StudyPilot." />
  }

  if (currentPage === 'home' || currentPage === 'login') {
    const returnPath = readReturnPath(url)
    const destination = returnPath ?? workspacePaths.dashboard
    function finishLogin() {
      if (readRoute(new URL(destination, url.origin)).page === 'dashboard') {
        performance.mark('StudyPilot token received')
      }
      navigateTo(destination, { replace: true })
    }
    return (
      <PageBoundary key={currentPage} recovery={publicRecovery}>
        {currentPage === 'home'
          ? <HomePage {...themeControls} />
          : <LoginPage
              {...themeControls}
              mode={route.mode}
              onBack={openHome}
              onModeChange={(mode, options) => navigateTo(authPath(mode, returnPath), options)}
              onLogin={finishLogin}
            />}
      </PageBoundary>
    )
  }

  const routeKey = route.documentId ? `${currentPage}-${route.documentId}` : currentPage
  let content
  switch (currentPage) {
    case 'dashboard':
      content = <DashboardPage onNavigate={navigate} onUpload={openUpload} />
      break
    case 'library':
      content = <DocumentsPage showUploadInitially={Boolean(window.history.state?.showUpload)} />
      break
    case 'document-workspace':
      content = <DocumentWorkspacePage
        documentId={route.documentId}
        activeTool={route.tool}
        onSelectTool={(tool) => openDocument(route.documentId, tool)}
        onNavigate={navigate}
      />
      break
    case 'practice':
      content = <PracticePage onNavigate={navigate} onOpenDocument={openDocument} />
      break
    case 'study-plan':
      content = <StudyPlanPage onNavigate={navigate} onOpenDocument={openDocument} />
      break
  }

  function recoverWorkspace() {
    if (currentPage === 'dashboard') handleLogout()
    else navigate('dashboard')
  }

  return (
    <WorkspaceShell {...themeControls} currentPage={currentPage} routeKey={routeKey} onLogout={handleLogout}>
      <PageBoundary key={routeKey} recovery={{
        embedded: true,
        onBack: recoverWorkspace,
        backLabel: currentPage === 'dashboard' ? 'Back to sign-in entry' : 'Back to overview',
      }}>
        {content}
      </PageBoundary>
    </WorkspaceShell>
  )
}

export default App

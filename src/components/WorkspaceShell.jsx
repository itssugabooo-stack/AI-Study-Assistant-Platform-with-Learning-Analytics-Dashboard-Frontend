import { useEffect, useRef, useState } from 'react'
import Logo from './Logo'
import RouteLink from './RouteLink'
import ThemeToggle from './ThemeToggle'
import { workspacePaths } from '../routes'

const navigation = [
  { key: 'dashboard', label: 'Overview', icon: 'overview' },
  { key: 'library', label: 'Library', icon: 'library' },
  { key: 'practice', label: 'Practice', icon: 'practice' },
  { key: 'study-plan', label: 'Study Plan', icon: 'plan' },
]

function Navigation({ currentPage, onNavigate }) {
  const activePage = currentPage === 'document-workspace' ? 'library' : currentPage

  return (
    <nav className="sp-navigation" aria-label="Workspace">
      {navigation.map(({ key, label, icon }) => (
        <RouteLink key={key} to={workspacePaths[key]} aria-current={activePage === key ? 'page' : undefined} onNavigate={() => onNavigate(key)}>
          <span className={`sp-nav-icon sp-icon-${icon}`} aria-hidden="true" />{label}
        </RouteLink>
      ))}
    </nav>
  )
}

function WorkspaceShell({ currentPage, routeKey, onLogout, theme, onToggleTheme, children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef(null)
  const main = useRef(null)
  const lastPage = useRef(null)

  useEffect(() => {
    if (lastPage.current === routeKey) return
    lastPage.current = routeKey
    main.current.focus()
    window.scrollTo(0, 0)
  }, [routeKey])

  useEffect(() => {
    function closeMenu() {
      setMenuOpen(false)
    }
    window.addEventListener('popstate', closeMenu)
    return () => window.removeEventListener('popstate', closeMenu)
  }, [])

  function handleNavigate(page) {
    setMenuOpen(false)
    if (page === currentPage) main.current.focus()
  }

  function handleMenuKey(event) {
    if (event.key === 'Escape' && menuOpen) {
      event.preventDefault()
      setMenuOpen(false)
      menuButton.current.focus()
    }
  }

  const accountActions = (
    <div className="sp-account-actions">
      <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
      <button className="sp-button sp-plain" type="button" onClick={onLogout}>Sign out</button>
    </div>
  )

  return (
    <div className="sp-shell" onKeyDown={handleMenuKey}>
      <a className="sp-skip-link" href="#workspace-main" onClick={(event) => {
        event.preventDefault()
        main.current.focus()
      }}>Skip to content</a>
      <aside className="sp-sidebar">
        <RouteLink className="sp-brand-button" to={workspacePaths.dashboard} onNavigate={() => handleNavigate('dashboard')} aria-label="StudyPilot overview"><Logo /></RouteLink>
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
        {accountActions}
      </aside>
      <header className="sp-mobile-header">
        <div className="sp-mobile-bar">
          <RouteLink className="sp-brand-button" to={workspacePaths.dashboard} onNavigate={() => handleNavigate('dashboard')} aria-label="StudyPilot overview"><Logo /></RouteLink>
          <button className="sp-button sp-secondary" type="button" ref={menuButton} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>Menu</button>
        </div>
        <div className="sp-mobile-menu" id="mobile-navigation" hidden={!menuOpen}>
          <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
          {accountActions}
        </div>
      </header>
      <main className="sp-main" ref={main} tabIndex={-1} id="workspace-main">{children}</main>
    </div>
  )
}

export default WorkspaceShell

import Logo from './Logo'

const navigationItems = [
  { label: 'Overview', page: 'dashboard', shortLabel: 'OV' },
  { label: 'Documents', page: 'documents', shortLabel: 'DB' },
  { label: 'Flashcards', page: 'flashcards', shortLabel: 'FC' },
  { label: 'Quiz history', page: 'quiz-history', shortLabel: 'QH' },
]

function Sidebar({ activePage = 'dashboard', onLogout, onNavigate, user }) {
  return (
    <aside className="sidebar">
      <button className="sidebar-brand" onClick={() => onNavigate('dashboard')}>
        <Logo />
      </button>

      <p className="sidebar-label">Workspace</p>
      <nav aria-label="Dashboard navigation">
        {navigationItems.map((item) => (
          <button
            className={activePage === item.page ? 'active' : ''}
            key={item.page}
            onClick={() => onNavigate(item.page)}
          >
            <span aria-hidden="true">{item.shortLabel}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-profile">
        <span className="sidebar-avatar" aria-hidden="true">
          {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'SP'}
        </span>
        <div>
          <strong>{user?.full_name || 'StudyPilot user'}</strong>
          <span>{user?.email ? 'Student' : 'Student'}</span>
        </div>
        <button aria-label="Log out" onClick={onLogout} title="Log out">
          Log out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

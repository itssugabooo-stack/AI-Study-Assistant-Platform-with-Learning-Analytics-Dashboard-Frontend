import { useEffect, useState } from 'react';
import Logo from '../components/Logo'
import { getMyAnalytics } from '../api/analytics'
import { getCurrentUser } from '../api/auth';

const dashboardNavItems = [
  { label: 'Overview', page: 'dashboard' },
  { label: 'My Library', page: 'library' },
  { label: 'Practice', page: 'practice' },
  { label: 'AI Tutor', page: 'ai-tutor' },
  { label: 'Study Plan', page: 'study-plan' },
]

function DashboardPage ({ onNavigate, onToggleTheme, theme }) {

  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)


  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [userData, analyticsData] = await Promise.all([
              getCurrentUser(),
              getMyAnalytics(),
            ])

            setUser(userData)
            setAnalytics(analyticsData)
      } catch {
        setError('Unable to load analytics.')
      } finally {
        setLoading(false)
      }
    }

  loadDashboardData()
}, [])

  return (
    <div className="dashboard-screen">
      <header className="dashboard-appbar">
        <button className="dashboard-brand" type="button" onClick={() => onNavigate('dashboard')}>
          <Logo />
        </button>

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          {dashboardNavItems.map((item) => (
            <button
              className={item.page === 'dashboard' ? 'active' : ''}
              key={item.page}
              type="button"
              onClick={() => onNavigate(item.page)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="dashboard-user-menu">
          <button
            aria-label={`Switch to ${theme === 'day' ? 'night' : 'day'} mode`}
            className="theme-toggle-button"
            type="button"
            onClick={onToggleTheme}
          >
            <span className="theme-toggle-track">
              <span className="theme-toggle-thumb">{theme === 'day' ? '☀' : '☾'}</span>
            </span>
          </button>
          <button type="button" onClick={() => onNavigate('library')}>
            Upload
          </button>
        </div>
      </header>

      <main className="dashboard-content dashboard-overview-page">
        <section className="overview-hero">
          <div>
            <p className="dashboard-kicker">Overview</p>
            <h1>Dashboard</h1>
            {user && <p>Welcome back, {user.full_name}. Here is your learning progress.</p>}
          </div>

          <button type="button" onClick={() => onNavigate('library')}>
            Upload PDF
          </button>
        </section>

        {loading && <p className="dashboard-message">Loading analytics...</p>}
        {error && <p className="dashboard-message dashboard-error">{error}</p>}

        {analytics && (
          <>
            <section className="overview-stat-grid">
              <article>
                <span>Documents</span>
                <h2>{analytics.total_documents}</h2>
                <p>Total PDFs uploaded</p>
              </article>

              <article>
                <span>Flashcards</span>
                <h2>{analytics.total_flashcards}</h2>
                <p>Cards saved for review</p>
              </article>

              <article>
                <span>Practice</span>
                <h2>{analytics.total_quiz_attempts}</h2>
                <p>Quiz attempts completed</p>
              </article>

              <article>
                <span>Average</span>
                <h2>{analytics.average_score}%</h2>
                <p>Average quiz score</p>
              </article>
            </section>

            <section className="overview-panels">
              <article>
                <p className="dashboard-kicker">Performance</p>
                <div className="overview-panel-heading">
                  <h2>Quiz score</h2>
                  <strong>{analytics.latest_score}%</strong>
                </div>
                <p>Best score: {analytics.best_score}%</p>
              </article>

              <article>
                <p className="dashboard-kicker">Next step</p>
                <h2>Continue your study flow</h2>
                <p>Open your library, choose a PDF, then generate summary, flashcards, quiz, and roadmap.</p>
                <button type="button" onClick={() => onNavigate('library')}>
                  Open library
                </button>
              </article>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
export default DashboardPage


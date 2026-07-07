import { useEffect, useState } from 'react'
import Logo from '../components/Logo'
import { getMyAnalytics } from '../api/analytics'
import { getCurrentUser } from '../api/auth'
import { getQuizAttempts } from '../api/quizzes'

const dashboardNavItems = [
  { label: 'Overview', page: 'dashboard' },
  { label: 'My Library', page: 'library' },
  { label: 'Practice', page: 'practice' },
  { label: 'Study Plan', page: 'study-plan' },
]

function getScoreNumber(score) {
  return Number(score ?? 0)
}

function getPeriodAverage(attempts, startDate) {
  const matchingAttempts = attempts.filter((attempt) => {
    if (!attempt.created_at) {
      return false
    }

    return new Date(attempt.created_at) >= startDate
  })

  if (matchingAttempts.length === 0) {
    return {
      attempts: 0,
      value: 0,
    }
  }

  const average = Math.round(
    matchingAttempts.reduce((total, attempt) => total + getScoreNumber(attempt.score_percentage), 0) /
      matchingAttempts.length,
  )

  return {
    attempts: matchingAttempts.length,
    value: average,
  }
}

function getScorePeriodData(attempts) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const week = new Date(today)
  week.setDate(today.getDate() - 6)
  const month = new Date(now.getFullYear(), now.getMonth(), 1)
  const year = new Date(now.getFullYear(), 0, 1)

  return [
    { label: 'Daily', ...getPeriodAverage(attempts, today) },
    { label: 'Weekly', ...getPeriodAverage(attempts, week) },
    { label: 'Monthly', ...getPeriodAverage(attempts, month) },
    { label: 'Yearly', ...getPeriodAverage(attempts, year) },
  ]
}

function DashboardPage({ onNavigate, onToggleTheme, onLogout, theme }) {
  const [analytics, setAnalytics] = useState(null)
  const [quizAttempts, setQuizAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [userData, analyticsData, attemptsData] = await Promise.all([
          getCurrentUser(),
          getMyAnalytics(),
          getQuizAttempts().catch(() => []),
        ])

        setUser(userData)
        setAnalytics(analyticsData)
        setQuizAttempts(Array.isArray(attemptsData) ? attemptsData : attemptsData.attempts ?? [])
      } catch {
        setError('Unable to load analytics.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const activityChartData = analytics
    ? [
        { label: 'Docs', value: analytics.total_documents },
        { label: 'Cards', value: analytics.total_flashcards },
        { label: 'Quizzes', value: analytics.total_quiz_attempts },
      ]
    : []
  const maxActivityValue = Math.max(...activityChartData.map((item) => item.value), 1)
  const scoreChartData = analytics
    ? [
        { label: 'Latest', value: analytics.latest_score },
        { label: 'Average', value: analytics.average_score },
        { label: 'Best', value: analytics.best_score },
      ]
    : []
  const periodScoreData = getScorePeriodData(quizAttempts)
  const scoreGap = analytics ? Math.max(analytics.best_score - analytics.latest_score, 0) : 0

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
          <button className="signout-button" type="button" onClick={onLogout}>
            Logout
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
              <article className="overview-chart-panel">
                <p className="dashboard-kicker">Performance</p>
                <div className="overview-panel-heading">
                  <h2>Score chart</h2>
                  <strong>{analytics.latest_score}%</strong>
                </div>

                <div className="overview-score-chart">
                  {scoreChartData.map((item) => (
                    <div className="overview-score-row" key={item.label}>
                      <span>{item.label}</span>
                      <div aria-label={`${item.label} score ${item.value}%`}>
                        <span style={{ width: `${Math.min(Math.max(item.value, 0), 100)}%` }} />
                      </div>
                      <strong>{item.value}%</strong>
                    </div>
                  ))}
                </div>

                <p className="overview-insight-text">
                  {scoreGap === 0
                    ? 'Latest score matches your best performance.'
                    : `${scoreGap}% away from your best score.`}
                </p>
              </article>

              <article className="overview-chart-panel">
                <p className="dashboard-kicker">Data Analytics</p>
                <div className="overview-panel-heading">
                  <h2>Activity chart</h2>
                  <strong>{activityChartData.reduce((total, item) => total + item.value, 0)}</strong>
                </div>

                <div className="overview-bar-chart" aria-label="Learning activity chart">
                  {activityChartData.map((item) => (
                    <div className="overview-bar-item" key={item.label}>
                      <div>
                        <span
                          style={{
                            height: `${Math.max((item.value / maxActivityValue) * 100, item.value > 0 ? 12 : 4)}%`,
                          }}
                        />
                      </div>
                      <strong>{item.value}</strong>
                      <p>{item.label}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="overview-chart-panel overview-period-panel">
                <p className="dashboard-kicker">Score Analytics</p>
                <div className="overview-panel-heading">
                  <h2>Daily / weekly / monthly / yearly</h2>
                  <strong>{quizAttempts.length}</strong>
                </div>

                <div className="overview-period-chart" aria-label="Score period chart">
                  {periodScoreData.map((item) => (
                    <div className="overview-period-item" key={item.label}>
                      <div>
                        <span style={{ height: `${Math.min(Math.max(item.value, 0), 100)}%` }} />
                      </div>
                      <strong>{item.value}%</strong>
                      <p>{item.label}</p>
                      <small>{item.attempts} attempts</small>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default DashboardPage

import Sidebar from '../components/Sidebar'

function DashboardPage({ analytics, onLogout, onNavigate, onToggleTheme, theme, user }) {
  const today = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date())

  const metrics = analytics ? [
    { change: 'Total documents', label: 'Documents', value: analytics.total_documents ?? '—' },
    { change: 'Flashcards saved', label: 'Flashcards', value: analytics.total_flashcards ?? '—' },
    { change: 'Quizzes attempted', label: 'Quiz attempts', value: analytics.total_quiz_attempts ?? '—' },
    { change: 'Average score', label: 'Average score', value: analytics.average_score ? `${analytics.average_score}%` : '—' },
  ] : [
    { change: '+18% this week', label: 'Study time', value: '12h 40m' },
    { change: '+6% this month', label: 'Quiz average', value: '86%' },
    { change: '3 this week', label: 'Lessons completed', value: '24' },
    { change: 'Best: 14 days', label: 'Current streak', value: '8 days' },
  ]

  const activity = [
    { day: 'Mon', height: 42 },
    { day: 'Tue', height: 64 },
    { day: 'Wed', height: 50 },
    { day: 'Thu', height: 78 },
    { day: 'Fri', height: 58 },
    { day: 'Sat', height: 92 },
    { day: 'Sun', height: 70 },
  ]

  return (
    <div className="dashboard-layout">
      <Sidebar activePage="dashboard" onLogout={onLogout} onNavigate={onNavigate} user={user} />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p>{today}</p>
            <h1>Welcome back, {user?.full_name ?? 'student'}.</h1>
            <span>{analytics ? 'Your latest analytics are ready.' : 'Loading your analytics...'}</span>
          </div>
          <div className="dashboard-header-actions">
            <button
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className="theme-toggle"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <span aria-hidden="true">{theme === 'light' ? 'Moon' : 'Sun'}</span>
            </button>
            <button aria-label="Notifications" className="notification-button">
              <span aria-hidden="true">2</span>
            </button>
            <button className="dashboard-primary-button" onClick={() => onNavigate('documents')}>
              + Add study material
            </button>
          </div>
        </header>

        <section className="dashboard-metrics" aria-label="Learning statistics">
          {metrics.map((metric) => (
            <article key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>{metric.change}</span>
            </article>
          ))}
        </section>

        <section className="dashboard-main-grid">
          <article className="dashboard-card continue-card">
            <div className="card-heading">
              <div>
                <p className="dashboard-eyebrow">Continue learning</p>
                <h2>Open your latest document workspace</h2>
              </div>
              <span>Ready</span>
            </div>
            <p className="continue-description">
              Generate summaries, quizzes, flashcards and roadmaps from your uploaded materials.
            </p>
            <div className="continue-progress"><span /></div>
            <div className="continue-footer">
              <span>Explore your study resources</span>
              <button onClick={() => onNavigate('documents')}>Open documents</button>
            </div>
          </article>

          <article className="dashboard-card activity-card">
            <div className="card-heading">
              <div>
                <p className="dashboard-eyebrow">Weekly activity</p>
                <h2>Study streak insights</h2>
              </div>
              <span className="activity-change">+18%</span>
            </div>
            <div className="activity-chart" aria-label="Study activity by day">
              {activity.map((item) => (
                <div key={item.day}>
                  <span className="activity-bar">
                    <span style={{ height: `${item.height}%` }} />
                  </span>
                  <small>{item.day}</small>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="dashboard-lower-grid">
          <article className="dashboard-card study-plan-card">
            <div className="card-heading">
              <div>
                <p className="dashboard-eyebrow">Saved study tools</p>
                <h2>Your flashcards</h2>
              </div>
              <button className="text-button" onClick={() => onNavigate('flashcards')}>View flashcards</button>
            </div>
            <div className="study-tasks">
              <button onClick={() => onNavigate('flashcards')}>
                <span className="task-status blue" aria-hidden="true" />
                <span>
                  <strong>Review saved flashcards</strong>
                  <small>Keep your key concepts fresh.</small>
                </span>
              </button>
            </div>
          </article>

          <article className="dashboard-card mastery-card">
            <p className="dashboard-eyebrow">Quiz history</p>
            <h2>Track progress</h2>
            <div className="mastery-content">
              <div className="mastery-ring"><strong>{analytics?.latest_score ?? '—'}%</strong></div>
              <div>
                <strong>Your recent score</strong>
                <p>{analytics ? `Best score ${analytics.best_score ?? '—'}%` : 'Quiz results will appear here.'}</p>
                <button className="text-button" onClick={() => onNavigate('quiz-history')}>View attempts</button>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

export default DashboardPage

import { useLayoutEffect } from 'react'
import { getMyAnalytics } from '../api/analytics'
import { getCurrentUser } from '../api/auth'
import { getQuizAttempts } from '../api/quizzes'
import ResourceState from '../components/ResourceState'
import useResource from '../useResource'

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })
const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

function formatScore(value) {
  return value == null || !Number.isFinite(Number(value)) ? '—' : `${numberFormat.format(Number(value))}%`
}

function DashboardPage({ onNavigate, onUpload }) {
  const profile = useResource(getCurrentUser, 'StudyPilot /users/me')
  const analytics = useResource(getMyAnalytics, 'StudyPilot /analytics/me')
  const attempts = useResource(getQuizAttempts, 'StudyPilot /quizzes/attempts')

  useLayoutEffect(() => {
    const tokenMark = performance.getEntriesByName('StudyPilot token received', 'mark').at(-1)
    if (!tokenMark) return
    performance.measure('StudyPilot token to dashboard shell', { start: tokenMark.startTime, end: performance.now() })
    performance.clearMarks('StudyPilot token received')
  }, [])

  const data = analytics.data
  const entries = Array.isArray(attempts.data) ? attempts.data : attempts.data?.attempts ?? []
  const recent = [...entries].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6)

  return (
    <div className="sp-page sp-dashboard">
      <header className="sp-page-heading">
        <div><h1>Dashboard</h1><p>See your progress and get back to studying.</p></div>
        <button className="sp-button sp-primary" type="button" onClick={onUpload}>+ Upload PDF</button>
      </header>

      {profile.status === 'loading' && <p className="sp-visually-hidden" role="status">Checking your account…</p>}
      {profile.status === 'error' && <ResourceState resource={profile} failure="We couldn’t load your account details." />}

      <section className="sp-section" aria-labelledby="stats-title">
        <h2 id="stats-title">Study activity</h2>
        <ResourceState resource={analytics} loading="Loading study activity…" failure="Study activity is temporarily unavailable." variant="metrics" />
        {data && (
          <dl className="sp-metrics">
            <div><dt>Documents</dt><dd>{data.total_documents ?? '—'}</dd></div>
            <div><dt>Flashcards saved</dt><dd>{data.total_flashcards ?? '—'}</dd></div>
            <div><dt>Quizzes taken</dt><dd>{data.total_quiz_attempts ?? '—'}</dd></div>
            <div><dt>Average score</dt><dd>{data.total_quiz_attempts > 0 ? formatScore(data.average_score) : '—'}</dd></div>
          </dl>
        )}
      </section>

      <section className="sp-section sp-quiz-progress" aria-labelledby="quiz-progress-title">
        <div className="sp-section-heading">
          <div><h2 id="quiz-progress-title">Quiz progress</h2><p>Scores from your most recent attempts.</p></div>
          <button className="sp-text-button" type="button" onClick={() => onNavigate('practice')}>Practice history <span aria-hidden="true">↗</span></button>
        </div>
        <ResourceState resource={attempts} loading="Loading quiz progress…" failure="Quiz progress is temporarily unavailable." />
        {attempts.status === 'success' && (recent.length > 0 ? (
          <ul className="sp-score-list">
            {recent.map((attempt) => (
              <li key={attempt.id}>
                <span>{attempt.created_at && Number.isFinite(Date.parse(attempt.created_at)) ? dateFormat.format(new Date(attempt.created_at)) : 'Recent'}</span>
                <span className="sp-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.max(0, Number(attempt.score_percentage) || 0))}%` }} /></span>
                <strong>{formatScore(attempt.score_percentage)}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <div className="sp-empty">
            <h3>No quiz attempts yet</h3>
            <p>Open a PDF in your library to take your first quiz.</p>
            <button className="sp-button sp-secondary" type="button" onClick={() => onNavigate('library')}>Open library</button>
          </div>
        ))}
      </section>

      <section className="sp-study-link">
        <div><h2>My library</h2><p>Open a PDF to review notes, practice, or make a study plan.</p></div>
        <button className="sp-button sp-secondary" type="button" onClick={() => onNavigate('library')}>Browse library <span aria-hidden="true">→</span></button>
      </section>
    </div>
  )
}

export default DashboardPage

import { useEffect, useState } from 'react'
import Logo from '../components/Logo'
import { getQuizAttempts } from '../api/quizzes'

const practiceNavItems = [
  { label: 'Overview', page: 'dashboard' },
  { label: 'My Library', page: 'library' },
  { label: 'Practice', page: 'practice' },
  { label: 'AI Tutor', page: 'ai-tutor' },
  { label: 'Study Plan', page: 'study-plan' },
]

function formatDate(dateText) {
  if (!dateText) {
    return 'No date'
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateText))
}

function getScoreNumber(score) {
  return Number(score ?? 0)
}

function getScoreLabel(score) {
  if (score >= 80) {
    return 'Strong'
  }

  if (score >= 50) {
    return 'Practice'
  }

  return 'Review'
}

function getScoreClass(score) {
  if (score >= 80) {
    return 'is-strong'
  }

  if (score >= 50) {
    return 'is-practice'
  }

  return 'is-review'
}

function PracticePage({ onNavigate, onOpenDocument, onToggleTheme, theme }) {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function loadQuizAttempts() {
      try {
        const data = await getQuizAttempts()
        const attemptsList = Array.isArray(data) ? data : data.attempts ?? []

        setAttempts(attemptsList)
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }

    loadQuizAttempts()
  }, [])

  const sortedAttempts = [...attempts].sort((firstAttempt, secondAttempt) => {
    return new Date(secondAttempt.created_at) - new Date(firstAttempt.created_at)
  })
  const latestAttempt = sortedAttempts[0]
  const bestAttempt = sortedAttempts.reduce((best, attempt) => {
    if (!best || getScoreNumber(attempt.score_percentage) > getScoreNumber(best.score_percentage)) {
      return attempt
    }

    return best
  }, null)
  const averageScore = attempts.length
    ? Math.round(
        attempts.reduce((total, attempt) => total + getScoreNumber(attempt.score_percentage), 0) / attempts.length,
      )
    : 0
  const totalCorrect = attempts.reduce((total, attempt) => total + Number(attempt.correct_answers ?? 0), 0)
  const totalQuestions = attempts.reduce((total, attempt) => total + Number(attempt.total_questions ?? 0), 0)
  const accuracyScore = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const reviewAttempts = sortedAttempts.filter((attempt) => getScoreNumber(attempt.score_percentage) < 80)
  const strongAttempts = sortedAttempts.filter((attempt) => getScoreNumber(attempt.score_percentage) >= 80)
  const practiceTarget = reviewAttempts[0] ?? latestAttempt
  const visibleAttempts = sortedAttempts.filter((attempt) => {
    const score = getScoreNumber(attempt.score_percentage)

    if (filter === 'review') {
      return score < 80
    }

    if (filter === 'strong') {
      return score >= 80
    }

    return true
  })
  const filterOptions = [
    { key: 'all', label: 'All attempts', count: attempts.length },
    { key: 'review', label: 'Needs review', count: reviewAttempts.length },
    { key: 'strong', label: 'Strong scores', count: strongAttempts.length },
  ]

  function openWorkspace(documentId) {
    if (documentId && onOpenDocument) {
      onOpenDocument(documentId)
      return
    }

    onNavigate('library')
  }

  return (
    <div className="practice-screen">
      <header className="dashboard-appbar">
        <button className="dashboard-brand" type="button" onClick={() => onNavigate('dashboard')}>
          <Logo />
        </button>

        <nav className="dashboard-nav" aria-label="Practice navigation">
          {practiceNavItems.map((item) => (
            <button
              className={item.page === 'practice' ? 'active' : ''}
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
            Choose PDF
          </button>
        </div>
      </header>

      <main className="practice-page">
        <section className="practice-hero">
          <div>
            <p className="dashboard-kicker">Practice</p>
            <h1>Practice center</h1>
            <p>
              Track quiz attempts, find weak scores, and jump back into the right PDF workspace for focused review.
            </p>
          </div>

          <article className="practice-focus-card">
            <span>Practice target</span>
            <strong>{practiceTarget ? `Doc #${practiceTarget.document_id}` : 'Ready'}</strong>
            <p>
              {practiceTarget
                ? `${getScoreLabel(getScoreNumber(practiceTarget.score_percentage))} score: ${getScoreNumber(practiceTarget.score_percentage)}%`
                : 'Take your first quiz from a PDF workspace.'}
            </p>
            <button type="button" onClick={() => openWorkspace(practiceTarget?.document_id)}>
              {practiceTarget ? 'Review now' : 'Choose PDF'}
            </button>
          </article>
        </section>

        {loading && <p className="practice-message">Loading quiz attempts...</p>}
        {error && <p className="practice-message practice-error">{error}</p>}

        {!loading && !error && attempts.length === 0 && (
          <section className="practice-empty-state">
            <p className="dashboard-kicker">No attempts yet</p>
            <h2>Start from a document workspace.</h2>
            <p>
              Upload a PDF, generate a quiz, submit your answers, and your attempt history will appear here.
            </p>
            <button type="button" onClick={() => onNavigate('library')}>
              Open library
            </button>
          </section>
        )}

        {attempts.length > 0 && (
          <>
            <section className="practice-summary-grid">
              <article>
                <span>Total attempts</span>
                <h2>{attempts.length}</h2>
                <p>Submitted quizzes</p>
              </article>

              <article>
                <span>Best score</span>
                <h2>{getScoreNumber(bestAttempt?.score_percentage)}%</h2>
                <p>Your highest result</p>
              </article>

              <article>
                <span>Average score</span>
                <h2>{averageScore}%</h2>
                <p>Across all attempts</p>
              </article>

              <article>
                <span>Answer accuracy</span>
                <h2>{accuracyScore}%</h2>
                <p>{totalCorrect}/{totalQuestions} answers correct</p>
              </article>
            </section>

            <section className="practice-review-strip">
              <article>
                <span>Latest attempt</span>
                <strong>{latestAttempt ? `${getScoreNumber(latestAttempt.score_percentage)}%` : '--'}</strong>
                <p>{latestAttempt ? `Document #${latestAttempt.document_id}` : 'No quiz yet'}</p>
              </article>

              <article>
                <span>Review queue</span>
                <strong>{reviewAttempts.length}</strong>
                <p>Attempts below 80%</p>
              </article>

              <article>
                <span>Next action</span>
                <strong>{reviewAttempts.length ? 'Review' : 'Challenge'}</strong>
                <p>{reviewAttempts.length ? 'Fix weak topics first' : 'Try another PDF quiz'}</p>
              </article>
            </section>

            <section className="practice-attempt-list">
              <header className="practice-list-header">
                <div>
                  <p className="dashboard-kicker">Attempts</p>
                  <h2>Recent practice</h2>
                </div>

                <div className="practice-filter-group" aria-label="Filter quiz attempts">
                  {filterOptions.map((option) => (
                    <button
                      className={filter === option.key ? 'active' : ''}
                      key={option.key}
                      type="button"
                      onClick={() => setFilter(option.key)}
                    >
                      {option.label}
                      <span>{option.count}</span>
                    </button>
                  ))}
                </div>
              </header>

              {visibleAttempts.length === 0 && (
                <p className="practice-message">No attempts match this filter yet.</p>
              )}

              {visibleAttempts.map((attempt) => {
                const score = getScoreNumber(attempt.score_percentage)

                return (
                  <article className={`practice-attempt-card ${getScoreClass(score)}`} key={attempt.id}>
                    <div className="practice-score-ring">
                      <strong>{score}%</strong>
                      <span>{getScoreLabel(score)}</span>
                    </div>

                    <div className="practice-attempt-details">
                      <h3>Document #{attempt.document_id}</h3>
                      <p>
                        {attempt.correct_answers} correct out of {attempt.total_questions} questions
                      </p>
                      <div className="practice-progress-bar" aria-label={`Score ${score}%`}>
                        <span style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }} />
                      </div>
                      <small>{formatDate(attempt.created_at)}</small>
                    </div>

                    <div className="practice-attempt-actions">
                      <button type="button" onClick={() => openWorkspace(attempt.document_id)}>
                        Review
                      </button>
                    </div>
                  </article>
                )
              })}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default PracticePage

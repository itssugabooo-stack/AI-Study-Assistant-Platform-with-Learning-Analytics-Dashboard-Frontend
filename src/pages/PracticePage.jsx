import { useState } from 'react'
import { getQuizAttempts } from '../api/quizzes'
import { getDocuments } from '../api/documents'
import ResourceState from '../components/ResourceState'
import useResource from '../useResource'

const filters = [['all', 'All attempts'], ['review', 'Needs review'], ['strong', 'Strong scores']]
const scoreFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const reviewThreshold = 80

function PracticePage({ onNavigate, onOpenDocument }) {
  const resource = useResource(getQuizAttempts)
  const documents = useResource(getDocuments)
  const [filter, setFilter] = useState('all')
  const entries = Array.isArray(resource.data) ? resource.data : resource.data?.attempts ?? []
  const materials = Array.isArray(documents.data) ? documents.data : documents.data?.documents ?? []
  const files = new Map(materials.map((doc) => [String(doc.id), doc.original_filename]))
  const attempts = [...entries].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  const visible = attempts.filter((item) => filter === 'all' || (Number(item.score_percentage) < reviewThreshold) === (filter === 'review'))

  return (
    <div className="sp-page">
      <header className="sp-page-heading">
        <div><h1>Practice history</h1><p>Review scores and return to the material behind each attempt.</p></div>
        <button className="sp-button sp-secondary" type="button" onClick={() => onNavigate('library')}>Find a PDF <span aria-hidden="true">→</span></button>
      </header>

      <section className="sp-section" aria-labelledby="practice-attempts">
        <div className="sp-section-heading">
          <div><h2 id="practice-attempts">Quiz attempts</h2>{resource.status === 'success' && <p>{attempts.length} {attempts.length === 1 ? 'recorded attempt' : 'recorded attempts'}</p>}</div>
          {attempts.length > 0 && (
            <label className="sp-field"><span className="sp-visually-hidden">Filter attempts</span>
              <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                {filters.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
              </select>
            </label>
          )}
        </div>
        <ResourceState resource={resource} loading="Loading practice history…" failure="We couldn’t load your quiz attempts." />
        {resource.status === 'success' && visible.length === 0 && (
          <div className="sp-empty">
            <h3>{attempts.length ? 'No attempts match this filter' : 'No quiz attempts yet'}</h3>
            <p>{attempts.length ? 'Select another filter to see more attempts.' : 'Take a quiz from a PDF workspace to see your score here.'}</p>
          </div>
        )}
        <ul className="sp-attempt-list">
          {visible.map((attempt) => (
            <li key={attempt.id}>
              <div className="sp-document-info">
                <h3>{files.get(String(attempt.document_id)) ?? (attempt.document_id == null ? 'Quiz' : `Document #${attempt.document_id}`)}</h3>
                {attempt.created_at && Number.isFinite(Date.parse(attempt.created_at)) && <time dateTime={attempt.created_at}>{dateFormat.format(new Date(attempt.created_at))}</time>}
              </div>
              <div className="sp-attempt-score">
                <strong>{Number.isFinite(Number(attempt.score_percentage)) && attempt.score_percentage != null ? `${scoreFormat.format(attempt.score_percentage)}%` : '—'}</strong>
                <span>{attempt.correct_answers} of {attempt.total_questions} correct</span>
              </div>
              {attempt.document_id != null && <button className="sp-button sp-secondary" type="button" onClick={() => onOpenDocument(attempt.document_id)}>Review PDF</button>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default PracticePage

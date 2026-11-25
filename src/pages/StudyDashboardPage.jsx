import { useCallback, useLayoutEffect, useState } from 'react'
import { getStudyAnalytics } from '../api/study'
import ResourceState from '../components/ResourceState'
import RouteLink from '../components/RouteLink'
import { StudyDailyAttempts, StudyScoreChart, StudySectionProgress } from '../components/StudyCharts'
import { studyPath, workspacePaths } from '../routes'
import useResource from '../useResource'

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone })
const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })
const loadAll = (options) => getStudyAnalytics({ ...options, timezone: timeZone })

function ResumeStudy({ action, hasDocuments, onUpload }) {
  return (
    <section className="sp-study-resume" aria-labelledby="resume-study-title">
      <div>
        <h2 id="resume-study-title">Resume Study</h2>
        {action ? <>
          <p className="sp-study-resume-context"><strong>{action.document_title}</strong><span>{action.section_title}</span></p>
          {action.kind === 'review' && <p className="sp-guided-state" data-state="needs_review">Needs review</p>}
        </> : <p>{hasDocuments ? 'No sections queued for study.' : 'No guided study sessions yet.'}</p>}
      </div>
      <div className="sp-actions">
        {action ? <RouteLink to={studyPath(action.document_id, action.section_id, action.part_id)} className="sp-button sp-primary">
          {action.kind === 'review' ? 'Review section' : action.kind === 'start' ? 'Start study' : 'Resume Study'} <span aria-hidden="true">&rarr;</span>
        </RouteLink> : <>
          {!hasDocuments && <button type="button" className="sp-button sp-primary" onClick={onUpload}>+ Upload PDF</button>}
          <RouteLink to={workspacePaths.library} className={`sp-button ${hasDocuments ? 'sp-primary' : 'sp-secondary'}`}>Open library</RouteLink>
        </>}
      </div>
    </section>
  )
}

function RecentAttempts({ attempts }) {
  return (
    <section className="sp-guided-band" aria-labelledby="study-recent-title">
      <div className="sp-section-heading">
        <div><h2 id="study-recent-title">Recent attempts</h2></div>
        <RouteLink to={workspacePaths.practice} className="sp-text-button">Legacy quiz history <span aria-hidden="true">&#8599;</span></RouteLink>
      </div>
      {attempts.length ? (
        <ul className="sp-study-recent">
          {attempts.map((attempt) => (
            <li key={attempt.id}>
              <div><h3>{attempt.section_title}</h3><p>{attempt.document_title} / Part {attempt.part_number}</p></div>
              <div><span>{attempt.kind === 'retry' ? 'Retry' : 'First attempt'}</span><time dateTime={attempt.created_at}>{dateFormat.format(new Date(attempt.created_at))}</time></div>
              <div className="sp-study-recent-score"><strong>{numberFormat.format(attempt.score_percentage)}%</strong><span>{attempt.correct_answers}/{attempt.total_questions} correct</span></div>
            </li>
          ))}
        </ul>
      ) : <p className="sp-muted">No submitted attempts yet.</p>}
    </section>
  )
}

function StudyMetrics({ data, documentId }) {
  return (
    <>
      <StudyScoreChart scores={data.scores} timeZone={timeZone} />
      <div className="sp-study-overview">
        <StudySectionProgress documents={data.documents} documentId={documentId} />
        <StudyDailyAttempts attempts={data.daily_attempts} timeZone={timeZone} />
      </div>
      <RecentAttempts attempts={data.recent_attempts} />
    </>
  )
}

function FilteredMetrics({ documentId }) {
  const load = useCallback((options) => getStudyAnalytics({ ...options, documentId, timezone: timeZone }), [documentId])
  const resource = useResource(load)
  return (
    <>
      <ResourceState resource={resource} loading="Loading document progress..." failure="Could not load progress for this document." />
      {resource.data && <StudyMetrics data={resource.data} documentId={documentId} />}
    </>
  )
}

export default function StudyDashboardPage({ onUpload }) {
  const resource = useResource(loadAll, 'StudyPilot /analytics/study')
  const [documentId, setDocumentId] = useState('')
  const data = resource.data

  useLayoutEffect(() => {
    const tokenMark = performance.getEntriesByName('StudyPilot token received', 'mark').at(-1)
    if (!tokenMark) return
    performance.measure('StudyPilot token to dashboard shell', { start: tokenMark.startTime, end: performance.now() })
    performance.clearMarks('StudyPilot token received')
  }, [])

  return (
    <div className="sp-page sp-dashboard sp-study-dashboard">
      <header className="sp-page-heading">
        <div><p className="sp-guided-kicker">Study progress</p><h1>Dashboard</h1></div>
        {(!data || data.documents.length > 0) && <button className="sp-button sp-secondary" type="button" onClick={onUpload}>+ Upload PDF</button>}
      </header>
      <ResourceState resource={resource} loading="Loading study progress..." failure="Study progress is temporarily unavailable." />
      {data && (
        <>
          <ResumeStudy action={data.next_action} hasDocuments={data.documents.length > 0} onUpload={onUpload} />
          {data.documents.length > 0 && (
            <div className="sp-study-filter">
              <label className="sp-field">Document
                <select value={documentId} onChange={(event) => setDocumentId(event.target.value)}>
                  <option value="">All documents</option>
                  {data.documents.map(({ id, title }) => <option value={id} key={id}>{title}</option>)}
                </select>
              </label>
            </div>
          )}
          {documentId ? <FilteredMetrics key={documentId} documentId={documentId} /> : <StudyMetrics data={data} />}
        </>
      )}
    </div>
  )
}

import { useState } from 'react'
import RouteLink from './RouteLink'
import { studyPath } from '../routes'
import { scorePoints, sectionProgress, sevenDays } from '../studyCharts'

const formatPercent = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })
const axisLevels = [100, 75, 50, 25, 0]
const shortDate = (value, timeZone) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone }).format(new Date(value))
const dayDate = (value) => new Date(`${value}T00:00:00Z`)
const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' })

const scoreText = (value) => `${formatPercent.format(value)}%`

export function StudyScoreChart({ scores, timeZone }) {
  const points = scorePoints(scores)
  const [selection, setSelection] = useState(null)
  const active = Math.min(selection ?? points.length - 1, points.length - 1)
  const point = points[active]
  const valueText = point && `Attempt ${active + 1} of ${points.length}, ${scoreText(point.score_percentage)}, ${point.correct_answers} of ${point.total_questions} correct, ${shortDate(point.created_at, timeZone)}, ${point.document_title}, ${point.section_title}, part ${point.part_number}`
  const coordinateList = points.map(({ x, y }) => `${x},${y}`).join(' ')

  return (
    <section className="sp-guided-band sp-study-score" aria-labelledby="study-score-title">
      <div className="sp-section-heading">
        <div><h2 id="study-score-title">Score trend</h2><p>First attempts, oldest to newest</p></div>
        {points.length > 0 && <div className="sp-study-latest"><strong>{scoreText(points.at(-1).score_percentage)}</strong><span>Latest first attempt</span></div>}
      </div>
      {!point ? <p className="sp-muted">Your first submitted practice quiz will appear here.</p> : (
        <figure className="sp-study-score-figure">
          <div className="sp-study-score-axes" aria-hidden="true">
            <div className="sp-study-score-labels">{axisLevels.map((level) => <span key={level}>{level}%</span>)}</div>
            <div className="sp-study-score-plot">
              {axisLevels.map((level) => <span className="sp-study-gridline" key={level} style={{ top: `${100 - level}%` }} />)}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                {points.length > 1 && <>
                  <polygon className="sp-study-score-fill" points={`0,100 ${coordinateList} 100,100`} />
                  <polyline className="sp-study-score-line" points={coordinateList} vectorEffect="non-scaling-stroke" />
                </>}
              </svg>
              <span className="sp-study-marker-line" style={{ left: `${point.x}%` }} />
              {points.map((item, index) => <span className="sp-study-point" key={item.id} data-active={index === active}
                style={{ left: `${item.x}%`, top: `${item.y}%` }} />)}
            </div>
            <div className="sp-study-score-dates">
              <span>{shortDate(points[0].created_at, timeZone)}</span>
              {points.length > 1 && <span>{shortDate(points.at(-1).created_at, timeZone)}</span>}
            </div>
          </div>
          {points.length > 1 && (
            <input className="sp-study-scrubber" type="range" min={0} max={points.length - 1} step={1} value={active}
              aria-label="Inspect score by attempt" aria-valuetext={valueText} onChange={(event) => setSelection(Number(event.target.value))} />
          )}
          <figcaption className="sp-study-chart-readout">
            <div><strong>{scoreText(point.score_percentage)}</strong> <span>{point.correct_answers} of {point.total_questions} correct</span></div>
            <p>{shortDate(point.created_at, timeZone)} / {point.document_title} / {point.section_title} / Part {point.part_number}</p>
          </figcaption>
        </figure>
      )}
    </section>
  )
}

export function StudySectionProgress({ documents, documentId }) {
  const rows = sectionProgress(documents, documentId)
  return (
    <section className="sp-guided-band" aria-labelledby="section-progress-title">
      <div className="sp-section-heading"><div><h2 id="section-progress-title">Section progress</h2></div></div>
      {rows.length === 0 ? <p className="sp-muted">No prepared outlines yet.</p> : (
        <ul className="sp-study-progress-list">
          {rows.map(({ id, title, total, segments }) => (
            <li key={id}>
              <div className="sp-study-progress-title">
                <RouteLink to={studyPath(id)}>{title}</RouteLink>
                <span>{total} {total === 1 ? 'section' : 'sections'}</span>
              </div>
              <div className="sp-study-segments" aria-hidden="true">
                {segments.filter(({ count }) => count > 0).map(({ state, percentage }) => (
                  <span data-state={state} key={state} style={{ flexBasis: `${percentage}%` }} />
                ))}
              </div>
              <dl className="sp-study-progress-values">
                {segments.map(({ state, label, count }) => (
                  <div key={state} data-state={state}>
                    <dt><i aria-hidden="true" />{label}</dt><dd>{count}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function StudyDailyAttempts({ attempts, timeZone }) {
  const days = sevenDays(attempts, timeZone)
  const [selectedDate, setSelectedDate] = useState(null)
  const selected = days.find(({ date }) => date === selectedDate) ?? days.at(-1)
  const max = Math.max(1, ...days.map(({ initial, retry }) => initial + retry))
  const fullDate = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })
  return (
    <section className="sp-guided-band" aria-labelledby="daily-attempts-title">
      <div className="sp-section-heading"><div><h2 id="daily-attempts-title">Daily attempts</h2><p>Last 7 days</p></div></div>
      <figure className="sp-study-daily">
        <div className="sp-study-days" role="group" aria-label="Attempts by day">
          {days.map(({ date, initial, retry }) => (
            <button key={date} type="button" aria-pressed={selected.date === date}
              aria-label={`${fullDate.format(dayDate(date))}: ${initial} first attempts, ${retry} retries`}
              onClick={() => setSelectedDate(date)}>
              <span className="sp-study-day-track" aria-hidden="true">
                <span className="sp-study-day-stack" style={{ height: `${100 * (initial + retry) / max}%` }}>
                  <span className="sp-study-initial" style={{ flexGrow: initial }} />
                  <span className="sp-study-retry" style={{ flexGrow: retry }} />
                </span>
              </span>
              <span aria-hidden="true">{weekday.format(dayDate(date)).slice(0, 2)}</span>
            </button>
          ))}
        </div>
        <figcaption className="sp-study-chart-readout" aria-live="polite">
          <strong>{fullDate.format(dayDate(selected.date))}</strong>
          <div className="sp-study-daily-key">
            <span><i className="sp-study-initial" aria-hidden="true" />{selected.initial} first {selected.initial === 1 ? 'attempt' : 'attempts'}</span>
            <span><i className="sp-study-retry" aria-hidden="true" />{selected.retry} {selected.retry === 1 ? 'retry' : 'retries'}</span>
          </div>
        </figcaption>
      </figure>
    </section>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { getDocument } from '../api/documents'
import { getStudyOutline, prepareStudyOutline, prepareStudySection } from '../api/study'
import ResourceState from '../components/ResourceState'
import RouteLink from '../components/RouteLink'
import StudyOutlineEditor from '../components/StudyOutlineEditor'
import StudyPart from '../components/StudyPart'
import { StudyPdfStatus } from '../components/StudyPdfLinks'
import { pageRange, sectionStates } from '../guidedStudyData'
import { documentPath, studyPath, workspacePaths } from '../routes'
import useResource from '../useResource'
import useStudyPdf from '../useStudyPdf'

const quickReference = [
  ['summary', 'Summary'], ['flashcards', 'Flashcards'], ['quiz', 'Quiz'], ['roadmap', 'Roadmap'],
]

function PrepareSection({ sectionId, onPrepared }) {
  const load = useCallback(async (options) => {
    // Let Strict Mode retire its first effect before starting a write.
    await Promise.resolve()
    options.signal.throwIfAborted()
    const section = await prepareStudySection(sectionId, options)
    options.signal.throwIfAborted()
    if (section.parts.length) onPrepared(section)
    return section
  }, [sectionId, onPrepared])
  const resource = useResource(load, undefined, 60_000)
  return (
    <>
      <ResourceState resource={resource} loading="Preparing section parts..." failure={resource.error?.message || 'Could not prepare this section.'} />
      {resource.status === 'success' && <p className="sp-muted">No study parts are available in this range.</p>}
    </>
  )
}

function SectionWorkspace({ documentId, section, partId, onPrepared, onProgress }) {
  const heading = useRef(null)
  const requestedPart = section.parts.find(({ id }) => String(id) === partId)
  const part = requestedPart ?? section.parts[0]
  const index = section.parts.indexOf(part)
  const previous = section.parts[index - 1]
  const next = section.parts[index + 1]
  useEffect(() => { heading.current?.focus() }, [partId])

  return (
    <section className="sp-guided-workspace" aria-labelledby="study-section-title">
      <header className="sp-guided-part-header">
        <p className="sp-guided-kicker">{pageRange(section.start_page, section.end_page)}{section.locked && ' / Range locked'}</p>
        <h2 id="study-section-title" tabIndex={-1} ref={heading}>{section.title}</h2>
      </header>
      {part ? (
        <>
          <nav className="sp-guided-parts" aria-label="Section parts">
            {section.parts.map((item) => (
              <RouteLink key={item.id} to={studyPath(documentId, section.id, item.id)}
                aria-current={part.id === item.id ? 'page' : undefined}
                aria-label={`Part ${item.number}, ${pageRange(item.start_page, item.end_page)}, ${sectionStates[item.state]}`}>
                Part {item.number}<span>{pageRange(item.start_page, item.end_page)}</span>
              </RouteLink>
            ))}
          </nav>
          {partId && !requestedPart && <p className="sp-muted" role="status">That part is no longer in this section. Showing the first part.</p>}
          <StudyPart key={part.id} partId={part.id} documentId={documentId} onProgress={onProgress} />
          {(previous || next) && <nav className="sp-guided-part-navigation" aria-label="Previous and next part">
            {previous && <RouteLink className="sp-button sp-secondary" to={studyPath(documentId, section.id, previous.id)}><span aria-hidden="true">&larr;</span> Previous part</RouteLink>}
            {next && <RouteLink className="sp-button sp-secondary" to={studyPath(documentId, section.id, next.id)}>Next part <span aria-hidden="true">&rarr;</span></RouteLink>}
          </nav>}
        </>
      ) : <PrepareSection key={section.id} sectionId={section.id} onPrepared={onPrepared} />}
    </section>
  )
}

function OutlineUnavailable({ outline, onUpload, onRetry }) {
  const noText = outline.status === 'no_text'
  const unsupported = outline.status === 'unsupported'
  return (
    <section className="sp-guided-band">
      <h2>{noText ? 'No selectable text' : unsupported ? 'PDF not supported for guided study' : 'Outline not ready'}</h2>
      <p className="sp-muted">{outline.reason || (noText
        ? 'Upload a PDF with selectable text to study by section.'
        : unsupported ? 'Choose another PDF or open a quick reference tool.' : 'The outline could not be prepared yet.')}</p>
      <div className="sp-actions">
        <button type="button" className="sp-button sp-primary" onClick={onUpload}>Upload PDF</button>
        {!noText && !unsupported && <button type="button" className="sp-button sp-secondary" onClick={onRetry}>Try again</button>}
      </div>
    </section>
  )
}

export default function GuidedStudyPage({ documentId, sectionId, partId, onUpload }) {
  const loadDocument = useCallback((options) => getDocument(documentId, options), [documentId])
  const document = useResource(loadDocument)
  const loadOutline = useCallback(async (options) => {
    const saved = await getStudyOutline(documentId, options)
    options.signal.throwIfAborted()
    return saved.status === 'not_prepared' ? prepareStudyOutline(documentId, options) : saved
  }, [documentId])
  const resource = useResource(loadOutline, undefined, 60_000)
  const [updatedOutline, setUpdatedOutline] = useState(null)
  const [editing, setEditing] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)
  const refresh = useRef(null)
  const pdf = useStudyPdf(documentId)
  const outline = updatedOutline ?? resource.data
  const selected = outline?.sections.find(({ id }) => String(id) === sectionId)

  useEffect(() => () => refresh.current?.abort(), [])

  const rememberSection = useCallback((section) => {
    setUpdatedOutline((previous) => {
      const current = previous ?? resource.data
      return { ...current, sections: current.sections.map((item) => item.id === section.id ? section : item) }
    })
  }, [resource.data])

  async function refreshOutline(part, locked) {
    if (part) {
      setUpdatedOutline((previous) => {
        const current = previous ?? resource.data
        return { ...current, sections: current.sections.map((item) => item.id !== part.section_id ? item : {
          ...item, locked: locked || item.locked,
          parts: item.parts.map((summary) => summary.id === part.id ? { ...summary, state: part.state } : summary),
        }) }
      })
    }
    refresh.current?.abort()
    const controller = new AbortController()
    refresh.current = controller
    setRefreshFailed(false)
    try {
      const latest = await getStudyOutline(documentId, { signal: controller.signal })
      if (!controller.signal.aborted) setUpdatedOutline(latest)
    } catch {
      if (!controller.signal.aborted) setRefreshFailed(true)
    }
  }

  function reloadOutline() {
    refresh.current?.abort()
    setRefreshFailed(false)
    setEditing(false)
    setUpdatedOutline(null)
    resource.retry()
  }

  return (
    <div className="sp-page sp-guided">
      <RouteLink className="sp-text-button sp-back-link" to={workspacePaths.library}>&larr; Back to library</RouteLink>
      <header className="sp-page-heading sp-guided-heading">
        <div>
          <p className="sp-guided-kicker">Guided study</p>
          <h1>{document.data?.original_filename ?? 'Document workspace'}</h1>
          {!!outline?.page_count && <p>{outline.page_count} {outline.page_count === 1 ? 'page' : 'pages'}</p>}
        </div>
        {document.data && <button className="sp-button sp-secondary" type="button" title="Opens in a new tab" disabled={pdf.loading} onClick={() => pdf.open()}>Open PDF <span aria-hidden="true">&#8599;</span></button>}
      </header>
      <StudyPdfStatus status={pdf.status} />
      {document.status === 'error' && <ResourceState resource={document} failure="Could not load the document details." />}
      <nav className="sp-guided-reference" aria-label="Quick reference">
        <span>Quick reference</span>
        {quickReference.map(([tool, label]) => <RouteLink key={tool} to={documentPath(documentId, tool)}>{label}</RouteLink>)}
      </nav>
      <ResourceState resource={resource} loading="Loading study outline..." failure={resource.error?.message || 'Could not load the study outline.'} />
      {outline && outline.status !== 'ready' && <OutlineUnavailable outline={outline} onUpload={onUpload} onRetry={reloadOutline} />}
      {outline?.status === 'ready' && (
        <>
          {outline.unreadable_pages.length > 0 && <p className="sp-guided-notice" role="status">
            {outline.unreadable_pages.length === 1 ? 'Page' : 'Pages'} {outline.unreadable_pages.join(', ')} could not be read.
          </p>}
          {refreshFailed && <div className="sp-guided-notice" role="status">
            Section progress could not refresh. <button className="sp-text-button" type="button" onClick={() => refreshOutline()}>Refresh progress</button>
          </div>}
          {editing ? <StudyOutlineEditor documentId={documentId} outline={outline}
            onSave={(next) => { setUpdatedOutline(next); setEditing(false) }} onCancel={() => setEditing(false)} onReload={reloadOutline} /> : (
            <div className="sp-guided-layout">
              <nav className="sp-guided-outline" aria-labelledby="study-outline-title">
                <div className="sp-guided-outline-header">
                  <h2 id="study-outline-title">Outline</h2>
                  <button className="sp-text-button" type="button" onClick={() => { refresh.current?.abort(); setEditing(true) }}>Edit outline</button>
                </div>
                <ol>
                  {outline.sections.map((section, index) => (
                    <li key={section.id}>
                      <RouteLink to={studyPath(documentId, section.id)} aria-current={selected?.id === section.id ? 'location' : undefined}>
                        <span className="sp-guided-section-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                        <span>
                          <strong>{section.title}</strong>
                          <small>{pageRange(section.start_page, section.end_page)}{section.locked && ' / Range locked'}</small>
                          <small className="sp-guided-state" data-state={section.state}>{sectionStates[section.state]}</small>
                        </span>
                      </RouteLink>
                    </li>
                  ))}
                </ol>
              </nav>
              {selected
                ? <SectionWorkspace key={selected.id} documentId={documentId} section={selected} partId={partId} onPrepared={rememberSection} onProgress={refreshOutline} />
                : <section className="sp-guided-workspace">
                    <h2>{sectionId ? 'Section not in this outline' : 'Select a section'}</h2>
                    {sectionId && <p className="sp-muted">Choose a section from the current outline.</p>}
                    {outline.sections[0] && <RouteLink className="sp-button sp-primary" to={studyPath(documentId, outline.sections[0].id)}>Open first section <span aria-hidden="true">&rarr;</span></RouteLink>}
                  </section>}
            </div>
          )}
        </>
      )}
    </div>
  )
}

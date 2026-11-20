import { useRef, useState } from 'react'
import { getDocuments } from '../api/documents'
import { generateRoadmap } from '../api/ai'
import ResourceState from '../components/ResourceState'
import RoadmapSteps from '../components/RoadmapSteps'
import Skeleton from '../components/Skeleton'
import useResource from '../useResource'

function StudyPlanPage({ onNavigate, onOpenDocument }) {
  const resource = useResource(getDocuments)
  const [selection, setSelection] = useState('')
  const [roadmap, setRoadmap] = useState(null)
  const pending = useRef(false)
  const documents = Array.isArray(resource.data) ? resource.data : resource.data?.documents ?? []
  const selectedDocument = documents.find((doc) => String(doc.id) === selection) ?? documents.find((doc) => doc.has_extracted_text)
  const loading = roadmap?.status === 'loading'

  async function createRoadmap() {
    if (!selectedDocument || pending.current) return
    pending.current = true
    setRoadmap({ status: 'loading' })
    try {
      const result = await generateRoadmap(selectedDocument.id)
      setRoadmap({ status: 'success', steps: result.steps ?? [] })
    } catch (error) {
      setRoadmap({ status: 'error', error: error.message })
    } finally {
      pending.current = false
    }
  }

  return (
    <div className="sp-page">
      <header className="sp-page-heading">
        <div><h1>Study plan</h1><p>Build a step-by-step roadmap from one of your PDFs.</p></div>
        <button className="sp-button sp-secondary" type="button" onClick={() => onNavigate('library')}>Browse library <span aria-hidden="true">→</span></button>
      </header>
      <section className="sp-section" aria-labelledby="plan-title">
        <h2 id="plan-title">Choose a PDF</h2>
        <ResourceState resource={resource} loading="Loading available PDFs…" failure="We couldn’t load your PDFs." />
        {resource.status === 'success' && documents.length === 0 && (
          <div className="sp-empty"><h3>No PDFs yet</h3><p>Add a PDF from the library to build your first study plan.</p></div>
        )}
        {documents.length > 0 && (
          <div className="sp-plan-builder">
            <label className="sp-field">Source document
              <select value={selectedDocument?.id ?? ''} disabled={loading} onChange={(event) => { setSelection(event.target.value); setRoadmap(null) }}>
                {!selectedDocument && <option value="" disabled>Select a PDF</option>}
                {documents.map((doc) => <option key={doc.id} value={doc.id}>{doc.original_filename}{doc.has_extracted_text ? '' : ' (text unavailable)'}</option>)}
              </select>
            </label>
            {selectedDocument && !selectedDocument.has_extracted_text && <p className="sp-muted">This PDF needs extracted text before a plan can be generated.</p>}
            <div className="sp-actions">
              <button className="sp-button sp-primary" type="button" onClick={createRoadmap} disabled={!selectedDocument?.has_extracted_text || loading}>{loading ? 'Generating…' : roadmap?.status === 'error' ? 'Try again' : 'Generate study plan'}</button>
              {selectedDocument && <button className="sp-button sp-secondary" type="button" onClick={() => onOpenDocument(selectedDocument.id, 'roadmap')}>Open workspace</button>}
            </div>
          </div>
        )}
      </section>
      {roadmap && (
        <section className="sp-section" aria-labelledby="plan-result">
          <h2 id="plan-result">Study steps</h2>
          {loading && <Skeleton label="Generating your study plan…" />}
          {roadmap.status === 'error' && <p className="sp-error" role="alert">{roadmap.error}</p>}
          {roadmap.status === 'success' && (roadmap.steps.length
            ? <RoadmapSteps steps={roadmap.steps} />
            : <p className="sp-muted">This PDF returned no study steps.</p>)}
        </section>
      )}
    </div>
  )
}

export default StudyPlanPage

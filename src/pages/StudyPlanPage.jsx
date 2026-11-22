import { useCallback, useRef, useState } from 'react'
import { getDocuments } from '../api/documents'
import { generateRoadmap, getStudyMaterials } from '../api/ai'
import ResourceState from '../components/ResourceState'
import RoadmapSteps from '../components/RoadmapSteps'
import Skeleton from '../components/Skeleton'
import { generationErrorMessage, getPreparationIssue, preparationMessages } from '../documentPreparation'
import useResource from '../useResource'

const sourceSelectionKey = 'studypilot:study-plan-document'

function StudyPlanPage({ onNavigate, onOpenDocument }) {
  const resource = useResource(getDocuments)
  const [selection, setSelection] = useState(() => sessionStorage.getItem(sourceSelectionKey) ?? '')
  const [lastGeneration, setLastGeneration] = useState(null)
  const pending = useRef(false)
  const documents = Array.isArray(resource.data) ? resource.data : resource.data?.documents ?? []
  const selectedDocument = documents.find((doc) => String(doc.id) === selection)
    ?? documents.find((doc) => doc.has_extracted_text)
    ?? documents.find((doc) => doc.processing_status !== 'no_text')
  const documentId = selectedDocument?.id
  const loadRoadmap = useCallback(async (options) => {
    if (documentId == null) return null
    const materials = await getStudyMaterials(documentId, options)
    return materials.roadmap
  }, [documentId])
  const savedRoadmap = useResource(loadRoadmap)
  const generation = lastGeneration?.documentId === documentId ? lastGeneration : null
  const roadmap = generation?.data ?? savedRoadmap.data
  const loading = generation?.status === 'loading'
  const preparationIssue = generation ? generation.issue : selectedDocument?.processing_status
  const generationBlocked = preparationIssue === 'no_text' || preparationIssue === 'missing'

  function chooseSource(event) {
    const source = event.target.value
    setSelection(source)
    sessionStorage.setItem(sourceSelectionKey, source)
  }

  async function createRoadmap() {
    if (documentId == null || generationBlocked || pending.current) return
    sessionStorage.setItem(sourceSelectionKey, String(documentId))
    pending.current = true
    const previous = { documentId, data: generation?.data }
    setLastGeneration({ ...previous, status: 'loading' })
    try {
      const data = await generateRoadmap(documentId)
      setLastGeneration({ documentId, data, status: 'success' })
    } catch (error) {
      setLastGeneration({ ...previous, status: 'error', issue: getPreparationIssue(error), error: generationErrorMessage(error) })
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
              <select value={documentId ?? ''} disabled={loading} onChange={chooseSource}>
                {!selectedDocument && <option value="" disabled>Select a PDF</option>}
                {documents.map((doc) => <option key={doc.id} value={doc.id}>{doc.original_filename}{doc.processing_status === 'no_text' ? ' (no selectable text)' : ''}</option>)}
              </select>
            </label>
            {!generation && preparationMessages[preparationIssue] && <p className="sp-muted">{preparationMessages[preparationIssue]}</p>}
            <div className="sp-actions">
              <button className="sp-button sp-primary" type="button" onClick={createRoadmap} disabled={!selectedDocument || generationBlocked || loading}>
                {loading ? 'Generating…' : roadmap ? 'Regenerate study plan' : 'Generate study plan'}
              </button>
              {selectedDocument && <button className="sp-button sp-secondary" type="button" onClick={() => onOpenDocument(selectedDocument.id, 'roadmap')}>Open workspace</button>}
            </div>
          </div>
        )}
      </section>
      {selectedDocument && (roadmap || generation || savedRoadmap.status !== 'success') && (
        <section className="sp-section" aria-labelledby="plan-result">
          <h2 id="plan-result">Study steps</h2>
          {(!loading || savedRoadmap.status !== 'loading') && (
            <ResourceState resource={savedRoadmap} loading="Loading saved study plan…" failure="We could not load your saved study plan." />
          )}
          {loading && (roadmap
            ? <p className="sp-status" role="status">Generating your study plan…</p>
            : <Skeleton label="Generating your study plan…" />
          )}
          {generation?.status === 'error' && <p className="sp-error" role="alert">{generation.error}</p>}
          {roadmap && (roadmap.steps?.length
            ? <RoadmapSteps steps={roadmap.steps} />
            : <p className="sp-muted">This PDF returned no study steps.</p>)}
        </section>
      )}
    </div>
  )
}

export default StudyPlanPage

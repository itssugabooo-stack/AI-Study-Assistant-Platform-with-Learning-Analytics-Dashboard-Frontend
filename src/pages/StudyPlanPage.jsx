import { useEffect, useState } from 'react'
import Logo from '../components/Logo'
import { generateRoadmap } from '../api/ai'
import { getDocuments } from '../api/documents'

const studyPlanNavItems = [
  { label: 'Overview', page: 'dashboard' },
  { label: 'My Library', page: 'library' },
  { label: 'Practice', page: 'practice' },
  { label: 'AI Tutor', page: 'ai-tutor' },
  { label: 'Study Plan', page: 'study-plan' },
]

function StudyPlanPage({ onNavigate, onOpenDocument, onToggleTheme, theme }) {
  const [documents, setDocuments] = useState([])
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [roadmap, setRoadmap] = useState(null)
  const [loadingDocuments, setLoadingDocuments] = useState(true)
  const [documentsError, setDocumentsError] = useState('')
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapError, setRoadmapError] = useState('')

  useEffect(() => {
    async function loadDocuments() {
      try {
        const data = await getDocuments()
        setDocuments(data)

        if (data.length > 0) {
          setSelectedDocumentId(String(data[0].id))
        }
      } catch (requestError) {
        setDocumentsError(requestError.message)
      } finally {
        setLoadingDocuments(false)
      }
    }

    loadDocuments()
  }, [])

  async function handleGenerateRoadmap() {
    if (!selectedDocumentId) {
      setRoadmapError('Please choose a document first.')
      return
    }

    setRoadmapLoading(true)
    setRoadmapError('')
    setRoadmap(null)

    try {
      const data = await generateRoadmap(selectedDocumentId)
      setRoadmap(data)
    } catch (requestError) {
      setRoadmapError(requestError.message)
    } finally {
      setRoadmapLoading(false)
    }
  }

  const selectedDocument = documents.find(
    (document) => String(document.id) === String(selectedDocumentId),
  )

  return (
    <div className="study-plan-screen">
      <header className="dashboard-appbar">
        <button className="dashboard-brand" type="button" onClick={() => onNavigate('dashboard')}>
          <Logo />
        </button>

        <nav className="dashboard-nav" aria-label="Study plan navigation">
          {studyPlanNavItems.map((item) => (
            <button
              className={item.page === 'study-plan' ? 'active' : ''}
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
            Add PDF
          </button>
        </div>
      </header>

      <main className="study-plan-page">
        <section className="study-plan-hero">
          <div>
            <p className="dashboard-kicker">Study Plan</p>
            <h1>Create a roadmap from your course material.</h1>
            <p>
              Pick a PDF and StudyPilot will create a simple step-by-step plan to review the topic.
            </p>
          </div>

          <article>
            <span>Roadmap source</span>
            <strong>{documents.length}</strong>
            <p>{documents.length === 1 ? 'document available' : 'documents available'}</p>
          </article>
        </section>

        <section className="study-plan-grid">
          <article className="study-plan-builder">
            <p className="dashboard-kicker">Build plan</p>
            <h2>Choose your study material</h2>

            {loadingDocuments && <p className="study-plan-message">Loading documents...</p>}
            {documentsError && <p className="study-plan-message study-plan-error">{documentsError}</p>}

            {!loadingDocuments && !documentsError && documents.length === 0 && (
              <div className="study-plan-empty">
                <h3>No documents yet</h3>
                <p>Upload a PDF first, then generate a study roadmap from it.</p>
                <button type="button" onClick={() => onNavigate('library')}>
                  Open library
                </button>
              </div>
            )}

            {documents.length > 0 && (
              <>
                <label className="study-plan-select">
                  <span>Document</span>
                  <select
                    value={selectedDocumentId}
                    onChange={(event) => {
                      setSelectedDocumentId(event.target.value)
                      setRoadmap(null)
                      setRoadmapError('')
                    }}
                  >
                    {documents.map((document) => (
                      <option key={document.id} value={document.id}>
                        {document.original_filename}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedDocument && (
                  <div className="study-plan-selected-doc">
                    <span>{selectedDocument.has_extracted_text ? 'Text ready' : 'Text pending'}</span>
                    <h3>{selectedDocument.original_filename}</h3>
                    <p>Status: {selectedDocument.processing_status}</p>
                    <button type="button" onClick={() => onOpenDocument(selectedDocument.id)}>
                      Open workspace
                    </button>
                  </div>
                )}

                <button
                  className="study-plan-generate-button"
                  disabled={roadmapLoading}
                  type="button"
                  onClick={handleGenerateRoadmap}
                >
                  {roadmapLoading ? 'Generating plan...' : 'Generate study plan'}
                </button>

                {roadmapError && <p className="study-plan-message study-plan-error">{roadmapError}</p>}
              </>
            )}
          </article>

          <article className="study-plan-result">
            <header>
              <p className="dashboard-kicker">Roadmap</p>
              <h2>{roadmap ? 'Your study steps' : 'Plan preview'}</h2>
            </header>

            {!roadmap && (
              <div className="study-plan-preview">
                <p>
                  Generate a roadmap to see ordered steps for reviewing the selected document.
                </p>
              </div>
            )}

            {roadmap && (
              <ol className="study-plan-step-list">
                {roadmap.steps.map((step, index) => (
                  <li key={`${step.title}-${index}`}>
                    <span>{index + 1}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}

export default StudyPlanPage

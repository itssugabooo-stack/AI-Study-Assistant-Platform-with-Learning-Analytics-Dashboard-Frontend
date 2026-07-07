import { useEffect, useState } from 'react'
import Logo from '../components/Logo'
import { getDocuments } from '../api/documents'

const tutorNavItems = [
  { label: 'Overview', page: 'dashboard' },
  { label: 'My Library', page: 'library' },
  { label: 'Practice', page: 'practice' },
  { label: 'AI Tutor', page: 'ai-tutor' },
  { label: 'Study Plan', page: 'study-plan' },
]

const tutorTools = [
  {
    id: 'summary',
    title: 'Summary',
    description: 'Open a focused page to generate a shorter explanation from a PDF.',
  },
  {
    id: 'flashcards',
    title: 'Flashcards',
    description: 'Open active recall cards with questions and answers.',
  },
  {
    id: 'quiz',
    title: 'Quiz',
    description: 'Open generated quiz questions to test your understanding.',
  },
  {
    id: 'roadmap',
    title: 'Roadmap',
    description: 'Open step-by-step study guidance for a document.',
  },
]

function AITutorPage({ onNavigate, onOpenDocument, onToggleTheme, theme }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTool, setSelectedTool] = useState('summary')

  useEffect(() => {
    async function loadDocuments() {
      try {
        const data = await getDocuments()
        setDocuments(Array.isArray(data) ? data : data.documents ?? [])
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }

    loadDocuments()
  }, [])

  const selectedToolInfo = tutorTools.find((tool) => tool.id === selectedTool)
  const visibleDocuments = documents.slice(0, 3)

  return (
    <div className="ai-tutor-screen">
      <header className="dashboard-appbar">
        <button className="dashboard-brand" type="button" onClick={() => onNavigate('dashboard')}>
          <Logo />
        </button>

        <nav className="dashboard-nav" aria-label="AI tutor navigation">
          {tutorNavItems.map((item) => (
            <button
              className={item.page === 'ai-tutor' ? 'active' : ''}
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

      <main className="ai-tutor-page">
        <section className="ai-tutor-hero">
          <div>
            <p className="dashboard-kicker">AI Tutor</p>
            <h1>Choose a study tool.</h1>
            <p>
              Pick Summary, Flashcards, Quiz, or Roadmap. Then choose a PDF and StudyPilot will open the right workspace page.
            </p>
          </div>

          <article>
            <span>Selected tool</span>
            <strong>{selectedToolInfo?.title}</strong>
            <p>{documents.length} PDFs available</p>
          </article>
        </section>

        <section className="ai-tutor-tools-grid" aria-label="AI tutor tools">
          {tutorTools.map((tool) => (
            <button
              className={selectedTool === tool.id ? 'ai-tutor-tool-card active' : 'ai-tutor-tool-card'}
              key={tool.id}
              type="button"
              onClick={() => setSelectedTool(tool.id)}
            >
              <span>{tool.title}</span>
              <p>{tool.description}</p>
            </button>
          ))}
        </section>

        <section className="ai-tutor-document-panel">
          <header>
            <div>
              <p className="dashboard-kicker">Open tool page</p>
              <h2>Choose a PDF for {selectedToolInfo?.title}</h2>
            </div>
            <button type="button" onClick={() => onNavigate('library')}>
              Upload new PDF
            </button>
          </header>

          {loading && <p className="ai-tutor-message">Loading documents...</p>}
          {error && <p className="ai-tutor-message ai-tutor-error">{error}</p>}

          {!loading && !error && documents.length === 0 && (
            <div className="ai-tutor-empty">
              <h3>No documents yet</h3>
              <p>Upload a PDF first, then come back here to start using AI tutor tools.</p>
              <button type="button" onClick={() => onNavigate('library')}>
                Open library
              </button>
            </div>
          )}

          {visibleDocuments.length > 0 && (
            <>
              <p className="ai-tutor-result-note">
                Showing {visibleDocuments.length} of {documents.length} PDFs
              </p>
              <div className="ai-tutor-document-list">
                {visibleDocuments.map((document) => (
                  <article key={document.id}>
                    <div>
                      <span>{document.has_extracted_text ? 'Ready' : 'Processing'}</span>
                      <h3>{document.original_filename}</h3>
                      <p>Status: {document.processing_status}</p>
                    </div>

                    <button type="button" onClick={() => onOpenDocument(document.id, selectedTool)}>
                      Open {selectedToolInfo?.title}
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default AITutorPage

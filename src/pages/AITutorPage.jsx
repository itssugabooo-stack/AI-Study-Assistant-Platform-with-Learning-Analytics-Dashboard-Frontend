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
    title: 'Summarize',
    description: 'Turn long PDF content into a shorter study explanation.',
  },
  {
    title: 'Flashcards',
    description: 'Generate question and answer cards from your material.',
  },
  {
    title: 'Quiz',
    description: 'Practice with generated questions and check your score.',
  },
  {
    title: 'Roadmap',
    description: 'Break the document into study steps you can follow.',
  },
]

function AITutorPage({ onNavigate, onOpenDocument, onToggleTheme, theme }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDocuments() {
      try {
        const data = await getDocuments()
        setDocuments(data)
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }

    loadDocuments()
  }, [])

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
            <h1>Choose a document and let StudyPilot guide your review.</h1>
            <p>
              Your AI tools are connected to each PDF. Open a document workspace to generate summaries,
              flashcards, quizzes, and roadmaps from that material.
            </p>
          </div>

          <article>
            <span>Available tools</span>
            <strong>4</strong>
            <p>Summary, flashcards, quiz, roadmap</p>
          </article>
        </section>

        <section className="ai-tutor-tools-grid">
          {tutorTools.map((tool) => (
            <article key={tool.title}>
              <h2>{tool.title}</h2>
              <p>{tool.description}</p>
            </article>
          ))}
        </section>

        <section className="ai-tutor-document-panel">
          <header>
            <div>
              <p className="dashboard-kicker">Start tutoring</p>
              <h2>Select a PDF</h2>
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

          {documents.length > 0 && (
            <div className="ai-tutor-document-list">
              {documents.map((document) => (
                <article key={document.id}>
                  <div>
                    <span>{document.has_extracted_text ? 'Ready' : 'Processing'}</span>
                    <h3>{document.original_filename}</h3>
                    <p>Status: {document.processing_status}</p>
                  </div>

                  <button type="button" onClick={() => onOpenDocument(document.id)}>
                    Open AI workspace
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default AITutorPage

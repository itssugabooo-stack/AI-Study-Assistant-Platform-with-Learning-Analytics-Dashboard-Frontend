import { useEffect, useState } from 'react'
import Logo from '../components/Logo'
import { getDocument, getDocumentText } from '../api/documents'
import { generateSummary, generateFlashcards } from '../api/ai'

const workspaceNavItems = [
  { label: 'Overview', page: 'dashboard' },
  { label: 'My Library', page: 'library' },
  { label: 'Practice', page: 'practice' },
  { label: 'AI Tutor', page: 'ai-tutor' },
  { label: 'Study Plan', page: 'study-plan' },
]

function DocumentWorkspacePage({ documentId, onNavigate, onToggleTheme, theme }) {
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [documentText, setDocumentText] = useState(null)
  const [summary, setSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState('')
  const [flashcards, setFlashcards] = useState([])
  const [flashcardsLoading, setFlashcardsLoading] = useState(false)
  const [flashcardsError, setFlashcardsError] = useState('')
  const [activeTab, setActiveTab] = useState('summary')
  const [visibleAnswers, setVisibleAnswers] = useState({})

  useEffect(() => {
    async function loadDocument() {
      try {
        const [documentData, textData] = await Promise.all([
          getDocument(documentId),
          getDocumentText(documentId),
        ])

        setDocument(documentData)
        setDocumentText(textData)
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }

    loadDocument()
  }, [documentId])

  async function handleGenerateSummary() {
    setSummaryLoading(true)
    setSummaryError('')

    try {
      const data = await generateSummary(documentId)
      setSummary(data.summary)
    } catch (requestError) {
      setSummaryError(requestError.message)
    } finally {
      setSummaryLoading(false)
    }
  }

  async function handleGenerateFlashcards() {
    setFlashcardsLoading(true)
    setFlashcardsError('')

    try {
      const data = await generateFlashcards(documentId)
      setFlashcards(data.flashcards)
    } catch (requestError) {
      setFlashcardsError(requestError.message)
    } finally {
      setFlashcardsLoading(false)
    }
  }

  function toggleAnswer(index) {
    setVisibleAnswers((currentAnswers) => ({
      ...currentAnswers,
      [index]: !currentAnswers[index],
    }))
  }

  return (
    <div className="workspace-screen">
      <header className="dashboard-appbar">
        <button className="dashboard-brand" type="button" onClick={() => onNavigate('dashboard')}>
          <Logo />
        </button>

        <nav className="dashboard-nav" aria-label="Workspace navigation">
          {workspaceNavItems.map((item) => (
            <button
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
            Library
          </button>
        </div>
      </header>

      <main className="workspace-page">
        <section className="workspace-hero">
          <div>
            <p className="dashboard-kicker">Document Workspace</p>
            <h1>{document?.original_filename || 'Document Workspace'}</h1>
            <p>Generate study tools from this PDF: summary, flashcards, quiz, roadmap, and extracted text.</p>
          </div>

          <article>
            <span>Document ID</span>
            <strong>{documentId}</strong>
            <p>{document?.processing_status || 'Loading status'}</p>
          </article>
        </section>

        {loading && <p className="dashboard-message">Loading document...</p>}
        {error && <p className="dashboard-message dashboard-error">{error}</p>}

        {document && (
          <section className="workspace-status-card">
            <div>
              <p className="dashboard-kicker">Status</p>
              <h2>{document.original_filename}</h2>
            </div>
            <span>{document.has_extracted_text ? 'Extracted text ready' : 'Extracted text not ready'}</span>
          </section>
        )}

        <section className="workspace-tabs-card">
          <nav className="workspace-tabs" aria-label="Document study tools">
            <button
              className={activeTab === 'summary' ? 'active' : ''}
              type="button"
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button
              className={activeTab === 'flashcards' ? 'active' : ''}
              type="button"
              onClick={() => setActiveTab('flashcards')}
            >
              Flashcards
              {flashcards.length > 0 && <span>{flashcards.length}</span>}
            </button>
            <button
              className={activeTab === 'text' ? 'active' : ''}
              type="button"
              onClick={() => setActiveTab('text')}
            >
              Text Preview
            </button>
          </nav>

          {activeTab === 'summary' && (
            <article className="workspace-tab-panel">
              <header>
                <div>
                  <p className="dashboard-kicker">Summary</p>
                  <h2>Understand the document faster</h2>
                </div>
                <button
                  disabled={summaryLoading}
                  type="button"
                  onClick={handleGenerateSummary}
                >
                  {summaryLoading ? 'Generating...' : summary ? 'Regenerate' : 'Generate Summary'}
                </button>
              </header>

              {summaryError && <p className="dashboard-message dashboard-error">{summaryError}</p>}

              {summary ? (
                <div className="workspace-summary-result">
                  <p>{summary}</p>
                </div>
              ) : (
                <div className="workspace-empty-tool">
                  <h3>No summary yet</h3>
                  <p>Generate a concise explanation from this PDF so you can review the main ideas quickly.</p>
                </div>
              )}
            </article>
          )}

          {activeTab === 'flashcards' && (
            <article className="workspace-tab-panel">
              <header>
                <div>
                  <p className="dashboard-kicker">Flashcards</p>
                  <h2>Practice active recall</h2>
                </div>
                <button
                  disabled={flashcardsLoading}
                  type="button"
                  onClick={handleGenerateFlashcards}
                >
                  {flashcardsLoading ? 'Generating...' : flashcards.length > 0 ? 'Regenerate' : 'Generate Flashcards'}
                </button>
              </header>

              {flashcardsError && <p className="dashboard-message dashboard-error">{flashcardsError}</p>}

              {flashcards.length === 0 && (
                <div className="workspace-empty-tool">
                  <h3>No flashcards yet</h3>
                  <p>Generate flashcards to test yourself with question-and-answer review cards.</p>
                </div>
              )}

              {flashcards.length > 0 && (
                <div className="workspace-flashcard-grid">
                  {flashcards.map((flashcard, index) => (
                    <article className="workspace-flashcard" key={`${flashcard.question}-${index}`}>
                      <span>Question {index + 1}</span>
                      <h3>{flashcard.question}</h3>

                      {visibleAnswers[index] && <p>{flashcard.answer}</p>}

                      <button type="button" onClick={() => toggleAnswer(index)}>
                        {visibleAnswers[index] ? 'Hide answer' : 'Show answer'}
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </article>
          )}

          {activeTab === 'text' && (
            <article className="workspace-tab-panel workspace-text-card">
              <header>
                <div>
                  <p className="dashboard-kicker">Extracted Text</p>
                  <h2>PDF text preview</h2>
                </div>
                {documentText?.truncated && <span>Shortened preview</span>}
              </header>

              {documentText?.text ? (
                <pre>{documentText.text}</pre>
              ) : (
                !loading && !error && <p className="workspace-muted">Extracted text is not available yet.</p>
              )}
            </article>
          )}
        </section>
      </main>
    </div>
  )
}

export default DocumentWorkspacePage

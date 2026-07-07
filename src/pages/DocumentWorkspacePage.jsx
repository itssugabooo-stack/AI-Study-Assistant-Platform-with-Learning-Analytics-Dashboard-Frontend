import { useEffect, useState } from 'react'
import Logo from '../components/Logo'
import { getDocument, getDocumentText } from '../api/documents'
import { generateSummary, generateFlashcards, generateQuiz, generateRoadmap } from '../api/ai'
import { submitQuizAttempt } from '../api/quizzes'

const workspaceNavItems = [
  { label: 'Overview', page: 'dashboard' },
  { label: 'My Library', page: 'library' },
  { label: 'Practice', page: 'practice' },
  { label: 'Study Plan', page: 'study-plan' },
]

const workspaceToolTabs = ['tools', 'summary', 'flashcards', 'quiz', 'roadmap', 'text']

const workspaceTools = [
  {
    id: 'summary',
    title: 'Summary',
    description: 'Short form of the PDF so you can understand the main ideas fast.',
    action: 'Start Summary',
  },
  {
    id: 'flashcards',
    title: 'Flashcards',
    description: 'Question and answer cards for quick memory practice.',
    action: 'Start Flashcards',
  },
  {
    id: 'quiz',
    title: 'Exam',
    description: 'Take a generated quiz and save your score to practice history.',
    action: 'Start Exam',
  },
  {
    id: 'roadmap',
    title: 'Roadmap',
    description: 'Step-by-step study plan from this document.',
    action: 'Start Roadmap',
  },
  {
    id: 'text',
    title: 'Text Preview',
    description: 'Read the extracted PDF text that the backend found.',
    action: 'View Text',
  },
]

function DocumentWorkspacePage({ documentId, initialTool = 'tools', onNavigate, onToggleTheme, onLogout, theme }) {
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
  const [quiz, setQuiz] = useState([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState('')
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState({})
  const [quizSubmitLoading, setQuizSubmitLoading] = useState(false)
  const [quizSubmitError, setQuizSubmitError] = useState('')
  const [quizResult, setQuizResult] = useState(null)
  const [roadmap, setRoadmap] = useState([])
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapError, setRoadmapError] = useState('')
  const [activeTab, setActiveTab] = useState(workspaceToolTabs.includes(initialTool) ? initialTool : 'tools')
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

  async function handleGenerateQuiz() {
    setQuizLoading(true)
    setQuizError('')

    try {
      const data = await generateQuiz(documentId)
      setQuiz(data.questions ?? [])
      setSelectedQuizAnswers({})
      setQuizResult(null)
      setQuizSubmitError('')
    } catch (requestError) {
      setQuizError(requestError.message)
    } finally {
      setQuizLoading(false)
    }
  }

  async function handleGenerateRoadmap() {
    setRoadmapLoading(true)
    setRoadmapError('')

    try {
      const data = await generateRoadmap(documentId)
      setRoadmap(data.steps ?? [])
    } catch (requestError) {
      setRoadmapError(requestError.message)
    } finally {
      setRoadmapLoading(false)
    }
  }

  function toggleAnswer(index) {
    setVisibleAnswers((currentAnswers) => ({
      ...currentAnswers,
      [index]: !currentAnswers[index],
    }))
  }

  function handleSelectQuizAnswer(questionIndex, answer) {
    if (quizResult) {
      return
    }

    setSelectedQuizAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionIndex]: answer,
    }))
  }

  async function handleSubmitExam() {
    setQuizSubmitLoading(true)
    setQuizSubmitError('')

    try {
      const answers = quiz.map((question, index) => ({
        question: question.question,
        selected_answer: selectedQuizAnswers[index] ?? '',
        correct_answer: question.correct_answer,
      }))
      const result = await submitQuizAttempt(documentId, answers)
      setQuizResult(result)
    } catch (requestError) {
      setQuizSubmitError(requestError.message)
    } finally {
      setQuizSubmitLoading(false)
    }
  }

  const answeredQuestionCount = Object.keys(selectedQuizAnswers).length
  const canSubmitQuiz = quiz.length > 0 && answeredQuestionCount === quiz.length && !quizSubmitLoading && !quizResult
  const activeTool = workspaceTools.find((tool) => tool.id === activeTab)

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
          <button className="signout-button" type="button" onClick={onLogout}>
            Logout
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

        <section className="workspace-tabs-card workspace-tool-page-card">
          {activeTab === 'tools' ? (
            <div className="workspace-tool-menu">
              <div className="workspace-tool-menu-header">
                <p className="dashboard-kicker">PDF Study Workspace</p>
                <h2>Choose how you want to study this document</h2>
                <p>
                  Start with a summary, practice with flashcards, take an exam, follow a roadmap, or preview the extracted text.
                </p>
              </div>

              <div className="workspace-tool-grid">
                {workspaceTools.map((tool) => (
                  <button
                    className="workspace-tool-card"
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveTab(tool.id)}
                  >
                    <div>
                      <h3>{tool.title}</h3>
                      <p>{tool.description}</p>
                    </div>
                    <span>{tool.action}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="workspace-tool-page-header">
              <button type="button" onClick={() => setActiveTab('tools')}>
                ← Back to tools
              </button>
              <div>
                <p className="dashboard-kicker">Current page</p>
                <h2>{activeTool?.title}</h2>
              </div>
            </div>
          )}

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

          {activeTab === 'quiz' && (
            <article className="workspace-tab-panel">
              <header>
                <div>
                  <p className="dashboard-kicker">Exam</p>
                  <h2>Take a scored quiz</h2>
                </div>
                <button
                  disabled={quizLoading}
                  type="button"
                  onClick={handleGenerateQuiz}
                >
                  {quizLoading ? 'Generating...' : quiz.length > 0 ? 'Regenerate' : 'Generate Exam'}
                </button>
              </header>

              {quizError && <p className="dashboard-message dashboard-error">{quizError}</p>}

              {quiz.length === 0 && (
                <div className="workspace-empty-tool">
                  <h3>No exam yet</h3>
                  <p>Generate questions from this PDF, answer them, then submit to save your score.</p>
                </div>
              )}

              {quiz.length > 0 && (
                <div className="workspace-quiz-list">
                  <div className="workspace-exam-summary">
                    <div>
                      <span>Exam progress</span>
                      <strong>{answeredQuestionCount}/{quiz.length}</strong>
                      <p>Answer every question before submitting.</p>
                    </div>
                    {quizResult && (
                      <div>
                        <span>Your score</span>
                        <strong>{quizResult.score_percentage}%</strong>
                        <p>{quizResult.correct_answers} correct out of {quizResult.total_questions}</p>
                      </div>
                    )}
                  </div>

                  {quiz.map((question, index) => (
                    <article className="workspace-quiz-card" key={`${question.question}-${index}`}>
                      <span>Question {index + 1}</span>
                      <h3>{question.question}</h3>
                      <ul>
                        {(question.choices ?? []).map((choice) => (
                          <li key={choice}>
                            <button
                              className={[
                                'workspace-quiz-choice',
                                selectedQuizAnswers[index] === choice ? 'selected' : '',
                                quizResult && choice === question.correct_answer ? 'correct' : '',
                                quizResult && selectedQuizAnswers[index] === choice && choice !== question.correct_answer ? 'wrong' : '',
                              ].filter(Boolean).join(' ')}
                              type="button"
                              onClick={() => handleSelectQuizAnswer(index, choice)}
                            >
                              {choice}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}

                  {quizSubmitError && <p className="dashboard-message dashboard-error">{quizSubmitError}</p>}

                  <div className="workspace-exam-actions">
                    <button disabled={!canSubmitQuiz} type="button" onClick={handleSubmitExam}>
                      {quizSubmitLoading ? 'Submitting...' : quizResult ? 'Score saved' : 'Submit exam'}
                    </button>
                    {quizResult && (
                      <button type="button" onClick={() => onNavigate('practice')}>
                        View practice history
                      </button>
                    )}
                  </div>
                </div>
              )}
            </article>
          )}

          {activeTab === 'roadmap' && (
            <article className="workspace-tab-panel">
              <header>
                <div>
                  <p className="dashboard-kicker">Roadmap</p>
                  <h2>Follow a study plan</h2>
                </div>
                <button
                  disabled={roadmapLoading}
                  type="button"
                  onClick={handleGenerateRoadmap}
                >
                  {roadmapLoading ? 'Generating...' : roadmap.length > 0 ? 'Regenerate' : 'Generate Roadmap'}
                </button>
              </header>

              {roadmapError && <p className="dashboard-message dashboard-error">{roadmapError}</p>}

              {roadmap.length === 0 && (
                <div className="workspace-empty-tool">
                  <h3>No roadmap yet</h3>
                  <p>Generate step-by-step study guidance for this PDF.</p>
                </div>
              )}

              {roadmap.length > 0 && (
                <ol className="workspace-roadmap-list">
                  {roadmap.map((step, index) => (
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

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getDocument, getDocumentText } from '../api/documents'
import { generateSummary, generateFlashcards, generateQuiz, generateRoadmap } from '../api/ai'
import { submitQuizAttempt } from '../api/quizzes'
import ResourceState from '../components/ResourceState'
import RoadmapSteps from '../components/RoadmapSteps'
import Skeleton from '../components/Skeleton'
import RouteLink from '../components/RouteLink'
import { documentPath, workspacePaths } from '../routes'
import useResource from '../useResource'
import ErrorPage from './ErrorPage'

const tools = [
  { id: 'summary', label: 'Summary', description: 'Turn the key ideas in this PDF into a concise set of notes.', generate: generateSummary },
  { id: 'flashcards', label: 'Flashcards', description: 'Test your recall with questions and reveal each answer as you go.', generate: generateFlashcards },
  { id: 'quiz', label: 'Quiz', description: 'Answer questions from this PDF and save your score to Practice.', generate: generateQuiz },
  { id: 'roadmap', label: 'Roadmap', description: 'Get an ordered list of topics to review from this PDF.', generate: generateRoadmap },
]

function TextPreview({ data }) {
  if (!data?.text?.trim()) return <p className="sp-muted">There’s no extracted text available for this PDF.</p>

  return (
    <>
      {data.truncated && <p className="sp-muted">Showing a shortened preview.</p>}
      <pre className="sp-reading">{data.text}</pre>
    </>
  )
}

function ExtractedText({ documentId }) {
  const loadText = useCallback((options) => getDocumentText(documentId, options), [documentId])
  const resource = useResource(loadText)

  return (
    <>
      <ResourceState resource={resource} loading="Loading extracted text…" failure="The extracted text couldn’t be loaded." />
      {resource.status === 'success' && <TextPreview data={resource.data} />}
    </>
  )
}

function DocumentWorkspacePage({ documentId, activeTool, onSelectTool, onNavigate }) {
  const loadDocument = useCallback((options) => getDocument(documentId, options), [documentId])
  const documentResource = useResource(loadDocument)
  const [extraction, setExtraction] = useState({ status: 'idle' })
  const activeExtraction = useRef(null)
  const document = documentResource.data ?? extraction.document
  const textReady = document?.has_extracted_text || extraction.status === 'ready'
  const extracting = extraction.status === 'loading'
  const [resources, setResources] = useState({})
  const [quizId, setQuizId] = useState(null)
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState({})
  const [questionIndex, setQuestionIndex] = useState(0)
  const [quizSubmitLoading, setQuizSubmitLoading] = useState(false)
  const [quizSubmitError, setQuizSubmitError] = useState('')
  const [quizResult, setQuizResult] = useState(null)
  const pending = useRef(new Set())
  const questionHeading = useRef(null)
  const resultHeading = useRef(null)
  const toolHeading = useRef(null)
  const focusToolHeading = useRef(false)

  const tool = tools.find(({ id }) => id === activeTool)
  const viewingText = activeTool === 'text'
  const textPreviewPath = documentPath(documentId, 'text')
  const resource = resources[activeTool]
  const quiz = resources.quiz?.data?.questions ?? []
  const question = quiz[questionIndex]
  const answeredCount = Object.keys(selectedQuizAnswers).length
  const canSubmitQuiz = quizId != null && quiz.length > 0 && answeredCount === quiz.length
    && !quizSubmitLoading && !quizResult
  const showQuiz = activeTool === 'quiz' && resource?.status === 'success' && Boolean(question)

  useEffect(() => () => activeExtraction.current?.abort(), [])

  useLayoutEffect(() => {
    if (showQuiz) (quizResult ? resultHeading : questionHeading).current?.focus()
  }, [questionIndex, quizResult, showQuiz])

  useLayoutEffect(() => {
    if (!focusToolHeading.current) return
    focusToolHeading.current = false
    toolHeading.current?.focus()
  }, [activeTool])

  function focusTextPreview() {
    if (viewingText) toolHeading.current?.focus()
    else focusToolHeading.current = true
  }

  async function handleExtractText() {
    if (textReady || activeExtraction.current) return
    const controller = new AbortController()
    activeExtraction.current = controller
    setExtraction({ status: 'loading' })

    try {
      const data = await getDocumentText(documentId, { signal: controller.signal })
      controller.signal.throwIfAborted()
      if (typeof data?.text !== 'string') throw new Error('Invalid text response')

      if (!data.text.trim()) {
        setExtraction({ status: 'empty' })
        return
      }

      setExtraction({ status: 'ready', data, document })
      documentResource.retry()
    } catch {
      if (!controller.signal.aborted) setExtraction({ status: 'error' })
    } finally {
      activeExtraction.current = null
    }
  }

  async function handleGenerate() {
    if (!textReady || !tool?.generate || pending.current.has(activeTool)) return
    const toolId = activeTool
    pending.current.add(toolId)
    setResources((previous) => ({ ...previous, [toolId]: { status: 'loading' } }))

    try {
      const data = await tool.generate(documentId)
      if (toolId === 'quiz') {
        if (data.quiz_id == null || !Array.isArray(data.questions) || data.questions.length === 0
          || data.questions.some((item) => typeof item.question !== 'string' || !Array.isArray(item.choices) || item.choices.length < 2)) {
          throw new Error('This service didn’t return a quiz with scorable questions. Try generating it again.')
        }
        setQuizId(data.quiz_id)
        setSelectedQuizAnswers({})
        setQuestionIndex(0)
        setQuizResult(null)
        setQuizSubmitError('')
      }
      setResources((previous) => ({ ...previous, [toolId]: { status: 'success', data } }))
    } catch (error) {
      setResources((previous) => ({ ...previous, [toolId]: { status: 'error', error } }))
    } finally {
      pending.current.delete(toolId)
    }
  }

  function handleSelectQuizAnswer(questionIndex, choiceIndex) {
    if (quizResult || pending.current.has('submit')) return

    setSelectedQuizAnswers((previous) => ({
      ...previous,
      [questionIndex]: choiceIndex,
    }))
  }

  async function handleSubmitExam() {
    if (!canSubmitQuiz || pending.current.has('submit')) return
    pending.current.add('submit')
    setQuizSubmitLoading(true)
    setQuizSubmitError('')

    try {
      const answers = quiz.map((_, index) => ({
        question_index: index,
        selected_choice_index: selectedQuizAnswers[index],
      }))
      const result = await submitQuizAttempt(quizId, answers)
      setQuizResult(result)
    } catch (error) {
      setQuizSubmitError(error.message)
    } finally {
      pending.current.delete('submit')
      setQuizSubmitLoading(false)
    }
  }

  if (documentResource.status === 'error' && !document) {
    const missing = documentResource.error?.status === 404
    const signedOut = documentResource.error?.status === 401
    return (
      <ErrorPage
        embedded
        title={missing ? 'Document not found' : signedOut ? 'Sign in again' : 'Couldn’t open this document'}
        description={missing ? 'This PDF may no longer be available in your library.' : signedOut ? 'Your session has expired. Sign out, then sign in again to open your PDF.' : 'Try loading the document again or open another PDF from your library.'}
        onBack={() => onNavigate('library')}
        backLabel="Back to library"
        onRetry={missing || signedOut ? undefined : documentResource.retry}
      />
    )
  }

  return (
    <div className="sp-page">
      <RouteLink className="sp-text-button sp-back-link" to={workspacePaths.library}>← Back to library</RouteLink>
      <header className="sp-page-heading sp-document-heading">
        {document ? <h1>{document.original_filename}</h1> : <h1 className="sp-visually-hidden">Document workspace</h1>}
        {!document && <ResourceState resource={documentResource} loading="Loading document…" variant="heading" />}
        {document && (
          <div className="sp-document-meta">
            <p role="status">{textReady ? 'Extracted text ready' : 'Extracted text unavailable'}</p>
            {textReady && (
              <RouteLink
                className="sp-text-button"
                to={textPreviewPath}
                aria-current={viewingText ? 'page' : undefined}
                onNavigate={focusTextPreview}
              >
                View extracted text
              </RouteLink>
            )}
          </div>
        )}
      </header>

      {document && documentResource.status === 'error' && (
        <ResourceState resource={documentResource} failure="We couldn’t refresh the document status." />
      )}

      {document && (
        <div className="sp-workspace">
          <nav className="sp-tool-rail" aria-label="Document tools">
            {tools.map(({ id, label }) => (
              <RouteLink key={id} to={documentPath(documentId, id)} aria-current={activeTool === id ? 'page' : undefined}>{label}</RouteLink>
            ))}
          </nav>
          <label className="sp-field sp-tool-picker">
            Study tool
            <select value={viewingText ? '' : activeTool} onChange={(event) => onSelectTool(event.target.value)}>
              {viewingText && <option value="" disabled>Choose a study tool</option>}
              {tools.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>

          <section className="sp-tool-panel" aria-labelledby="tool-title" key={activeTool}>
            <div className="sp-section-heading">
              <div><h2 id="tool-title" tabIndex={-1} ref={toolHeading}>{tool?.label ?? 'Extracted text'}</h2>{!showQuiz && tool?.description && <p>{tool.description}</p>}</div>
              {tool?.generate && !showQuiz && textReady && (
                <button className="sp-button sp-primary" type="button" onClick={handleGenerate} disabled={resource?.status === 'loading'}>
                  {resource?.status === 'loading' ? 'Generating…' : resource?.status === 'error' ? 'Try again' : `Generate ${tool.label.toLowerCase()}`}
                </button>
              )}
            </div>

            {!textReady && (
              <div className="sp-empty">
                <h3>{extraction.status === 'empty' ? 'No selectable text found' : 'Extract text to start studying'}</h3>
                {extraction.status === 'idle' && <p>Extract the text from your PDF to use the study tools.</p>}
                {extracting && <p role="status">Extracting text from your PDF…</p>}
                {extraction.status === 'empty' && <p role="status">This PDF may be scanned. Upload a PDF with selectable text to use the study tools.</p>}
                {extraction.status === 'error' && <p role="alert">We couldn’t extract text from this PDF. Try again.</p>}
                <button className="sp-button sp-primary" type="button" onClick={handleExtractText} disabled={extracting}>
                  {extracting ? 'Extracting…' : extraction.status === 'error' ? 'Retry extraction' : 'Extract text'}
                </button>
              </div>
            )}
            {textReady && viewingText && (
              extraction.data ? <TextPreview data={extraction.data} /> : <ExtractedText documentId={documentId} />
            )}

            {resource?.status === 'loading' && <Skeleton label={`Generating ${tool.label.toLowerCase()}…`} />}
            {resource?.status === 'error' && <p className="sp-error" role="alert">{resource.error.message}</p>}

            {resource?.status === 'success' && activeTool === 'summary' && (
              <p className="sp-reading">{resource.data.summary || 'This PDF returned an empty summary.'}</p>
            )}
            {resource?.status === 'success' && activeTool === 'flashcards' && (
              resource.data.flashcards?.length ? (
                <div className="sp-flashcards">
                  {resource.data.flashcards.map((card, index) => (
                    <details key={`${card.question}-${index}`}><summary>{card.question}</summary><p>{card.answer}</p></details>
                  ))}
                </div>
              ) : <p className="sp-muted">This PDF returned no flashcards.</p>
            )}
            {resource?.status === 'success' && activeTool === 'roadmap' && (
              resource.data.steps?.length ? <RoadmapSteps steps={resource.data.steps} /> : <p className="sp-muted">This PDF returned no study steps.</p>
            )}

            {showQuiz && (quizResult ? (
              <div className="sp-quiz-result">
                <h3 ref={resultHeading} tabIndex={-1}>Quiz results</h3>
                <strong className="sp-result-score">{quizResult.score_percentage}%</strong>
                <p>{quizResult.correct_answers} correct out of {quizResult.total_questions}</p>
                <div className="sp-actions">
                  <button className="sp-button sp-primary" type="button" onClick={() => onNavigate('practice')}>View practice history</button>
                  <RouteLink className="sp-button sp-secondary" to={textPreviewPath} onNavigate={focusTextPreview}>Review extracted text</RouteLink>
                  <button className="sp-text-button" type="button" onClick={handleGenerate}>Generate another quiz</button>
                </div>
              </div>
            ) : (
              <div className="sp-quiz">
                <div className="sp-question-progress">
                  <h3 ref={questionHeading} tabIndex={-1}>Question {questionIndex + 1} of {quiz.length}</h3>
                  <span role="status">{answeredCount} of {quiz.length} answered</span>
                </div>
                <progress aria-label="Questions answered" value={answeredCount} max={quiz.length} />
                <fieldset className="sp-question" disabled={quizSubmitLoading}>
                  <legend>{question.question}</legend>
                  {question.choices.map((choice, choiceIndex) => (
                    <label className="sp-choice" key={choiceIndex}>
                      <input type="radio" name={`question-${questionIndex}`} checked={selectedQuizAnswers[questionIndex] === choiceIndex} onChange={() => handleSelectQuizAnswer(questionIndex, choiceIndex)} />
                      <span>{choice}</span>
                    </label>
                  ))}
                </fieldset>
                {quizSubmitError && <p className="sp-error" role="alert">{quizSubmitError}</p>}
                {quizSubmitLoading && <p className="sp-status" role="status">Submitting quiz for grading…</p>}
                <div className="sp-quiz-actions">
                  <button className="sp-button sp-secondary" type="button" onClick={() => setQuestionIndex(questionIndex - 1)} disabled={questionIndex === 0 || quizSubmitLoading}>← Previous</button>
                  {questionIndex + 1 < quiz.length
                    ? <button className="sp-button sp-primary" type="button" onClick={() => setQuestionIndex(questionIndex + 1)} disabled={selectedQuizAnswers[questionIndex] === undefined}>Next →</button>
                    : <button className="sp-button sp-primary" type="button" onClick={handleSubmitExam} disabled={!canSubmitQuiz}>{quizSubmitLoading ? 'Submitting…' : quizSubmitError ? 'Retry submission' : 'Submit quiz'}</button>}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  )
}

export default DocumentWorkspacePage

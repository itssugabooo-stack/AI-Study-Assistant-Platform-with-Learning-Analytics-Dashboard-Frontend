import { useCallback, useEffect, useRef, useState } from 'react'
import { generateStudyLesson, generateStudyQuiz, getStudyPart, submitStudyQuiz } from '../api/study'
import { buildQuizAnswers, getPracticeView, pageRange, sectionStates } from '../guidedStudyData'
import useResource from '../useResource'
import useStudyMutation from '../useStudyMutation'
import ResourceState from './ResourceState'
import Skeleton from './Skeleton'
import { StudySource } from './StudyPdfLinks'

const formatScore = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })

function readDraft(key, questions) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key))
    if (!saved?.started) return { started: false, selected: {} }
    const selected = {}
    questions.forEach(({ choices }, index) => {
      const value = saved.selected?.[index]
      if (Number.isInteger(value) && value >= 0 && value < choices.length) selected[index] = value
    })
    return { started: true, selected }
  } catch {
    return { started: false, selected: {} }
  }
}

function StudyQuiz({ quiz, documentId, pending, onSubmit }) {
  const key = `studypilot:study-quiz:${documentId}:${quiz.id}`
  const [draft, setDraft] = useState(() => readDraft(key, quiz.questions))
  const title = useRef(null)
  const total = quiz.questions.length
  const answers = buildQuizAnswers(quiz.questions, draft.selected)
  const answeredCount = Object.keys(draft.selected).length
  const quizLabel = quiz.kind === 'retry' ? 'Retry quiz' : 'Practice quiz'

  useEffect(() => {
    if (draft.started) title.current?.focus({ preventScroll: true })
  }, [draft.started])

  function remember(next) {
    setDraft(next)
    try {
      sessionStorage.setItem(key, JSON.stringify(next))
    } catch {
      // Draft persistence is optional when browser storage is unavailable.
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (!answers || pending || !await onSubmit(quiz, answers)) return
    try {
      sessionStorage.removeItem(key)
    } catch {
      // The server already saved the result.
    }
  }

  if (!draft.started) {
    return (
      <section className="sp-guided-band">
        <div className="sp-section-heading">
          <div><h3>{quizLabel} ready</h3><p>{total} {total === 1 ? 'question' : 'questions'}</p></div>
          <button className="sp-button sp-primary" type="button" onClick={() => remember({ started: true, selected: {} })}>Start quiz</button>
        </div>
      </section>
    )
  }

  return (
    <form className="sp-guided-band sp-guided-quiz" onSubmit={submit} aria-labelledby="guided-quiz-title">
      <div className="sp-section-heading">
        <h3 id="guided-quiz-title" tabIndex={-1} ref={title}>{quizLabel}</h3>
        <p role="status">{answeredCount} of {total} answered</p>
      </div>
      {quiz.questions.map((item, index) => (
        <fieldset className="sp-question" key={index} disabled={pending}>
          <legend><span className="sp-guided-question-number">{index + 1}.</span> {item.question}</legend>
          {item.choices.map((choice, choiceIndex) => (
            <label className="sp-choice" key={choiceIndex}>
              <input type="radio" name={`guided-${quiz.id}-${index}`} value={choiceIndex} checked={draft.selected[index] === choiceIndex}
                onChange={() => remember({ started: true, selected: { ...draft.selected, [index]: choiceIndex } })} />
              <span>{choice}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <button className="sp-button sp-primary" type="submit" disabled={!answers || pending}>{pending ? 'Submitting...' : 'Submit answers'}</button>
    </form>
  )
}

function StudyFeedback({ feedback, documentId, pending, onRetry, focusResult }) {
  const title = useRef(null)
  useEffect(() => {
    if (focusResult) title.current?.focus()
  }, [feedback.quiz_id, focusResult])

  return (
    <section className="sp-guided-band sp-guided-review" aria-labelledby="guided-result-title">
      <div className="sp-guided-result">
        <div>
          <h3 id="guided-result-title" ref={title} tabIndex={-1}>
            {feedback.kind === 'retry' ? 'Retry result' : 'Practice result'}
          </h3>
          <p>{feedback.correct_answers} of {feedback.total_questions} correct</p>
        </div>
        <strong className="sp-guided-result-score">{formatScore.format(feedback.score_percentage)}%</strong>
      </div>
      <ol className="sp-guided-feedback" key={feedback.quiz_id}>
        {feedback.answers.map((answer, index) => (
          <li key={index}>
            <div className="sp-guided-review-meta">
              <span>Question {index + 1}</span>
              <strong data-result={answer.correct ? 'correct' : 'incorrect'}>{answer.correct ? 'Correct' : 'Incorrect'}</strong>
            </div>
            <h4>{answer.question}</h4>
            <dl className="sp-guided-review-answers">
              <div data-result={answer.correct ? 'correct' : 'incorrect'}>
                <dt>Your answer</dt>
                <dd>{answer.choices[answer.selected_choice_index]}</dd>
              </div>
              {!answer.correct && (
                <div data-result="correct">
                  <dt>Correct answer</dt>
                  <dd>{answer.choices[answer.correct_choice_index]}</dd>
                </div>
              )}
            </dl>
            <details className="sp-guided-review-details">
              <summary>Explanation &amp; source</summary>
              {answer.topic && <p className="sp-guided-review-topic">{answer.topic}</p>}
              <p className="sp-reading">{answer.explanation}</p>
              <StudySource source={answer.source} documentId={documentId} />
            </details>
          </li>
        ))}
      </ol>
      {feedback.needs_review && (
        <button className="sp-button sp-primary" type="button" disabled={pending} onClick={onRetry}>
          {pending ? 'Generating retry...' : 'Retry with a different scenario'}
        </button>
      )}
    </section>
  )
}

function StudyLesson({ lesson, documentId }) {
  return (
    <section className="sp-guided-band sp-guided-lesson" aria-labelledby="guided-lesson-title">
      <h3 id="guided-lesson-title">Lesson</h3>
      <div>
        <h4>Objectives</h4>
        <ul>{lesson.objectives.map((item) => <li key={item.id}>{item.title}</li>)}</ul>
      </div>
      <div><h4>Explanation</h4><p className="sp-reading">{lesson.explanation}</p></div>
      <div><h4>Worked example</h4><p className="sp-reading">{lesson.example}</p></div>
      <div><h4>Sources</h4>{lesson.sources.map((source, index) => <StudySource key={index} source={source} documentId={documentId} />)}</div>
    </section>
  )
}

export default function StudyPart({ partId, documentId, onProgress }) {
  const load = useCallback((options) => getStudyPart(partId, options), [partId])
  const resource = useResource(load)
  const [updated, setUpdated] = useState(null)
  const [submittedId, setSubmittedId] = useState(null)
  const mutation = useStudyMutation()
  const part = updated ?? resource.data

  async function generateLesson() {
    const result = await mutation.run((options) => generateStudyLesson(partId, options))
    if (result) {
      setUpdated(result)
      onProgress(result, false)
    }
  }

  async function generateQuiz(retry) {
    const result = await mutation.run((options) => generateStudyQuiz(partId, retry, options))
    if (result) {
      setUpdated(result)
      onProgress(result, Boolean(result.quiz))
    }
  }

  async function submitQuiz(quiz, answers) {
    const feedback = await mutation.run(async (options) => {
      const result = await submitStudyQuiz(quiz.id, answers, options)
      if (result.quiz_id !== quiz.id) throw new Error('The result did not match this quiz. Try submitting again.')
      return result
    })
    if (!feedback) return false
    const next = { ...part, feedback, state: feedback.needs_review ? 'needs_review' : 'practiced' }
    setUpdated(next)
    setSubmittedId(feedback.quiz_id)
    onProgress(next, true)
    return true
  }

  if (!part) return <ResourceState resource={resource} loading="Opening study part..." failure="Could not load this part." />

  const { quiz, feedback } = getPracticeView(part)
  return (
    <article className="sp-guided-part">
      <div className="sp-guided-part-meta">
        <h3>Part {part.number} <span>{pageRange(part.start_page, part.end_page)}</span></h3>
        <span className="sp-guided-state" data-state={part.state}>{sectionStates[part.state]}</span>
      </div>
      {part.lesson ? <StudyLesson lesson={part.lesson} documentId={documentId} /> : !quiz && !feedback && (
        <section className="sp-guided-band">
          <div className="sp-section-heading">
            <h3>Lesson</h3>
            <button className="sp-button sp-primary" type="button" disabled={mutation.pending} onClick={generateLesson}>
              {mutation.pending ? 'Generating lesson...' : 'Generate lesson'}
            </button>
          </div>
          {mutation.pending && <Skeleton label="Generating lesson..." />}
        </section>
      )}
      {part.lesson && !quiz && !feedback && (
        <section className="sp-guided-band">
          <div className="sp-section-heading">
            <h3>Practice quiz</h3>
            <button className="sp-button sp-primary" type="button" disabled={mutation.pending} onClick={() => generateQuiz(false)}>
              {mutation.pending ? 'Generating quiz...' : 'Generate quiz'}
            </button>
          </div>
        </section>
      )}
      {quiz && <StudyQuiz key={quiz.id} quiz={quiz} documentId={documentId} pending={mutation.pending} onSubmit={submitQuiz} />}
      {feedback && <StudyFeedback feedback={feedback} documentId={documentId} pending={mutation.pending} onRetry={() => generateQuiz(true)} focusResult={feedback.quiz_id === submittedId} />}
      {mutation.error && <p className="sp-error sp-guided-action-error" role="alert">{mutation.error.message}</p>}
    </article>
  )
}

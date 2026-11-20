import { useState } from 'react'
import RoadmapSteps from './RoadmapSteps'

const tools = [
  { id: 'summary', label: 'Summary' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'roadmap', label: 'Roadmap' },
]

const quizChoices = [
  'The glass adds new colors to the light.',
  'Different wavelengths bend by different amounts.',
  'The prism absorbs every color except violet.',
]

const roadmap = [
  { title: 'Review refraction', description: 'Explain why light changes direction when it enters glass.' },
  { title: 'Sketch a prism', description: 'Draw white light entering and the spectrum leaving.' },
  { title: 'Test your recall', description: 'Explain what happens to red and violet light without looking at your notes.' },
]

function PreviewQuiz() {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  function checkAnswer(event) {
    event.preventDefault()
    if (selected !== null) setSubmitted(true)
  }

  return (
    <form onSubmit={checkAnswer}>
      <fieldset className="sp-question">
        <legend>Why does a prism split white light into colors?</legend>
        {quizChoices.map((choice, index) => (
          <label className="sp-choice" key={choice}>
            <input
              type="radio"
              name="sample-prism-answer"
              checked={selected === index}
              onChange={() => { setSelected(index); setSubmitted(false) }}
            />
            <span>{choice}</span>
          </label>
        ))}
      </fieldset>
      <div className="sp-preview-quiz-footer">
        <button type="submit" className="sp-button sp-primary" disabled={selected === null}>Check answer</button>
        <p role="status">
          {submitted && (selected === 1
            ? 'Correct. The colors are already present in white light.'
            : 'Try again. Think about how each wavelength bends in glass.')}
        </p>
      </div>
    </form>
  )
}

function StudyToolPreview() {
  const [active, setActive] = useState('summary')

  function handleTabKey(event, index) {
    let next
    switch (event.key) {
      case 'ArrowLeft':
        next = (index + tools.length - 1) % tools.length
        break
      case 'ArrowRight':
        next = (index + 1) % tools.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = tools.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    setActive(tools[next].id)
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus()
  }

  return (
    <section className="sp-home-preview" aria-labelledby="sample-title">
      <header>
        <h3 id="sample-title">Light and color</h3>
        <p>Sample lesson</p>
      </header>
      <div className="sp-preview-tabs" role="tablist" aria-label="Sample study tools">
        {tools.map(({ id, label }, index) => (
          <button
            type="button"
            key={id}
            id={`sample-tab-${id}`}
            role="tab"
            tabIndex={active === id ? 0 : -1}
            aria-selected={active === id}
            aria-controls={`sample-panel-${id}`}
            onClick={() => setActive(id)}
            onKeyDown={(event) => handleTabKey(event, index)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="sp-preview-content" role="tabpanel" id="sample-panel-summary" aria-labelledby="sample-tab-summary" tabIndex={0} hidden={active !== 'summary'}>
        <h4>Why a prism makes a spectrum</h4>
        <p>White light contains many wavelengths. In a glass prism, shorter wavelengths such as violet bend more than longer wavelengths such as red.</p>
        <ul>
          <li><strong>Refraction</strong> changes the direction of light as it enters a different material.</li>
          <li><strong>Dispersion</strong> separates wavelengths by bending them by different amounts.</li>
        </ul>
      </div>

      <div className="sp-preview-content" role="tabpanel" id="sample-panel-flashcards" aria-labelledby="sample-tab-flashcards" tabIndex={0} hidden={active !== 'flashcards'}>
        <h4>What causes a prism to split white light?</h4>
        <details className="sp-preview-answer">
          <summary><span className="sp-preview-reveal">Reveal answer</span><span className="sp-preview-hide">Hide answer</span></summary>
          <p>Different wavelengths bend by different amounts in the glass. This separation is called dispersion.</p>
        </details>
      </div>

      <div className="sp-preview-content" role="tabpanel" id="sample-panel-quiz" aria-labelledby="sample-tab-quiz" tabIndex={0} hidden={active !== 'quiz'}>
        <PreviewQuiz />
      </div>

      <div className="sp-preview-content" role="tabpanel" id="sample-panel-roadmap" aria-labelledby="sample-tab-roadmap" tabIndex={0} hidden={active !== 'roadmap'}>
        <RoadmapSteps steps={roadmap} />
      </div>
    </section>
  )
}

export default StudyToolPreview

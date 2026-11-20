import Logo from '../components/Logo'
import RouteLink from '../components/RouteLink'
import StudyToolPreview from '../components/StudyToolPreview'
import ThemeToggle from '../components/ThemeToggle'
import { authPath } from '../routes'

const workflow = [
  ['Upload your PDF', 'Add lecture notes, slides, or a course reading to your library.'],
  ['Extract text and choose a tool', 'Open the PDF, extract its text, then choose how you want to study.'],
  ['Practice and review', 'Take a quiz on your reading and revisit your scores in Practice.'],
]

function HomePage({ theme, onToggleTheme }) {
  return (
    <div className="sp-home" id="top">
      <header className="sp-home-bar">
        <a href="#top" className="sp-brand-button"><Logo /></a>
        <nav aria-label="Site" className="sp-home-nav">
          <a className="sp-text-button" href="#study-tools">Study tools</a>
          <a className="sp-text-button" href="#how-it-works">How it works</a>
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
          <RouteLink className="sp-button sp-secondary" to={authPath('login')}>Sign in</RouteLink>
        </nav>
      </header>
      <main>
        <section className="sp-home-hero" aria-labelledby="home-title">
          <div className="sp-home-hero-inner">
            <div className="sp-home-hero-copy">
              <h1 id="home-title">StudyPilot</h1>
              <p className="sp-home-promise">Study from the PDFs you already have.</p>
              <p className="sp-muted">Make notes, practice with quizzes, and track your progress in one workspace.</p>
              <div className="sp-actions sp-hero-actions">
                <RouteLink className="sp-button sp-primary" to={authPath('signup')}>Create an account <span aria-hidden="true">→</span></RouteLink>
                <a href="#study-tools" className="sp-text-button">Explore the tools <span aria-hidden="true">↓</span></a>
              </div>
            </div>
            <div className="sp-home-image" aria-hidden="true"><img src="/images/study-desk.jpg" alt="" decoding="async" /></div>
          </div>
        </section>
        <section className="sp-home-tools" id="study-tools" aria-labelledby="study-tools-title">
          <div className="sp-home-container sp-home-showcase">
            <div className="sp-home-showcase-copy">
              <h2 id="study-tools-title">One PDF, four ways to study.</h2>
              <p>Try the tools on a short lesson before opening your own PDF.</p>
            </div>
            <StudyToolPreview />
          </div>
        </section>
        <section className="sp-home-workflow" id="how-it-works" aria-labelledby="workflow-title">
          <div className="sp-home-container">
            <h2 id="workflow-title">How it works</h2>
            <ol>
              {workflow.map(([title, text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}
            </ol>
          </div>
        </section>
        <section className="sp-home-cta" aria-labelledby="home-cta-title">
          <div className="sp-home-container sp-home-cta-inner">
            <div>
              <h2 id="home-cta-title">Bring your first PDF.</h2>
              <p>Start with a reading, a slide deck, or your own notes.</p>
            </div>
            <RouteLink className="sp-button sp-primary" to={authPath('signup')}>Create an account <span aria-hidden="true">→</span></RouteLink>
          </div>
        </section>
      </main>
      <footer className="sp-home-footer">
        <a href="#top" className="sp-brand-button"><Logo /></a>
        <a className="sp-text-button" href="#top">Back to top <span aria-hidden="true">↑</span></a>
      </footer>
    </div>
  )
}

export default HomePage

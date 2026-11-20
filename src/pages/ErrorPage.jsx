import { useEffect, useRef } from 'react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'

function ErrorPage({ title, description, onBack, backLabel = 'Back to home', onRetry, embedded = false, theme, onToggleTheme }) {
  const heading = useRef(null)

  useEffect(() => {
    heading.current.focus()
  }, [title])

  const Container = embedded ? 'section' : 'main'

  return (
    <Container className={embedded ? 'sp-error-page sp-error-embedded' : 'sp-error-page'}>
      {!embedded && (
        <header className="sp-auth-top">
          <button type="button" className="sp-brand-button" onClick={onBack} aria-label="StudyPilot home"><Logo /></button>
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
        </header>
      )}
      <div className="sp-error-content">
        <span className="sp-error-symbol" aria-hidden="true">!</span>
        <h1 ref={heading} tabIndex={-1}>{title}</h1>
        <p className="sp-muted">{description}</p>
        <div className="sp-actions">
          {onRetry && <button className="sp-button sp-primary" type="button" onClick={onRetry}>Try again</button>}
          <button className={onRetry ? 'sp-button sp-secondary' : 'sp-button sp-primary'} type="button" onClick={onBack}>{backLabel}</button>
        </div>
      </div>
    </Container>
  )
}

export default ErrorPage

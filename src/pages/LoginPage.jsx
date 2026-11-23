import { useEffect, useRef, useState } from 'react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { loginUser, registerUser } from '../api/auth'

const SLOW_THRESHOLD = 5_000
const REQUEST_LIMIT = 20_000

function signInError(error) {
  if (error.status === 401) return 'The email or password is incorrect.'
  if (error.status === 429) return 'Too many sign-in attempts. Wait a moment and try again.'
  if (!navigator.onLine) return 'You’re offline. Check your connection and try again.'
  if (error instanceof TypeError) return 'StudyPilot couldn’t reach the service. Try again in a moment.'
  return 'The sign-in service is unavailable. Try again in a moment.'
}

function LoginPage({ mode, sessionExpired, onModeChange, onBack, onLogin, theme, onToggleTheme }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [progress, setProgress] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState(null)
  const activeRequest = useRef(null)
  const isSignup = mode === 'signup'

  useEffect(() => () => {
    activeRequest.current?.abort()
  }, [mode])

  function switchMode(nextMode) {
    activeRequest.current?.abort()
    activeRequest.current = null
    setProgress('')
    setError(null)
    setNotice('')
    setPassword('')
    setConfirmation('')
    onModeChange(nextMode)
  }

  function handleBack() {
    activeRequest.current?.abort()
    activeRequest.current = null
    onBack()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (activeRequest.current) return

    setError(null)
    setNotice('')
    const cleanEmail = email.trim()

    if (isSignup && password !== confirmation) {
      setError({ message: 'Enter the same password in both fields.', field: 'confirmation' })
      return
    }

    const controller = new AbortController()
    const { signal } = controller
    activeRequest.current = controller
    let timedOut = false
    let accountCreated = false
    setProgress(isSignup ? 'Creating your account…' : 'Signing in…')

    const slowTimer = setTimeout(() => {
      if (!signal.aborted) setProgress('StudyPilot is taking longer than usual. Still trying…')
    }, SLOW_THRESHOLD)
    const timeout = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, REQUEST_LIMIT)

    try {
      if (isSignup) {
        await registerUser(cleanEmail, fullName.trim(), password, { signal })
        signal.throwIfAborted()
        accountCreated = true
        setProgress('Account created. Signing in…')
      }

      const startedAt = performance.now()
      try {
        await loginUser(cleanEmail, password, { signal })
      } finally {
        performance.measure('StudyPilot login JSON', { start: startedAt, end: performance.now() })
      }
      onLogin()
    } catch (requestError) {
      if (activeRequest.current !== controller || (signal.aborted && !timedOut)) return

      if (accountCreated || (isSignup && timedOut)) {
        onModeChange('login', { replace: true })
        setConfirmation('')
        if (accountCreated) setNotice('Your account is ready. Sign in to continue.')
      }

      const message = timedOut
        ? isSignup && !accountCreated
          ? 'Account creation is taking too long. If your account was created, sign in with your email.'
          : 'StudyPilot took too long to respond. Try again.'
        : isSignup && !accountCreated && requestError.status < 500
          ? requestError.message
          : signInError(requestError)

      setError({
        message,
        retry: timedOut || (!isSignup && requestError.status !== 401 && requestError.status !== 429),
        field: requestError.status === 401 && (!isSignup || accountCreated) ? 'credentials' : undefined,
      })
    } finally {
      clearTimeout(slowTimer)
      clearTimeout(timeout)
      if (activeRequest.current === controller) {
        activeRequest.current = null
        setProgress('')
      }
    }
  }

  return (
    <main className="sp-auth">
      <header className="sp-auth-top">
        <button type="button" className="sp-brand-button" onClick={handleBack} aria-label="StudyPilot home">
          <Logo />
        </button>
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
      </header>
      <div className="sp-auth-layout">
        <section className="sp-auth-form">
          <h1>{isSignup ? 'Create an account' : 'Sign in'}</h1>
          <p className="sp-muted">{isSignup ? 'Start studying from your own PDFs.' : 'Open your study workspace.'}</p>
          {sessionExpired && (
            <p className="sp-auth-session-notice" role="alert">Your session expired. Sign in to continue.</p>
          )}
          <form onSubmit={handleSubmit}>
            {isSignup && (
              <label className="sp-field">
                Full name
                <input name="name" autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </label>
            )}
            <label className="sp-field">
              Email address
              <input name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={error?.field === 'credentials'} aria-describedby={error?.field === 'credentials' ? 'auth-error' : undefined} />
            </label>
            <label className="sp-field">
              Password
              <input name="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} required value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={error?.field === 'credentials'} aria-describedby={error?.field === 'credentials' ? 'auth-error' : undefined} />
            </label>
            {isSignup && (
              <label className="sp-field">
                Confirm password
                <input name="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} aria-invalid={error?.field === 'confirmation'} aria-describedby={error?.field === 'confirmation' ? 'auth-error' : undefined} />
              </label>
            )}
            <div className="sp-form-message">
              <p role="status">{progress || notice}</p>
              {error && <p role="alert" id="auth-error">{error.message}</p>}
            </div>
            <button className="sp-button sp-primary sp-auth-submit" type="submit" disabled={Boolean(progress)}>
              {progress ? (isSignup ? 'Creating account…' : 'Signing in…') : error?.retry ? 'Try again' : isSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>
          <p className="sp-auth-switch">
            {isSignup ? 'Already have an account?' : 'New to StudyPilot?'}
            {' '}
            <button type="button" className="sp-text-button" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>
              {isSignup ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </section>
        <div className="sp-auth-image" aria-hidden="true" />
      </div>
    </main>
  )
}

export default LoginPage

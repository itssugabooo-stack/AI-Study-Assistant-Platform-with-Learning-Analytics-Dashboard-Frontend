import { useState } from 'react'
import Logo from '../components/Logo'
import { loginUser, registerUser } from '../api/auth'

function LoginPage({ initialMode, onBack, onLogin }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const isSignup = mode === 'signup'
  const submitLabel = loading
    ? isSignup ? 'Creating account...' : 'Signing in...'
    : isSignup ? 'Create account' : 'Sign in'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    } 
        setLoading(true)

        try {
          let result
          const cleanEmail = email.trim()

          if (isSignup) {
            await registerUser(cleanEmail, fullName.trim(), password)
            result = await loginUser(cleanEmail, password)
          } else {
            result = await loginUser(cleanEmail, password)
          }

          if (result.access_token) {
            onLogin()
            return
          }

          setError('Login failed. Please check your details.')
        } catch (requestError) {
          setError(requestError.message || 'Something went wrong. Please try again.')
        } finally {
          setLoading(false)
        }
      
      }  
  return (
    <main className="login-page">
      <button className="login-back-button" onClick={onBack} type="button">
        <span aria-hidden="true">&larr;</span>
        Back to home
      </button>

      <section className="login-container">
        <aside className="login-side-panel">
          <div className="login-brand">
            <Logo />
          </div>

          <div className="login-mode-switch">
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
              type="button"
            >
              Sign in
            </button>
            <button
              className={isSignup ? 'active' : ''}
              onClick={() => setMode('signup')}
              type="button"
            >
              Sign up
            </button>
          </div>

          <div className="login-side-copy">
            <p className="login-kicker">StudyPilot</p>
            <h2>
              {isSignup
                ? 'Start your focused study workspace.'
                : 'Pick up where you left off.'}
            </h2>
            <p>
              Turn PDFs into summaries, flashcards, exams, and study plans without jumping between tools.
            </p>
            <ul className="login-benefit-list">
              <li>PDF library</li>
              <li>AI summary and flashcards</li>
              <li>Practice score history</li>
            </ul>
          </div>
        </aside>

        <div className="login-main-panel">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-card-brand">
              <Logo />
            </div>

            <div className="login-inline-switch">
              <button
                className={mode === 'login' ? 'active' : ''}
                type="button"
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
              <button
                className={isSignup ? 'active' : ''}
                type="button"
                onClick={() => setMode('signup')}
              >
                Sign up
              </button>
            </div>

            <div className="login-user-icon" aria-hidden="true">
              <span />
            </div>

            <div className="login-form-heading">
              <p className="login-kicker">{isSignup ? 'Get started' : 'Welcome back'}</p>
              <h1>{isSignup ? 'Create account' : 'Welcome'}</h1>
              <p>
                {isSignup
                  ? 'Create your account to start using StudyPilot.'
                  : 'Sign in to continue to your dashboard.'}
              </p>
            </div>

            {isSignup && (
              <label className="login-field">
                <span>Full name</span>
                <input
                  autoComplete="name"
                  name="name"
                  placeholder="Your full name"
                  required
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </label>
            )}

            <label className="login-field">
              <span>Email address</span>
              <input
                autoComplete="email"
                name="email"
                placeholder="student@example.com"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <input
                autoComplete="current-password"
                name="password"
                placeholder={isSignup ? 'Create a password' : 'Enter your password'}
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {isSignup && (
              <label className="login-field">
                <span>Confirm password</span>
                <input
                  autoComplete="new-password"
                  name="confirmPassword"
                  placeholder="Enter your password again"
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>
            )}
            {error && <p className="form-error">{error}</p>}
            <div className="login-options">
              {isSignup ? (
                <p className="signup-terms">Your account will use the backend JWT auth flow.</p>
              ) : (
                <button className="forgot-button" type="button">
                  Forgot password?
                </button>
              )}
              <button className="login-submit-button" disabled={loading} type="submit">
                {submitLabel}
              </button>
            </div>

            <p className="login-switch-copy">
              {isSignup ? 'Already have an account?' : 'New to StudyPilot?'}
              <button
                type="button"
                onClick={() => setMode(isSignup ? 'login' : 'signup')}
              >
                {isSignup ? 'Sign in' : 'Create account'}
              </button>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}

export default LoginPage

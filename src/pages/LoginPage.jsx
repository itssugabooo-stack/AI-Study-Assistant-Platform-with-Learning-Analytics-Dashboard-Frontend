import { useState } from 'react'
import Logo from '../components/Logo'
import { login, register } from '../services/api'

function LoginPage({ initialMode, onBack, onLoginSuccess }) {
  const [mode, setMode] = useState(initialMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isSignup = mode === 'signup'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (isSignup && password !== confirmPassword) {
      setError('Passwords must match.')
      return
    }

    try {
      setLoading(true)
      const result = isSignup
        ? await register(fullName, email, password)
        : await login(email, password)

      const token = result?.access_token
      if (!token) {
        throw new Error('Unable to authenticate. Please try again.')
      }

      onLoginSuccess(token)
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
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
              Login
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
            <p className="login-kicker">Learn with direction</p>
            <h2>
              {isSignup
                ? 'Build better study habits from day one.'
                : 'Your progress, ready when you are.'}
            </h2>
          </div>
        </aside>

        <div className="login-main-panel">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-user-icon" aria-hidden="true">
              <span />
            </div>

            <div className="login-form-heading">
              <p className="login-kicker">{isSignup ? 'Get started' : 'Welcome back'}</p>
              <h1>{isSignup ? 'Sign up' : 'Login'}</h1>
              <p>
                {isSignup
                  ? 'Create your account and begin learning with direction.'
                  : 'Sign in to continue your StudyPilot journey.'}
              </p>
            </div>

            {isSignup && (
              <label className="login-field">
                <span>Full name</span>
                <input
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                  required
                  type="text"
                />
              </label>
            )}

            <label className="login-field">
              <span>Email address</span>
              <input
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="student@example.com"
                required
                type="email"
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <input
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isSignup ? 'Create a password' : 'Enter your password'}
                required
                type="password"
              />
            </label>

            {isSignup && (
              <label className="login-field">
                <span>Confirm password</span>
                <input
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter your password again"
                  required
                  type="password"
                />
              </label>
            )}

            {error && <p className="form-error">{error}</p>}

            <div className="login-options">
              {isSignup ? (
                <p className="signup-terms">By joining, you agree to our terms.</p>
              ) : (
                <button className="forgot-button" type="button">
                  Forgot password?
                </button>
              )}
              <button className="login-submit-button" type="submit" disabled={loading}>
                {loading ? 'Processing…' : isSignup ? 'Create account' : 'Login'}
              </button>
            </div>
          </form>

          <div className="login-social-footer">
            <span>Or {isSignup ? 'sign up' : 'login'} with</span>
            <button type="button"><strong>G</strong> Google</button>
            <button type="button"><strong>f</strong> Facebook</button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LoginPage

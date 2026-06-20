import { useState } from 'react'
import Logo from '../components/Logo'
import { loginUser, registerUser} from '../api/auth'

function LoginPage({ initialMode, onBack, onLogin }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const[fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const isSignup = mode === 'signup'

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

          if (isSignup) {
            await registerUser(email, fullName, password)
            result = await loginUser(email, password)
          } else {
            result = await loginUser(email, password)
          }

          setLoading(false)

          if (result.access_token) {
            onLogin()
            return
          }

          setError('Login failed. Please check your details.')
        } catch {
          setLoading(false)
          setError('Something went wrong. Please try again.')
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
                <p className="signup-terms">By joining, you agree to our terms.</p>
              ) : (
                <button className="forgot-button" type="button">
                  Forgot password?
                </button>
              )}
              <button className="login-submit-button" disabled={loading} type="submit">
                {loading ? 'Processing...' : isSignup ? 'Create account' : 'Login'}
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

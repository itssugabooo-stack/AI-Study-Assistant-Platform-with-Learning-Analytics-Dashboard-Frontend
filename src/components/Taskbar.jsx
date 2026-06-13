import Logo from './Logo'

function Taskbar({ onLogin, onNavigate, onSignup }) {
  return (
    <header className="taskbar">
      <button className="brand" onClick={() => onNavigate('home')}>
        <Logo />
      </button>

      <nav aria-label="Main navigation">
        <a href="#features">Features</a>
        <a href="#how-it-works">How it works</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>

      <div className="taskbar-actions">
        <button onClick={onLogin}>Login</button>
        <button className="taskbar-signup" onClick={onSignup}>Sign up</button>
      </div>
    </header>
  )
}

export default Taskbar

function ThemeToggle({ theme, onToggleTheme }) {
  const target = theme === 'night' ? 'light' : 'dark'
  const label = `Switch to ${target} mode`

  return (
    <button
      className="sp-button sp-secondary sp-theme-toggle"
      type="button"
      aria-label={label}
      title={label}
      data-target-theme={target}
      onClick={onToggleTheme}
    >
      <span className="sp-theme-symbol" aria-hidden="true">
        <span className="sp-theme-icon sp-theme-sun" />
        <span className="sp-theme-icon sp-theme-moon" />
      </span>
    </button>
  )
}

export default ThemeToggle

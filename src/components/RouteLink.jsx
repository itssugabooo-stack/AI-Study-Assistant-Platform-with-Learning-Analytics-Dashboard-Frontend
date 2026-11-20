import { navigateTo } from '../routes'

function RouteLink({ to, onNavigate, children, ...props }) {
  function handleClick(event) {
    if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    event.preventDefault()
    onNavigate?.()
    navigateTo(to)
  }

  return <a {...props} href={to} onClick={handleClick}>{children}</a>
}

export default RouteLink

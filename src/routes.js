export const workspacePaths = {
  dashboard: '/dashboard',
  library: '/library',
  practice: '/practice',
  'study-plan': '/study-plan',
}

const workspacePages = new Map(Object.entries(workspacePaths).map(([page, path]) => [path, page]))
const documentTools = ['summary', 'flashcards', 'quiz', 'roadmap']
const navigationEvent = 'studypilot:navigate'

export function readRoute(url) {
  const pathname = url.pathname.replace(/\/+$/, '') || '/'

  if (pathname === '/' || pathname === '/index.html') return { page: 'home' }
  if (pathname === '/sign-in' || pathname === '/sign-up') {
    return { page: 'login', mode: pathname === '/sign-up' ? 'signup' : 'login' }
  }

  const workspacePage = workspacePages.get(pathname)
  if (workspacePage) return { page: workspacePage, workspace: true }

  const documentMatch = pathname.match(/^\/library\/([1-9]\d*)(\/text)?$/)
  if (documentMatch) {
    const tool = documentMatch[2] ? 'summary' : url.searchParams.get('tool')
    return {
      page: 'document-workspace',
      workspace: true,
      documentId: documentMatch[1],
      tool: documentTools.includes(tool) ? tool : 'summary',
    }
  }

  return { page: 'not-found' }
}

export function documentPath(documentId, tool = 'summary') {
  const path = `/library/${encodeURIComponent(documentId)}`
  return tool === 'summary' ? path : `${path}?tool=${encodeURIComponent(tool)}`
}

export function authPath(mode, next) {
  const path = mode === 'signup' ? '/sign-up' : '/sign-in'
  return next ? `${path}?${new URLSearchParams({ next })}` : path
}

export function readReturnPath(url) {
  const next = url.searchParams.get('next')
  if (!next?.startsWith('/') || next.startsWith('//') || next.includes('\\')) return null
  const target = new URL(next, url.origin)
  return target.origin === url.origin && readRoute(target).workspace
    ? target.pathname + target.search
    : null
}

export function getLocation() {
  return window.location.href
}

export function subscribeToLocation(onChange) {
  window.addEventListener('popstate', onChange)
  window.addEventListener('hashchange', onChange)
  window.addEventListener(navigationEvent, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener(navigationEvent, onChange)
  }
}

export function navigateTo(path, { replace = false, state = null } = {}) {
  const target = new URL(path, window.location.origin)
  if (target.href === getLocation()) return
  if (replace) window.history.replaceState(state, '', target)
  else window.history.pushState(state, '', target)
  window.dispatchEvent(new Event(navigationEvent))
}

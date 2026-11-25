import { guidedStudyEnabled } from './guidedStudyFlag.js'

export const workspacePaths = {
  dashboard: '/dashboard',
  library: '/library',
  practice: '/practice',
  'study-plan': '/study-plan',
}

const workspacePages = new Map(Object.entries(workspacePaths).map(([page, path]) => [path, page]))
const documentTools = ['summary', 'flashcards', 'quiz', 'roadmap']
const navigationEvent = 'studypilot:navigate'

const readId = (value) => /^[1-9]\d*$/.test(value ?? '') ? value : null

export function readRoute(url, guided = guidedStudyEnabled) {
  const pathname = url.pathname.replace(/\/+$/, '') || '/'

  if (pathname === '/' || pathname === '/index.html') return { page: 'home' }
  if (pathname === '/sign-in' || pathname === '/sign-up') {
    return { page: 'login', mode: pathname === '/sign-up' ? 'signup' : 'login' }
  }

  const workspacePage = workspacePages.get(pathname)
  if (workspacePage) return { page: workspacePage, workspace: true }

  const documentMatch = pathname.match(/^\/library\/([1-9]\d*)(\/text)?$/)
  if (documentMatch) {
    const requested = documentMatch[2] ? 'summary' : url.searchParams.get('tool')
    const study = guided && (requested === null || requested === 'study')
    const sectionId = readId(url.searchParams.get('section'))
    return {
      page: 'document-workspace',
      workspace: true,
      documentId: documentMatch[1],
      tool: study ? 'study' : documentTools.includes(requested) ? requested : 'summary',
      ...(study ? { sectionId, partId: sectionId ? readId(url.searchParams.get('part')) : null } : {}),
    }
  }

  return { page: 'not-found' }
}

export function documentPath(documentId, tool, guided = guidedStudyEnabled) {
  const path = `/library/${encodeURIComponent(documentId)}`
  return !tool || (tool === 'summary' && !guided) ? path : `${path}?tool=${encodeURIComponent(tool)}`
}

export function studyPath(documentId, sectionId, partId) {
  const query = new URLSearchParams({ tool: 'study' })
  if (sectionId != null) {
    query.set('section', sectionId)
    if (partId != null) query.set('part', partId)
  }
  return `${documentPath(documentId)}?${query}`
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

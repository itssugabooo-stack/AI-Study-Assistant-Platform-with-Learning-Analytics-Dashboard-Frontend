function showOpeningMessage(tab) {
  try {
    const placeholder = tab.document
    if (placeholder.URL !== 'about:blank') return
    placeholder.title = 'Opening PDF...'
    if (placeholder.body) placeholder.body.textContent = 'Opening PDF...'
  } catch {
    // The placeholder is optional if its document is inaccessible.
  }
}

export async function openPdf(loadPdf, signal, page) {
  if (signal.aborted) return 'cancelled'

  // Reserve the tab in the click handler, before awaiting the authenticated fetch.
  let tab
  try {
    tab = window.open('about:blank', '_blank')
  } catch {
    return 'blocked'
  }
  if (!tab) return 'blocked'
  if (tab.closed) return 'closed'

  const request = new AbortController()
  let watcher
  let objectUrl
  let opened = false

  function release() {
    if (watcher !== undefined) {
      clearInterval(watcher)
      watcher = undefined
    }
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      objectUrl = undefined
    }
  }

  function cancel() {
    request.abort()
    release()
    if (!tab.closed) tab.close()
  }

  signal.addEventListener('abort', cancel, { once: true })
  try {
    // Keep our WindowProxy for cleanup without giving the PDF tab an opener.
    tab.opener = null
    showOpeningMessage(tab)
    watcher = setInterval(() => {
      if (!tab.closed) return
      if (opened) release()
      else cancel()
    }, 500)

    const pdf = await loadPdf({ signal: request.signal })
    if (signal.aborted) return 'cancelled'
    if (tab.closed) return 'closed'
    if (!(pdf instanceof Blob) || !pdf.size || pdf.type.split(';')[0].trim() !== 'application/pdf') {
      return 'failed'
    }

    objectUrl = URL.createObjectURL(pdf)
    const fragment = Number.isSafeInteger(page) && page > 0 ? `#page=${page}` : ''
    tab.location.replace(objectUrl + fragment)
    opened = true
    return 'opened'
  } catch (error) {
    if (signal.aborted) return 'cancelled'
    if (tab.closed) return 'closed'
    if (error?.status === 409) return 'missing'
    if (error?.status === 404) return 'unavailable'
    if (error?.status === 401) return 'unauthorized'
    return 'failed'
  } finally {
    signal.removeEventListener('abort', cancel)
    // A loaded viewer keeps its URL even if the workspace unmounts.
    if (!opened) cancel()
  }
}

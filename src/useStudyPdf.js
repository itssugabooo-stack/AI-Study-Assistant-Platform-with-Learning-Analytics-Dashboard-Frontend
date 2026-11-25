import { useCallback, useEffect, useRef, useState } from 'react'
import { getDocumentPdf } from './api/documents'
import { openPdf } from './openPdf'

export default function useStudyPdf(documentId) {
  const request = useRef(null)
  const [status, setStatus] = useState(null)
  useEffect(() => () => request.current?.abort(), [])

  const open = useCallback(async (page) => {
    if (request.current) return
    const controller = new AbortController()
    request.current = controller
    setStatus({ result: 'loading', page })
    const result = await openPdf((options) => getDocumentPdf(documentId, options), controller.signal, page)
    request.current = null
    if (!controller.signal.aborted) setStatus({ result, page })
  }, [documentId])

  return { open, status, loading: status?.result === 'loading' }
}

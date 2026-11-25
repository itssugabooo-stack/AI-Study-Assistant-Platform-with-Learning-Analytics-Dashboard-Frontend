import useStudyPdf from '../useStudyPdf'

const messages = {
  blocked: 'The browser blocked the PDF tab. Allow pop-ups and try again.',
  closed: 'The PDF tab closed before the file opened. Try again.',
  missing: 'The original PDF is unavailable. You can still use the excerpt here.',
  unauthorized: 'Sign in again to open this PDF.',
  unavailable: 'This PDF is not available to your account.',
  failed: 'We could not open this PDF. Try again.',
}

export function StudyPdfStatus({ status, page }) {
  if (!status || status.page !== page) return null
  if (status.result === 'loading') return <p role="status">Opening PDF...</p>
  if (status.result === 'opened' && page) {
    return <p className="sp-muted" role="status">If the viewer starts at the beginning, go to page {page}.</p>
  }
  const message = messages[status.result]
  return message && <p className="sp-error" role="alert">{message}{page ? ` Source: page ${page}.` : ''}</p>
}

export function StudySource({ source, documentId }) {
  const pdf = useStudyPdf(documentId)
  if (!source) return null
  return (
    <figure className="sp-study-source">
      <figcaption>
        <strong>Source / Page {source.page}</strong>
        <button className="sp-text-button" type="button" title="Opens in a new tab" onClick={() => pdf.open(source.page)} disabled={pdf.loading}>
          Open PDF page <span aria-hidden="true">&#8599;</span>
        </button>
      </figcaption>
      <blockquote>{source.quote}</blockquote>
      <StudyPdfStatus status={pdf.status} page={source.page} />
    </figure>
  )
}

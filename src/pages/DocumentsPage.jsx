import { useEffect, useRef, useState } from 'react'
import { getDocuments, uploadDocument } from '../api/documents'
import ResourceState from '../components/ResourceState'
import RouteLink from '../components/RouteLink'
import { documentPath } from '../routes'
import useResource from '../useResource'

const filters = [
  ['all', 'All'],
  ['ready', 'Text ready'],
  ['pending', 'Text unavailable'],
]

function DocumentsPage({ showUploadInitially }) {
  const resource = useResource(getDocuments)
  const [uploaded, setUploaded] = useState([])
  const [showUpload, setShowUpload] = useState(showUploadInitially)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadNotice, setUploadNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const fileInput = useRef(null)
  const uploadButton = useRef(null)
  const isUploading = useRef(false)

  useEffect(() => {
    if (!showUpload && !uploadNotice) return
    const frame = requestAnimationFrame(() => {
      if (showUpload) fileInput.current?.focus()
      else uploadButton.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [showUpload, uploadNotice])

  const listed = Array.isArray(resource.data) ? resource.data : resource.data?.documents ?? []
  const documents = [...uploaded, ...listed.filter((doc) => !uploaded.some((newDoc) => newDoc.id === doc.id))]
  const search = query.trim().toLowerCase()
  const visible = documents.filter((doc) => (
    doc.original_filename?.toLowerCase().includes(search)
    && (filter === 'all' || Boolean(doc.has_extracted_text) === (filter === 'ready'))
  ))

  function chooseFile(event) {
    const selection = event.target.files[0]
    setUploadError('')
    setUploadNotice('')
    setFile(null)
    if (!selection) return

    if (selection.type !== 'application/pdf' && !selection.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Choose a PDF file.')
      event.target.value = ''
    } else if (selection.size > 10 * 1024 * 1024) {
      setUploadError('Choose a PDF that is 10 MB or smaller.')
      event.target.value = ''
    } else {
      setFile(selection)
    }
  }

  async function handleUpload(event) {
    event.preventDefault()
    if (!file || isUploading.current) return
    isUploading.current = true
    setUploading(true)
    setUploadError('')
    setUploadNotice('')

    try {
      const document = await uploadDocument(file)
      setUploaded((previous) => [document, ...previous.filter((item) => item.id !== document.id)])
      setQuery('')
      setFilter('all')
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
      setShowUpload(false)
      setUploadNotice('PDF uploaded. You can open it from the library.')
    } catch (error) {
      setUploadError(error.message)
    } finally {
      isUploading.current = false
      setUploading(false)
    }
  }

  return (
    <div className="sp-page">
      <header className="sp-page-heading">
        <div><h1>Library</h1><p>Find a PDF and open its study workspace.</p></div>
        <button ref={uploadButton} className="sp-button sp-primary" type="button" aria-expanded={showUpload} aria-controls="library-upload" onClick={() => setShowUpload(!showUpload)} disabled={uploading}>+ Upload PDF</button>
      </header>

      <form id="library-upload" className="sp-upload" onSubmit={handleUpload} hidden={!showUpload}>
        <h2>Upload a PDF</h2>
        <label className="sp-field">
          PDF file <span className="sp-muted">Up to 10 MB</span>
          <input ref={fileInput} type="file" accept=".pdf,application/pdf" required onChange={chooseFile} disabled={uploading} />
        </label>
        {uploadError && <p className="sp-error" role="alert">{uploadError}</p>}
        {uploading && <p className="sp-status" role="status">Uploading your PDF…</p>}
        <button type="submit" className="sp-button sp-primary" disabled={!file || uploading}>{uploading ? 'Uploading…' : uploadError ? 'Retry upload' : 'Add to library'}</button>
      </form>
      <p className="sp-visually-hidden" role="status">{uploadNotice}</p>

      <section className="sp-section" aria-labelledby="library-title">
        <div className="sp-section-heading">
          <div><h2 id="library-title">Your PDFs</h2>{resource.status === 'success' && <p>{documents.length} {documents.length === 1 ? 'document' : 'documents'}</p>}</div>
          {documents.length > 0 && (
            <div className="sp-filters">
              <label className="sp-field"><span className="sp-visually-hidden">Search PDFs</span><input type="search" placeholder="Search PDFs" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
              <label className="sp-field">
                <span className="sp-visually-hidden">Filter by text availability</span>
                <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                  {filters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>
          )}
        </div>
        <ResourceState resource={resource} loading="Loading your PDFs…" failure="We couldn’t load your library." />
        {resource.status === 'success' && documents.length === 0 && (
          <div className="sp-empty"><h3>No PDFs yet</h3><p>Upload your first PDF to start studying.</p></div>
        )}
        {documents.length > 0 && visible.length === 0 && (
          <div className="sp-empty"><h3>No matching PDFs</h3><button className="sp-text-button" type="button" onClick={() => { setQuery(''); setFilter('all') }}>Clear filters</button></div>
        )}
        <ul className="sp-document-list">
          {visible.map((doc) => (
            <li key={doc.id}>
              <span className="sp-file-mark" aria-hidden="true">PDF</span>
              <div className="sp-document-info">
                <h3>{doc.original_filename}</h3>
                <p>{doc.has_extracted_text ? 'Text ready' : 'Text unavailable'}</p>
              </div>
              <RouteLink className="sp-button sp-secondary" to={documentPath(doc.id)} aria-label={`Open workspace for ${doc.original_filename}`}>Open workspace <span aria-hidden="true">→</span></RouteLink>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default DocumentsPage

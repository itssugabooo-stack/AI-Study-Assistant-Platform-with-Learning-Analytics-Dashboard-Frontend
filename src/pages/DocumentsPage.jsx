import { useEffect, useRef, useState } from 'react'
import Logo from '../components/Logo'
import { getDocuments, uploadDocument } from '../api/documents'

const libraryNavItems = [
  { label: 'Overview', page: 'dashboard' },
  { label: 'My Library', page: 'library' },
  { label: 'Practice', page: 'practice' },
  { label: 'AI Tutor', page: 'ai-tutor' },
  { label: 'Study Plan', page: 'study-plan' },
]

function DocumentsPage({ onNavigate, onOpenDocument, onToggleTheme, theme }) {
    const uploadFormRef = useRef(null)
    const fileInputRef = useRef(null)
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [documentFilter, setDocumentFilter] = useState('all')

  
    useEffect(() => {
        async function loadDocuments(){
            try {
                const data =await getDocuments()
                setDocuments(Array.isArray(data) ? data : data.documents ?? [])
            } catch (requestError) {
                setError(requestError.message)
            }finally {
                setLoading(false)
            }
        }
        loadDocuments()
    }, [])

        function handleStartUpload() {
            uploadFormRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            })
            fileInputRef.current?.click()
        }

        function handleFileChange(event) {
            const file = event.target.files[0] ?? null

            if (!file) {
                setSelectedFile(null)
                return
            }

            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            const isTooLarge = file.size > 10 * 1024 * 1024

            if (!isPdf) {
                setSelectedFile(null)
                setUploadError('Please choose a PDF file.')
                event.target.value = ''
                return
            }

            if (isTooLarge) {
                setSelectedFile(null)
                setUploadError('PDF must be 10 MB or smaller.')
                event.target.value = ''
                return
            }

            setSelectedFile(file)
            setUploadError('')
        }

        async function handleUpload(event) {
            event.preventDefault()

            if (!selectedFile) {
                setUploadError('')
                fileInputRef.current?.click()
                return
            }
            setUploading(true)
            setUploadError('')

            try {
                const newDocument =await uploadDocument(selectedFile)
                setDocuments((currentDocuments) =>
                [
                    newDocument,
                    ...currentDocuments,
                ])
                setSelectedFile(null)
                setError('')
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            }catch (requestError) {
                setUploadError(requestError.message)

            } finally{
                setUploading(false)
            }
        }
    return( 
        <div className='library-screen'>
            <header className="dashboard-appbar">
                <button className="dashboard-brand" type="button" onClick={() => onNavigate('dashboard')}>
                    <Logo />
                </button>

                <nav className="dashboard-nav" aria-label="Library navigation">
                    {libraryNavItems.map((item) => (
                        <button
                            className={item.page === 'library' ? 'active' : ''}
                            key={item.page}
                            type="button"
                            onClick={() => onNavigate(item.page)}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="dashboard-user-menu">
                    <button
                        aria-label={`Switch to ${theme === 'day' ? 'night' : 'day'} mode`}
                        className="theme-toggle-button"
                        type="button"
                        onClick={onToggleTheme}
                    >
                        <span className="theme-toggle-track">
                            <span className="theme-toggle-thumb">{theme === 'day' ? '☀' : '☾'}</span>
                        </span>
                    </button>
                    <button type="button" onClick={handleStartUpload}>
                        Upload
                    </button>
                </div>
            </header>

            <main className='dashboard-content library-page'>
                <section className="library-hero">
                    <div>
                        <p className="dashboard-kicker">My Library</p>
                        <h1>Your study materials</h1>
                        <p>Upload PDFs and open a workspace to generate summaries, flashcards, quizzes, and roadmaps.</p>
                    </div>

                    <article>
                        <span>Total documents</span>
                        <strong>{documents.length}</strong>
                        <p>{documents.length === 1 ? 'PDF uploaded' : 'PDFs uploaded'}</p>
                    </article>
                </section>

                <section className="library-layout-grid">
                    <form className="library-upload-card" ref={uploadFormRef} onSubmit={handleUpload}>
                    <div>
                        <p className="dashboard-kicker">Upload</p>
                        <h2>Add a PDF</h2>
                        <p>PDF only. Max file size from backend: 10 MB.</p>
                    </div>

                    <label className="library-file-picker" htmlFor="library-pdf-upload">
                        <span>{selectedFile ? 'Selected file' : 'Choose a PDF'}</span>
                        <strong>{selectedFile ? selectedFile.name : 'Click to browse'}</strong>
                        <input 
                            id="library-pdf-upload"
                            ref={fileInputRef}
                            accept="application/pdf"
                            type="file"
                            onChange={handleFileChange}
                             />

                    </label>

                    <button disabled={uploading} type="submit">
                        {uploading ? 'Uploading...' : selectedFile ? 'Upload PDF' : 'Choose PDF'}

                    </button>
                    {uploadError && <p className="dashboard-message dashboard-error">{uploadError}</p>}
                </form>

                <section className="library-document-panel">
                    <header>
                        <div>
                            <p className="dashboard-kicker">Documents</p>
                            <h2>Your PDFs</h2>
                        </div>
                        <span>{documents.length} total</span>
                    </header>

                    {loading && <p className="dashboard-message">Loading documents...</p>}
                    {error && <p className="dashboard-message dashboard-error">{error}</p>}
                    {!loading && !error && documents.length === 0 && (
                        <div className="library-empty-state">
                            <h3>No documents yet</h3>
                            <p>Upload your first PDF to start using the AI workspace.</p>
                        </div>
                        )}

                {documents.length > 0 && (
                    <div className="library-document-tools">
                        <label className="library-search-field">
                            <span>Search</span>
                            <input
                                placeholder="Search PDF name..."
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                            />
                        </label>

                        <div className="library-filter-tabs" aria-label="Filter documents">
                            <button
                                className={documentFilter === 'all' ? 'active' : ''}
                                type="button"
                                onClick={() => setDocumentFilter('all')}
                            >
                                All
                                <span>{documents.length}</span>
                            </button>
                            <button
                                className={documentFilter === 'ready' ? 'active' : ''}
                                type="button"
                                onClick={() => setDocumentFilter('ready')}
                            >
                                Text ready
                                <span>{documents.filter((studyDocument) => studyDocument.has_extracted_text).length}</span>
                            </button>
                            <button
                                className={documentFilter === 'pending' ? 'active' : ''}
                                type="button"
                                onClick={() => setDocumentFilter('pending')}
                            >
                                Pending
                                <span>{documents.filter((studyDocument) => !studyDocument.has_extracted_text).length}</span>
                            </button>
                        </div>
                    </div>
                )}

                {documents.length > 0 && documents.filter((studyDocument) => {
                    const matchesSearch = studyDocument.original_filename
                        ?.toLowerCase()
                        .includes(searchQuery.trim().toLowerCase())

                    if (documentFilter === 'ready') {
                        return matchesSearch && studyDocument.has_extracted_text
                    }

                    if (documentFilter === 'pending') {
                        return matchesSearch && !studyDocument.has_extracted_text
                    }

                    return matchesSearch
                }).length === 0 && (
                    <div className="library-empty-state">
                        <h3>No matching PDFs</h3>
                        <p>Try another filename or change the filter.</p>
                        <button
                            className="library-clear-filter"
                            type="button"
                            onClick={() => {
                                setSearchQuery('')
                                setDocumentFilter('all')
                            }}
                        >
                            Clear search
                        </button>
                    </div>
                )}

                {documents.length > 0 && (
                    <div className="library-document-list">
                        {documents.filter((studyDocument) => {
                            const matchesSearch = studyDocument.original_filename
                                ?.toLowerCase()
                                .includes(searchQuery.trim().toLowerCase())

                            if (documentFilter === 'ready') {
                                return matchesSearch && studyDocument.has_extracted_text
                            }

                            if (documentFilter === 'pending') {
                                return matchesSearch && !studyDocument.has_extracted_text
                            }

                            return matchesSearch
                        }).map((studyDocument) => 
                            <article className="library-document-card" key={studyDocument.id}>
                                <div>
                                    <span>{studyDocument.has_extracted_text ? 'Text ready' : 'Text pending'}</span>
                                    <h3>{studyDocument.original_filename}</h3>
                                    <p>Status: {studyDocument.processing_status}</p>
                                </div>
                                <button type="button" onClick={() => onOpenDocument(studyDocument.id)}>
                                    Open workspace
                                </button>
                            </article>
                        )}
                    </div>
                )}
                </section>
                </section>
            </main>

        </div>
    )}

export default DocumentsPage

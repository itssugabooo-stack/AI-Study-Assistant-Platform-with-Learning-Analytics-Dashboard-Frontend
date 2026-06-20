import Sidebar from '../components/Sidebar'
import { useEffect, useState } from 'react'
import { getDocuments, uploadDocument } from '../api/documents'

function DocumentsPage({ onNavigate, onOpenDocument }) {
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')

  
    useEffect(() => {
        async function loadDocuments(){
            try {
                const data =await getDocuments()
                setDocuments(data)
            } catch (requestError) {
                setError(requestError.message)
            }finally {
                setLoading(false)
            }
        }
        loadDocuments()
    }, [])
        async function handleUpload(event) {
            event.preventDefault()

            if (!selectedFile) {
                setUploadError('Please select a PDF')
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
            }catch (requestError) {
                setUploadError(requestError.message)

            } finally{
                setUploading(false)
            }
        }
    return( 
        <div className='dashboard-layout'>
            <Sidebar onNavigate={onNavigate}/>

            <main className='dashboard-content'>
                <h1>
                    My library
                </h1>

                <form onSubmit={handleUpload}>
                    <label>
                        <span>
                            Choose a PDF
                        </span>
                        <input 
                            accept="application/pdf"
                            type="file"
                            onChange={(event) => {
                                setSelectedFile(event.target.files[0] ?? null)
                                setUploadError('')
                            }}
                             />

                    </label>

                    <button disabled={!selectedFile || uploading} type="submit">
                        {uploading ? 'Uploading...' : 'upload PDF'}

                    </button>
                </form>
                {uploadError && <p>{uploadError}</p>}
                {
                    loading && <p>
                        Loading documents...
                    </p>
                }
                
                    {error && <p>{error}</p>}
                    {!loading && !error && documents.length === 0 && (
                        <p>No documents yet. Upload your first PDF.</p>
                        )}

                {documents.length > 0 && (
                    <section>
                        {documents.map((document) => 
                            <article key={document.id}>
                                <h2>
                                    {document.original_filename}
                                </h2>
                                <p>
                                    Status: {document.processing_status}
                                </p>
                                <button type="button" onClick={() => onOpenDocument(document.id)}>
                                    Open Document
                                </button>
                            </article>
                        )}
                    </section>
                )}
            </main>

        </div>
    )}

export default DocumentsPage
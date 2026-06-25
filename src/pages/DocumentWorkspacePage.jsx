import Sidebar from "../components/Sidebar";
import { useEffect,  useState} from 'react'
import {getDocument, getDocumentText} from '../api/documents'
import { generateSummary, generateFlashcards } from '../api/ai'


function DocumentWorkspacePage({documentId, onNavigate}) {
    const [document, setDocument] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [documentText, setDocumentText] = useState(null)
    const [summary, setSummary] = useState('')
    const [summaryLoading, setSummaryLoading] = useState(false)
    const [summaryError, setSummaryError] = useState('')
    const [flashcards, setFlashcards] = useState([])
    const [flashcardsLoading, setFlashcardsLoading] = useState(false)
    const [flashcardsError, setFlashcardsError] = useState('')

    useEffect(() =>{
        async function loadDocument() {
            try {
                const [documentData, textData] = await Promise.all([
                    getDocument(documentId),
                    getDocumentText(documentId),
                    ])

                    setDocument(documentData)
                    setDocumentText(textData)
            } catch (requestError) {
                setError(requestError.message)
            } finally{
                setLoading(false)
            }
        }
        loadDocument()
    }, [documentId])

    async function handleGenerateSummary() {
        setSummaryLoading(true)
        setSummaryError('')

        try {
            const data = await generateSummary(documentId)
            setSummary(data.summary)
        } catch (requestError) {
            setSummaryError(requestError.message)
        } finally {
            setSummaryLoading(false)
        }
        }

    async function handleGenerateFlashcards() {
        setFlashcardsLoading(true)
        setFlashcardsError('')

        try {
            const data = await generateFlashcards(documentId)
            setFlashcards(data.flashcards)
        } catch (requestError) {
            setFlashcardsError(requestError.message)
        } finally {
            setFlashcardsLoading(false)
        }
        }

    


    return (
        <div className="dashboard-layout">
            <Sidebar onNavigate={onNavigate} />

            <main className="dashboard-content">
                {documentText?.text && (
                    <section>
                        <h2>Extracted Text</h2>

                        

                        {documentText.truncated && (
                        <p>This is a shortened preview.</p>
                        )}

                        <pre style={{ whiteSpace: 'pre-wrap' }}>
                        {documentText.text}
                        </pre>
                    </section>
                )}
                {!loading && !error && !documentText?.text && (
                        <p>Extracted text is not available yet.</p>
                        )}

                {loading && <p>Loading document...</p>}
                {error && <p>{error}</p>}

                {document && (
                    <section>
                        <h2>
                            {document.original_filename}
                        </h2>
                        <p>
                            Status: {document.processing_status}
                        </p>
                        <p>
                            Extracted text:{document.has_extracted_text ? 'Available' : 'Not ready'}
                        </p>
                    </section>
                )}
                <h1>
                    Document Workspace
                </h1>
                <p>
                    Document ID : {documentId}
                </p>

                <section>
                    <h2>Summary</h2>

                    <button
                        disabled={summaryLoading}
                        type="button"
                        onClick={handleGenerateSummary}
                    >
                        {summaryLoading ? 'Generating...' : 'Generate Summary'}
                    </button>

                    {summaryError && <p>{summaryError}</p>}
                    {summary && <p>{summary}</p>}
                </section>

                <section>
                <h2>Flashcards</h2>

                <button
                    disabled={flashcardsLoading}
                    type="button"
                    onClick={handleGenerateFlashcards}
                >
                    {flashcardsLoading ? 'Generating...' : 'Generate Flashcards'}
                </button>

                {flashcardsError && <p>{flashcardsError}</p>}

                {flashcards.map((flashcard) => (
                    <article key={flashcard.question}>
                    <h3>{flashcard.question}</h3>
                    <p>{flashcard.answer}</p>
                    </article>
                ))}
                </section>

            </main>

        </div>
    )
}
export default DocumentWorkspacePage

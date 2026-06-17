import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { getDocuments, uploadDocument } from "../api/documents";

function DocumentsPage({ onLogout, onNavigate, onOpenDocument, user }) {
    const [documents, setDocuments] = useState([]);
    const [error, setError] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    async function loadDocuments() {
        try {
            setLoading(true);
            const data = await getDocuments();
            setDocuments(Array.isArray(data) ? data : data.documents ?? []);
        } catch (err) {
            setError(err.message || "Unable to load documents.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadDocuments();
    }, []);

    async function handleUpload(event) {
        event.preventDefault();

        if (!file) {
            setError("Choose a PDF first.");
            return;
        }

        try {
            setError("");
            setUploading(true);
            await uploadDocument(file);
            setFile(null);
            await loadDocuments();
        } catch (err) {
            setError(err.message || "Unable to upload document.");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="dashboard-layout">
            <Sidebar activePage="documents" onLogout={onLogout} onNavigate={onNavigate} user={user} />
            <main className="dashboard-content">
                <header className="page-header">
                    <div>
                        <p className="dashboard-eyebrow">Documents</p>
                        <h1>Study materials</h1>
                        <p>Upload PDFs and open a workspace for summaries, flashcards, quizzes, and text previews.</p>
                    </div>
                </header>

                <section className="upload-panel">
                    <form className="upload-form" onSubmit={handleUpload}>
                        <label className="form-group">
                            <span>PDF file</span>
                            <input
                                accept="application/pdf"
                                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                                type="file"
                            />
                        </label>
                        {error && <p className="form-error">{error}</p>}
                        <button className="primary-button" disabled={uploading} type="submit">
                            {uploading ? "Uploading..." : "Upload PDF"}
                        </button>
                    </form>

                    <div className="document-grid">
                        {loading && <p>Loading documents...</p>}
                        {!loading && documents.length === 0 && <p>No documents uploaded yet.</p>}
                        {documents.map((document) => (
                            <article className="document-card" key={document.id}>
                                <div>
                                    <strong>{document.original_filename}</strong>
                                    <span>{document.processing_status ?? "uploaded"}</span>
                                </div>
                                <button className="secondary-button" onClick={() => onOpenDocument(document)}>
                                    Open workspace
                                </button>
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default DocumentsPage;

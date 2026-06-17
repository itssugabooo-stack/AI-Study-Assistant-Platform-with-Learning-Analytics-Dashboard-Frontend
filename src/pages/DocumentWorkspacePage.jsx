import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { getDocumentText } from "../api/documents";

function DocumentWorkspacePage({ document, onLogout, onNavigate, user }) {
    const [error, setError] = useState("");
    const [textPreview, setTextPreview] = useState("");

    useEffect(() => {
        if (!document?.id) {
            return;
        }

        async function loadText() {
            try {
                const data = await getDocumentText(document.id);
                setTextPreview(data.text ?? "");
            } catch (err) {
                setError(err.message || "Unable to load text preview.");
            }
        }

        loadText();
    }, [document]);

    return (
        <div className="dashboard-layout">
            <Sidebar activePage="documents" onLogout={onLogout} onNavigate={onNavigate} user={user} />
            <main className="dashboard-content">
                <header className="page-header">
                    <div>
                        <p className="dashboard-eyebrow">Workspace</p>
                        <h1>{document?.original_filename ?? "Document workspace"}</h1>
                        <p>Generate and review AI study tools for this document.</p>
                    </div>
                    <button className="secondary-button" onClick={() => onNavigate("documents")}>
                        Back to documents
                    </button>
                </header>

                <section className="workspace-grid">
                    <article className="workspace-panel">
                        <div className="panel-heading">
                            <h2>Extracted text</h2>
                        </div>
                        {error && <p className="form-error">{error}</p>}
                        <p>{textPreview || "Text preview will appear here after processing."}</p>
                    </article>

                    <article className="workspace-panel">
                        <div className="panel-heading">
                            <h2>AI tools</h2>
                        </div>
                        <div className="document-list">
                            <button className="secondary-button">Generate summary</button>
                            <button className="secondary-button">Generate flashcards</button>
                            <button className="secondary-button">Generate quiz</button>
                            <button className="secondary-button">Generate roadmap</button>
                        </div>
                    </article>
                </section>
            </main>
        </div>
    );
}

export default DocumentWorkspacePage;

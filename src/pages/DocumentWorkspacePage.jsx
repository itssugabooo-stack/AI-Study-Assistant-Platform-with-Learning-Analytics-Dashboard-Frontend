import Sidebar from "../components/Sidebar";
function DocumentWorkspacePage({documentId, onNavigate}) {
    cconst [document, setDocument] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')


    return (
        <div className="dashboard-layout">
            <Sidebar onNavigate={onNavigate} />

            <main className="dashboard-content">
                <h1>
                    Document Workspace
                </h1>
                <p>
                    Document ID : {documentId}
                </p>

            </main>

        </div>
    )
}
export default DocumentWorkspacePage

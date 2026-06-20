import Sidebar from "../components/Sidebar";
function DocumentWorkspacePage({documentId, onNavigate}) {

    
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

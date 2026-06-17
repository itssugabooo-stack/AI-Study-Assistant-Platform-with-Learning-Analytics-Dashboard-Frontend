import Sidebar from "../components/Sidebar";

function FlashcardsPage({ onLogout, onNavigate, user }) {
    return (
        <div className="dashboard-layout">
            <Sidebar activePage="flashcards" onLogout={onLogout} onNavigate={onNavigate} user={user} />
            <main className="dashboard-content">
                <header className="page-header">
                    <div>
                        <p className="dashboard-eyebrow">Flashcards</p>
                        <h1>Saved flashcards</h1>
                        <p>Your saved study cards will appear here.</p>
                    </div>
                </header>

                <section className="flashcards-page-grid">
                    <article className="flashcard-card">
                        <p>No saved flashcards yet.</p>
                    </article>
                </section>
            </main>
        </div>
    );
}

export default FlashcardsPage;

import Sidebar from "../components/Sidebar";

function QuizHistoryPage({ onLogout, onNavigate, user }) {
    return (
        <div className="dashboard-layout">
            <Sidebar activePage="quiz-history" onLogout={onLogout} onNavigate={onNavigate} user={user} />
            <main className="dashboard-content">
                <header className="page-header">
                    <div>
                        <p className="dashboard-eyebrow">Quiz history</p>
                        <h1>Attempts</h1>
                        <p>Your submitted quiz attempts will appear here.</p>
                    </div>
                </header>

                <section className="attempt-list">
                    <article className="attempt-card">
                        <p>No quiz attempts yet.</p>
                    </article>
                </section>
            </main>
        </div>
    );
}

export default QuizHistoryPage;

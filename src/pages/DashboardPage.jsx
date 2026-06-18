import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { getMyAnalytics } from '../api/analytics'


function DashboardPage ({ onNavigate }) {

  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(()=> {
    async function loadAnalytics(
    ){const data = await getMyAnalytics()
      setAnalytics(data)
      setLoading(false)
    }
    loadAnalytics()
},[])

  return (
    <div className ="dashboard-layout"> 
    <Sidebar onNavigate={onNavigate} />
    <main className= "dashboard-content">
      <h1>Dashboard</h1>
      {loading && <p>Loading analytics...</p>}
      {analytics && (
      <section>
        <article>
          <h2>
            {analytics.total_documents}
          </h2>
          <p>
            Total documents
          </p>
        </article>
        <article>
          <h2>
            {
              analytics.total_flashcards
            }
          </h2>
          <p>
            Total flashcards
          </p>
        </article>
        <article>
          <h2>
            {
              analytics.total_quiz_attempts
            }
          </h2>
          <p>
            Quiz attempts
          </p>
        </article>
        <article>
          <h2>
            {
            analytics.average_score
            }%

          </h2>
          <p>
            Average score
          </p>
        </article>
        <article>
          <h2>{analytics.best_score}%</h2>
          <p>Best score</p>
        </article>
      </section>
    )}
    </main>

    </div>
  )
}
export default DashboardPage


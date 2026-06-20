import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { getMyAnalytics } from '../api/analytics'
import { getCurrentUser } from '../api/auth';


function DashboardPage ({ onNavigate }) {

  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)


  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [userData, analyticsData] = await Promise.all([
              getCurrentUser(),
              getMyAnalytics(),
            ])

            setUser(userData)
            setAnalytics(analyticsData)
      } catch {
        setError('Unable to load analytics.')
      } finally {
        setLoading(false)
      }
    }

  loadDashboardData()
}, [])

  return (
    <div className ="dashboard-layout"> 
    <Sidebar onNavigate={onNavigate} />
    <main className= "dashboard-content">
      <h1>Dashboard</h1>
      {user && <p> Welcome back, {user.full_name}!</p>}
      {loading && <p>Loading analytics...</p>}
      {error && <p>{error}</p>}
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


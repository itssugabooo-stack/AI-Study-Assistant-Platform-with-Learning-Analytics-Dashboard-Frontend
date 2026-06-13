
import Sidebar from '../components/Sidebar'

const metrics = [
  { label: 'Study Hours', value: '12' },
  { label: 'Quiz Average', value: '82%' },
  { label: 'Completed Lessons', value: '7' },
]

function DashboardPage({ onNavigate}) {
  return (
    <div className="dashboard-layout">
      <Sidebar onNavigate={onNavigate} /> 
      <main className="dashboard-content">
        <h1>Dashboard</h1>
        <section>
          {metrics.map((metric) => (
            <article key={metric.label}>
              <h2>{metric.value}</h2>
              <p>{metric.label}</p>
            </article>
          ))}
        </section>
      </main>
   </div>
  )
}

export default DashboardPage

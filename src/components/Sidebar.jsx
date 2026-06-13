const navigationItems = [
    { label: 'Overview', page: 'dashboard' },
  { label: 'My Library', page: 'library' },
  { label: 'Practice', page: 'practice' },
  { label: 'AI Tutor', page: 'ai-tutor' },
  { label: 'Study Plan', page: 'study-plan' },   
]
function Sidebar({ onNavigate }) {
    return (
        <aside className="sidebar">
           <h2>StudyPilot</h2>

           <nav>
            {
                navigationItems.map((item) => (
                    <button key = {item.page} onClick={() => onNavigate(item.page)}>
                        {item.label}
                    </button>
                ))
            }
           </nav>   
           </aside>
    )}
    export default Sidebar

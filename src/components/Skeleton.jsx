const rowCounts = { heading: 1, metrics: 4, list: 3 }

function Skeleton({ label, variant = 'list' }) {
  return (
    <div className={`sp-loading sp-loading-${variant}`}>
      <span className="sp-visually-hidden" role="status">{label}</span>
      {Array.from({ length: rowCounts[variant] }, (_, index) => (
        <div className="sp-skeleton-row" key={index} aria-hidden="true"><span /><span /></div>
      ))}
    </div>
  )
}

export default Skeleton

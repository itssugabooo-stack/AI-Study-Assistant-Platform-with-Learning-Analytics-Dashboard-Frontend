function RoadmapSteps({ steps }) {
  return (
    <ol className="sp-steps">
      {steps.map((step, index) => (
        <li key={`${step.title}-${index}`}>
          <span className="sp-step-number" aria-hidden="true">{index + 1}</span>
          <div><h3>{step.title}</h3><p>{step.description}</p></div>
        </li>
      ))}
    </ol>
  )
}

export default RoadmapSteps

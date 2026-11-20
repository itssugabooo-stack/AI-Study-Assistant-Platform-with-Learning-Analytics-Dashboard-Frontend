import Skeleton from './Skeleton'

function ResourceState({ resource, loading, failure, variant }) {
  if (resource.status === 'loading') return <Skeleton label={loading} variant={variant} />
  if (resource.status !== 'error') return null

  return (
    <div className="sp-resource-error">
      <p className="sp-error" role="alert">{failure}</p>
      <button className="sp-text-button" type="button" onClick={resource.retry}>Try again</button>
    </div>
  )
}

export default ResourceState

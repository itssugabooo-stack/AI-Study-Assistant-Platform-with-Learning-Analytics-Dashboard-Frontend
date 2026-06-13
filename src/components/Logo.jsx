import { useState } from 'react'

function Logo({ showName = true }) {
  const [imageMissing, setImageMissing] = useState(false)

  return (
    <span className="site-logo">
      {imageMissing ? (
        <span className="brand-mark" aria-hidden="true">S</span>
      ) : (
        <img
          alt="StudyPilot logo"
          className="site-logo-image"
          onError={() => setImageMissing(true)}
          src="/images/logo.jpg"
        />
      )}
      {showName && <span className="site-logo-name">StudyPilot</span>}
    </span>
  )
}

export default Logo

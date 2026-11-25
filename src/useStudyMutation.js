import { useEffect, useRef, useState } from 'react'

export default function useStudyMutation() {
  const request = useRef(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => () => request.current?.abort(), [])

  async function run(work) {
    if (request.current) return undefined
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setError(null)
    try {
      const value = await work({ signal: controller.signal })
      return controller.signal.aborted ? undefined : value
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure)
      return undefined
    } finally {
      request.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }

  return { pending, error, run }
}

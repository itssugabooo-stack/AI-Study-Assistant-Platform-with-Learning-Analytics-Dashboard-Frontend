import { useEffect, useState } from 'react'

export default function useResource(load, timingName, timeoutMs = 15_000) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null)
  const current = result?.attempt === attempt && result.load === load ? result : null

  useEffect(() => {
    const controller = new AbortController()
    const startedAt = performance.now()
    const timeout = setTimeout(() => controller.abort(new DOMException('The request timed out.', 'TimeoutError')), timeoutMs)

    async function request() {
      try {
        const data = await load({ signal: controller.signal })
        controller.signal.throwIfAborted()
        setResult({ attempt, load, status: 'success', data })
      } catch (error) {
        if (!controller.signal.aborted || controller.signal.reason?.name === 'TimeoutError') {
          setResult({ attempt, load, status: 'error', error })
        }
      } finally {
        clearTimeout(timeout)
        if (timingName && controller.signal.reason?.name !== 'AbortError') {
          performance.measure(timingName, { start: startedAt, end: performance.now() })
        }
      }
    }

    request()
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [attempt, load, timingName, timeoutMs])

  return {
    status: current?.status ?? 'loading',
    data: current?.data,
    error: current?.error,
    retry: () => setAttempt((previous) => previous + 1),
  }
}

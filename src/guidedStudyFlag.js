export function isGuidedStudyEnabled(env = {}) {
  const value = env.VITE_GUIDED_STUDY_ENABLED
  return value === 'true' || (value !== 'false' && env.DEV === true)
}

export const guidedStudyEnabled = isGuidedStudyEnabled(import.meta.env)

export const preparationMessages = {
  missing: 'This PDF is missing. Please upload it again.',
  no_text: 'This PDF has no selectable text. Upload a PDF with selectable text to use the study tools.',
  extraction_failed: 'We could not read this PDF. Try generating again or upload a new copy.',
}

export function getPreparationIssue(error) {
  if (error?.status === 409) return 'missing'
  if (error?.status !== 422) return null
  if (error.code === 'no_selectable_text') return 'no_text'
  if (error.code === 'pdf_extraction_failed') return 'extraction_failed'
  return null
}

export function generationErrorMessage(error) {
  if (error?.status === 429) return "You've reached the generation limit. Please try again later."
  return preparationMessages[getPreparationIssue(error)] ?? 'We could not generate this material. Please try again.'
}

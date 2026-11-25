import { useRef, useState } from 'react'
import { buildOutlinePatch, draftStart, mergeOutlineDraft, splitOutlineDraft } from '../guidedStudyData'
import { updateStudyOutline } from '../api/study'
import useStudyMutation from '../useStudyMutation'

export default function StudyOutlineEditor({ documentId, outline, onSave, onCancel, onReload }) {
  const [draft, setDraft] = useState(() => outline.sections.map(({ id, title, end_page, locked }) => ({ key: id, id, title, end_page, locked })))
  const newRow = useRef(0)
  const [validation, setValidation] = useState('')
  const save = useStudyMutation()

  function edit(index, field, value) {
    setValidation('')
    setDraft((rows) => rows.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }

  function split(index) {
    const key = `new-${++newRow.current}`
    setValidation('')
    setDraft((rows) => splitOutlineDraft(rows, index, key))
  }

  function merge(index) {
    setValidation('')
    setDraft((rows) => mergeOutlineDraft(rows, index))
  }

  async function submit(event) {
    event.preventDefault()
    try {
      const patch = buildOutlinePatch(draft, outline.sections, outline.page_count)
      const result = await save.run((options) => updateStudyOutline(documentId, patch, options))
      if (result) onSave(result)
    } catch (error) {
      setValidation(error.message)
    }
  }

  return (
    <form className="sp-guided-editor sp-guided-band" onSubmit={submit} aria-labelledby="edit-outline-title">
      <div className="sp-section-heading">
        <div><h2 id="edit-outline-title">Edit outline</h2><p>{outline.page_count} pages. Each section starts after the previous one ends.</p></div>
      </div>
      {draft.map((row, index) => {
        const sharedWithLocked = row.locked || draft[index + 1]?.locked
        const fixedEnd = sharedWithLocked || index === draft.length - 1
        const start = draftStart(draft, index)
        const canSplit = !row.locked && start !== null && Number(row.end_page) > start && draft.length < 300
        const canMerge = !row.locked && draft[index + 1] && !draft[index + 1].locked
        return (
          <fieldset key={row.key} className="sp-guided-edit-row" disabled={save.pending}>
            <legend>Section {index + 1}{row.locked ? ' / Range locked' : ''}</legend>
            <label className="sp-field">Title
              <input value={row.title} required maxLength={160} onChange={(event) => edit(index, 'title', event.target.value)} />
            </label>
            <div className="sp-guided-edit-pages">
              <div><span>Start page</span><output>{start ?? '-'}</output></div>
              <label className="sp-field">End page
                <input type="number" min={1} max={outline.page_count} step={1} required readOnly={fixedEnd} value={row.end_page}
                  title={sharedWithLocked ? 'This boundary touches a locked range' : undefined}
                  onChange={(event) => edit(index, 'end_page', event.target.value)} />
              </label>
            </div>
            {(canSplit || canMerge) && <div className="sp-guided-edit-actions">
              {canSplit && <button type="button" className="sp-text-button" onClick={() => split(index)} aria-label={`Split section ${index + 1}`}>Split section</button>}
              {canMerge && <button type="button" className="sp-text-button" onClick={() => merge(index)} aria-label={`Merge sections ${index + 1} and ${index + 2}`}>Merge with next</button>}
            </div>}
          </fieldset>
        )
      })}
      {(validation || save.error) && <p className="sp-error" role="alert">{validation || save.error.message}</p>}
      <div className="sp-actions">
        <button className="sp-button sp-primary" type="submit" disabled={save.pending}>{save.pending ? 'Saving...' : 'Save outline'}</button>
        <button className="sp-button sp-secondary" type="button" disabled={save.pending} onClick={onCancel}>Cancel</button>
        {save.error?.status === 409 && <button className="sp-text-button" type="button" onClick={onReload}>Reload outline</button>}
      </div>
    </form>
  )
}

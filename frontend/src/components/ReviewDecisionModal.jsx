import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { applicationsApi, getApiErrorMessage } from '../api/applications'
import { REVIEW_DECISIONS, STATUSES, isCommentRequired } from '../utils/workflow'
import ErrorMessage from './ErrorMessage'

export default function ReviewDecisionModal({ applicationId, onClose, onSuccess }) {
  const [decision, setDecision] = useState(STATUSES.APPROVED)
  const [reviewerComment, setReviewerComment] = useState('')
  const [validationError, setValidationError] = useState('')

  const commentRequired = useMemo(() => isCommentRequired(decision), [decision])

  const mutation = useMutation({
    mutationFn: () =>
      applicationsApi.decision(applicationId, {
        decision,
        reviewer_comment: reviewerComment.trim(),
      }),
    onSuccess: (application) => {
      onSuccess(application)
      onClose()
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    setValidationError('')

    if (commentRequired && !reviewerComment.trim()) {
      setValidationError('A reviewer comment is required for this decision.')
      return
    }

    mutation.mutate()
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="decision-title">
        <div className="modal__header">
          <div>
            <p className="eyebrow">Review</p>
            <h2 id="decision-title">Record decision</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Decision</span>
            <select value={decision} onChange={(event) => setDecision(event.target.value)}>
              {REVIEW_DECISIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Reviewer comment {commentRequired ? '' : <small>(optional)</small>}</span>
            <textarea
              rows="5"
              value={reviewerComment}
              onChange={(event) => setReviewerComment(event.target.value)}
              aria-invalid={Boolean(validationError)}
              placeholder={commentRequired ? 'Add the reason for this decision' : 'Add a note for the applicant'}
            />
          </label>

          <ErrorMessage>{validationError || (mutation.isError ? getApiErrorMessage(mutation.error) : '')}</ErrorMessage>

          <div className="button-row button-row--end">
            <button className="button button--ghost" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="button button--primary" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save decision'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

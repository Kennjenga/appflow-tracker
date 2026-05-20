import React, { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { applicationsApi, getApiErrorMessage } from '../api/applications'
import { REVIEW_DECISIONS, STATUSES, isCommentRequired } from '../utils/workflow'
import ErrorMessage from './ErrorMessage'

type Props = {
  applicationId: string | number
  onClose: () => void
  onSuccess: (application: any) => void
}

export default function ReviewDecisionModal({ applicationId, onClose, onSuccess }: Props) {
  const [decision, setDecision] = useState<string>(STATUSES.APPROVED)
  const [reviewerComment, setReviewerComment] = useState<string>('')
  const [validationError, setValidationError] = useState<string>('')

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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setValidationError('')

    if (commentRequired && !reviewerComment.trim()) {
      setValidationError('A reviewer comment is required for this decision.')
      return
    }

    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" role="presentation">
      <section className="bg-surface border border-outline-variant w-full max-w-[480px] rounded-lg overflow-hidden shadow-lg animate-in fade-in zoom-in duration-200" role="dialog" aria-modal="true" aria-labelledby="decision-title">
        <div className="flex justify-between items-start p-6 pb-4 border-b border-outline-variant">
          <div>
            <p className="m-0 text-xs font-semibold tracking-wider uppercase text-on-surface-variant">Review</p>
            <h2 id="decision-title" className="text-xl font-semibold m-0 mt-1">Record decision</h2>
          </div>
          <button className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant transition-colors" type="button" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <form className="p-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <label className="grid gap-1.5">
            <span className="text-secondary font-semibold text-sm">Decision</span>
            <select value={decision} onChange={(event) => setDecision(event.target.value)} className="w-full border border-border rounded px-3 h-[42px] bg-white text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50">
              {REVIEW_DECISIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-secondary font-semibold text-sm">Reviewer comment {commentRequired ? '' : <small>(optional)</small>}</span>
            <textarea
              rows={5}
              value={reviewerComment}
              onChange={(event) => setReviewerComment(event.target.value)}
              aria-invalid={Boolean(validationError)}
              placeholder={commentRequired ? 'Add the reason for this decision' : 'Add a note for the applicant'}
              className="w-full border border-border rounded px-3 py-2 bg-white text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          </label>

          <ErrorMessage>{validationError || (mutation.isError ? getApiErrorMessage(mutation.error) : '')}</ErrorMessage>

          <div className="flex justify-end gap-2.5 mt-2">
            <button className="inline-flex items-center justify-center gap-2 min-h-[40px] font-semibold text-sm rounded px-4 border border-outline-variant text-secondary bg-transparent hover:bg-surface-container-low transition-all active:scale-95" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="inline-flex items-center justify-center gap-2 min-h-[40px] font-semibold text-sm rounded px-4 bg-primary text-white hover:bg-primary-strong active:scale-95 transition-all" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save decision'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

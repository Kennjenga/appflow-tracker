import { ArrowLeft, ClipboardCheck, Edit, RefreshCw, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { applicationsApi, getApiErrorMessage } from '../api/applications'
import ErrorMessage from '../components/ErrorMessage'
import ReviewDecisionModal from '../components/ReviewDecisionModal'
import StatusBadge from '../components/StatusBadge'
import { STATUSES, getAvailableActions } from '../utils/workflow'

function formatDateTime(value) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function DetailItem({ label, children }) {
  return (
    <div className="detail-item">
      <dt>{label}</dt>
      <dd>{children || 'Not provided'}</dd>
    </div>
  )
}

export default function ApplicationDetailPage() {
  const { id } = useParams({ strict: false })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDecisionOpen, setIsDecisionOpen] = useState(false)

  const query = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.get(id),
  })

  function cacheApplication(application) {
    queryClient.setQueryData(['application', id], application)
    queryClient.invalidateQueries({ queryKey: ['applications'] })
  }

  const actionMutation = useMutation({
    mutationFn: (action) => {
      if (action === 'submit') return applicationsApi.submit(id)
      if (action === 'resubmit') return applicationsApi.resubmit(id)
      if (action === 'startReview') return applicationsApi.startReview(id)
      throw new Error('Unsupported action')
    },
    onSuccess: cacheApplication,
  })

  const availableActions = useMemo(() => getAvailableActions(query.data?.status), [query.data?.status])

  return (
    <main className="page-shell">
      <Link className="back-link" to="/">
        <ArrowLeft aria-hidden="true" size={18} />
        Applications
      </Link>

      {query.isLoading ? (
        <p className="empty-state">Loading application...</p>
      ) : query.isError ? (
        <ErrorMessage>{getApiErrorMessage(query.error)}</ErrorMessage>
      ) : (
        <>
          <section className="page-header">
            <div>
              <p className="eyebrow">{query.data.tracking_number}</p>
              <h1>{query.data.company_name}</h1>
            </div>
            <StatusBadge status={query.data.status} />
          </section>

          <ErrorMessage>{actionMutation.isError ? getApiErrorMessage(actionMutation.error) : ''}</ErrorMessage>

          <section className="detail-layout">
            <div className="detail-main">
              <dl className="detail-grid">
                <DetailItem label="Applicant">{query.data.applicant_name}</DetailItem>
                <DetailItem label="Email">{query.data.applicant_email}</DetailItem>
                <DetailItem label="Type">{query.data.application_type}</DetailItem>
                <DetailItem label="Created">{formatDateTime(query.data.created_at)}</DetailItem>
                <DetailItem label="Submitted">{formatDateTime(query.data.submitted_at)}</DetailItem>
                <DetailItem label="Reviewed">{formatDateTime(query.data.reviewed_at)}</DetailItem>
              </dl>

              <section className="content-block">
                <h2>Description</h2>
                <p>{query.data.description || 'No description provided.'}</p>
              </section>

              {query.data.reviewer_comment && (
                <section className="content-block content-block--note">
                  <h2>Reviewer comment</h2>
                  <p>{query.data.reviewer_comment}</p>
                </section>
              )}
            </div>

            <aside className="action-panel" aria-label="Application actions">
              <h2>Actions</h2>
              {availableActions.length === 0 && (
                <p className="muted">
                  This workflow is complete. {query.data.status === STATUSES.APPROVED ? 'The application was approved.' : ''}
                </p>
              )}

              {availableActions.includes('edit') && (
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() =>
                    navigate({
                      to: '/applications/$id/edit',
                      params: { id },
                    })
                  }
                >
                  <Edit aria-hidden="true" size={18} />
                  Edit
                </button>
              )}

              {availableActions.includes('submit') && (
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => actionMutation.mutate('submit')}
                  disabled={actionMutation.isPending}
                >
                  <Send aria-hidden="true" size={18} />
                  Submit
                </button>
              )}

              {availableActions.includes('resubmit') && (
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => actionMutation.mutate('resubmit')}
                  disabled={actionMutation.isPending}
                >
                  <RefreshCw aria-hidden="true" size={18} />
                  Resubmit
                </button>
              )}

              {availableActions.includes('startReview') && (
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => actionMutation.mutate('startReview')}
                  disabled={actionMutation.isPending}
                >
                  <ClipboardCheck aria-hidden="true" size={18} />
                  Start review
                </button>
              )}

              {availableActions.includes('decision') && (
                <button className="button button--primary" type="button" onClick={() => setIsDecisionOpen(true)}>
                  <ClipboardCheck aria-hidden="true" size={18} />
                  Record decision
                </button>
              )}
            </aside>
          </section>

          {isDecisionOpen && (
            <ReviewDecisionModal
              applicationId={id}
              onClose={() => setIsDecisionOpen(false)}
              onSuccess={cacheApplication}
            />
          )}
        </>
      )}
    </main>
  )
}

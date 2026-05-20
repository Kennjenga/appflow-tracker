import React, { useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  ClipboardCheck,
  Edit,
  HelpCircle,
  Info,
  RefreshCw,
  Send,
  Shield,
  Timer,
  XCircle,
  ChevronRight,
} from 'lucide-react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { applicationsApi, getApiErrorMessage } from '../api/applications'
import ErrorMessage from '../components/ErrorMessage'
import ReviewDecisionModal from '../components/ReviewDecisionModal'
import StatusBadge from '../components/StatusBadge'
import { STATUSES, getAvailableActions } from '../utils/workflow'

type Application = {
  id?: number | string
  tracking_number?: string
  company_name?: string
  applicant_name?: string
  applicant_email?: string
  application_type?: string
  created_at?: string | null
  submitted_at?: string | null
  reviewed_at?: string | null
  description?: string | null
  reviewer_comment?: string | null
  status?: string | null
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

type DetailItemProps = {
  label: string
  children?: React.ReactNode
}

function DetailItem({ label, children }: DetailItemProps) {
  return (
    <div className="detail-item">
      <dt>{label}</dt>
      <dd>{children || 'Not provided'}</dd>
    </div>
  )
}

export default function ApplicationDetailPage() {
  const paramsAny = useParams({ strict: false } as any) as any
  const id = paramsAny?.id as string | undefined
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDecisionOpen, setIsDecisionOpen] = useState(false)

  const query = useQuery<Application>({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.get(id as string),
  })

  function cacheApplication(application: Application): void {
    queryClient.setQueryData(['application', id], application)
    queryClient.invalidateQueries({ queryKey: ['applications'] })
  }

  const actionMutation = useMutation({
    mutationFn: (action: string) => {
      if (action === 'submit') return applicationsApi.submit(id as string)
      if (action === 'resubmit') return applicationsApi.resubmit(id as string)
      if (action === 'startReview')
        return applicationsApi.startReview(id as string)
      throw new Error('Unsupported action')
    },
    onSuccess: cacheApplication,
  })

  const availableActions = useMemo(
    () => getAvailableActions(query.data?.status),
    [query.data?.status],
  )

  const lifecycleEvents = useMemo(() => {
    const events: { label: string; date: string | null; muted?: boolean }[] = []
    if (query.data?.created_at) {
      events.push({ label: 'Created', date: query.data.created_at })
    }
    if (query.data?.submitted_at) {
      events.push({ label: 'Submitted', date: query.data.submitted_at })
    }
    if (
      query.data?.status === STATUSES.UNDER_REVIEW ||
      query.data?.reviewed_at
    ) {
      events.push({
        label: query.data?.reviewed_at
          ? 'Review Completed'
          : 'Manual Review Started',
        date: query.data?.reviewed_at || null,
        muted: !query.data?.reviewed_at,
      })
    }
    if (query.data?.status === STATUSES.APPROVED) {
      events.push({ label: 'Approved', date: query.data.reviewed_at })
    }
    if (query.data?.status === STATUSES.REJECTED) {
      events.push({ label: 'Rejected', date: query.data.reviewed_at })
    }
    return events
  }, [query.data])

  return (
    <div className="page-shell">
      {query.isLoading ? (
        <p className="empty-state">Loading application...</p>
      ) : query.isError ? (
        <ErrorMessage>{getApiErrorMessage(query.error)}</ErrorMessage>
      ) : (
        <>
          {/* Breadcrumbs */}
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Workflows</Link>
            <ChevronRight size={14} className="breadcrumb-sep" />
            <Link to="/">Pending Review</Link>
            <ChevronRight size={14} className="breadcrumb-sep" />
            <span className="breadcrumb-active">
              {query.data?.tracking_number}
            </span>
          </nav>

          {/* Page Header */}
          <section className="page-header">
            <div className="page-header__title-row">
              <h1>Application #{query.data?.tracking_number}</h1>
              <StatusBadge status={query.data?.status} />
            </div>
          </section>

          <ErrorMessage>
            {actionMutation.isError
              ? getApiErrorMessage(actionMutation.error)
              : ''}
          </ErrorMessage>

          {/* 2-Column Layout */}
          <section className="detail-layout">
            {/* Main Column */}
            <div className="detail-main">
              {/* Applicant Information Card */}
              <div className="detail-card">
                <div className="status-accent-bar status-accent-bar--tertiary" />
                <h3 className="detail-card__title">
                  <Info size={20} className="detail-card__title-icon" />
                  Applicant Information
                </h3>
                <dl className="detail-grid">
                  <DetailItem label="Full Legal Name">
                    {query.data?.applicant_name}
                  </DetailItem>
                  <DetailItem label="Tracking Number">
                    <code>{query.data?.tracking_number}</code>
                  </DetailItem>
                  <DetailItem label="Submission Date">
                    {formatDateTime(query.data?.submitted_at)}
                  </DetailItem>
                  <DetailItem label="Application Type">
                    {query.data?.application_type}
                  </DetailItem>
                  <DetailItem label="Email Address">
                    {query.data?.applicant_email}
                  </DetailItem>
                  <DetailItem label="Company">
                    {query.data?.company_name}
                  </DetailItem>
                </dl>
              </div>

              {/* Request Justification */}
              <section className="content-block">
                <h2>Request Justification</h2>
                <p>
                  {query.data?.description || 'No description provided.'}
                </p>
              </section>

              {/* Reviewer Comment */}
              {query.data?.reviewer_comment && (
                <section className="content-block content-block--note">
                  <h2>Reviewer Comment</h2>
                  <p>{query.data.reviewer_comment}</p>
                </section>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="detail-sidebar">
              {/* Reviewer Actions Panel */}
              <aside className="action-panel" aria-label="Application actions">
                <h2 className="action-panel__title">
                  <Shield size={20} className="action-panel__title-icon" />
                  Reviewer Actions
                </h2>

                {availableActions.length === 0 && (
                  <p className="muted">
                    This workflow is complete.{' '}
                    {query.data?.status === STATUSES.APPROVED
                      ? 'The application was approved.'
                      : ''}
                    {query.data?.status === STATUSES.REJECTED
                      ? 'The application was rejected.'
                      : ''}
                  </p>
                )}

                {availableActions.includes('edit') && (
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() =>
                      navigate({
                        to: '/applications/$id/edit',
                        params: { id: id as string } as any,
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
                    Start Review
                  </button>
                )}

                {availableActions.includes('decision') && (
                  <>
                    <button
                      className="button button--primary"
                      type="button"
                      onClick={() => setIsDecisionOpen(true)}
                    >
                      <CheckCircle aria-hidden="true" size={18} />
                      Approve Application
                    </button>
                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={() => setIsDecisionOpen(true)}
                    >
                      <HelpCircle aria-hidden="true" size={18} />
                      Need More Information
                    </button>
                    <button
                      className="button button--danger"
                      type="button"
                      onClick={() => setIsDecisionOpen(true)}
                    >
                      <XCircle aria-hidden="true" size={18} />
                      Reject Application
                    </button>
                  </>
                )}

                {(query.data?.status === STATUSES.UNDER_REVIEW ||
                  query.data?.status === STATUSES.SUBMITTED) && (
                  <div className="review-deadline">
                    <p className="review-deadline__label">Review Deadline</p>
                    <div className="review-deadline__value">
                      <Timer size={16} />
                      <span>48 Hours Remaining</span>
                    </div>
                  </div>
                )}
              </aside>

              {/* Lifecycle Events Timeline */}
              {lifecycleEvents.length > 0 && (
                <div className="timeline-card">
                  <h4>Lifecycle Events</h4>
                  <ul className="timeline-list">
                    {lifecycleEvents.map((event, idx) => (
                      <li key={idx} className="timeline-item">
                        <div className="timeline-item__indicator">
                          <div
                            className={`timeline-item__dot${event.muted ? ' timeline-item__dot--muted' : ''}`}
                          />
                          {idx < lifecycleEvents.length - 1 && (
                            <div className="timeline-item__line" />
                          )}
                        </div>
                        <div className="timeline-item__content">
                          <p
                            className={`timeline-item__label${event.muted ? ' timeline-item__label--muted' : ''}`}
                          >
                            {event.label}
                          </p>
                          <p className="timeline-item__date">
                            {event.date
                              ? new Intl.DateTimeFormat(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                }).format(new Date(event.date))
                              : 'In progress'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {isDecisionOpen && (
            <ReviewDecisionModal
              applicationId={id as string}
              onClose={() => setIsDecisionOpen(false)}
              onSuccess={cacheApplication}
            />
          )}
        </>
      )}
    </div>
  )
}

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
    <div className="min-h-0 p-0 bg-transparent">
      <dt className="mb-1 text-xs font-semibold tracking-wider uppercase text-on-surface-variant">
        {label}
      </dt>
      <dd className="m-0 font-medium text-base text-on-surface break-all">
        {children || 'Not provided'}
      </dd>
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
    <div className="max-w-7xl mx-auto w-full">
      {query.isLoading ? (
        <p className="m-0 p-9 text-on-surface-variant text-center">Loading application...</p>
      ) : query.isError ? (
        <ErrorMessage>{getApiErrorMessage(query.error)}</ErrorMessage>
      ) : (
        <>
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 mb-4" aria-label="Breadcrumb">
            <Link to="/" className="text-xs font-semibold tracking-wide uppercase text-on-surface-variant no-underline transition-colors hover:text-primary">
              Workflows
            </Link>
            <ChevronRight size={14} className="text-outline" />
            <Link to="/" className="text-xs font-semibold tracking-wide uppercase text-on-surface-variant no-underline transition-colors hover:text-primary">
              Pending Review
            </Link>
            <ChevronRight size={14} className="text-outline" />
            <span className="text-xs font-semibold tracking-wide uppercase text-primary">
              {query.data?.tracking_number}
            </span>
          </nav>

          {/* Page Header */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-[28px] leading-9 font-semibold text-on-surface tracking-tight m-0">
                Application #{query.data?.tracking_number}
              </h1>
              <StatusBadge status={query.data?.status} />
            </div>
          </section>

          <ErrorMessage>
            {actionMutation.isError
              ? getApiErrorMessage(actionMutation.error)
              : ''}
          </ErrorMessage>

          {/* 2-Column Layout */}
          <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            {/* Main Column */}
            <div className="grid gap-6">
              {/* Applicant Information Card */}
              <div className="relative bg-surface border border-outline-variant p-6 rounded-lg overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary" />
                <h3 className="text-xl font-semibold m-0 mb-6 flex items-center gap-2">
                  <Info size={20} className="text-tertiary" />
                  Applicant Information
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-x-8 md:gap-y-6 m-0">
                  <DetailItem label="Full Legal Name">
                    {query.data?.applicant_name}
                  </DetailItem>
                  <DetailItem label="Tracking Number">
                    <code className="font-mono text-sm">{query.data?.tracking_number}</code>
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
              <section className="bg-surface border border-outline-variant rounded-lg p-6">
                <h2 className="m-0 mb-3 text-xl font-semibold">Request Justification</h2>
                <p className="m-0 text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                  {query.data?.description || 'No description provided.'}
                </p>
              </section>

              {/* Reviewer Comment */}
              {query.data?.reviewer_comment && (
                <section className="bg-surface border border-outline-variant rounded-lg p-6 bg-[#fffaf0]">
                  <h2 className="m-0 mb-3 text-xl font-semibold">Reviewer Comment</h2>
                  <p className="m-0 text-on-surface-variant leading-relaxed whitespace-pre-wrap">{query.data.reviewer_comment}</p>
                </section>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="grid gap-6 items-start">
              {/* Reviewer Actions Panel */}
              <aside className="bg-surface border border-outline-variant rounded-lg p-6 shadow-sm grid gap-3 sticky top-24" aria-label="Application actions">
                <h2 className="m-0 mb-2 text-xl font-semibold flex items-center gap-2">
                  <Shield size={20} className="text-primary" />
                  Reviewer Actions
                </h2>

                {availableActions.length === 0 && (
                  <p className="m-0 text-on-surface-variant leading-normal">
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
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-surface hover:bg-surface-container-low text-on-surface border border-outline-variant font-semibold text-sm rounded transition-all active:scale-[0.97]"
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
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary hover:bg-primary-strong text-white font-semibold text-sm rounded transition-all active:scale-[0.97] disabled:opacity-50"
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
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary hover:bg-primary-strong text-white font-semibold text-sm rounded transition-all active:scale-[0.97] disabled:opacity-50"
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
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary hover:bg-primary-strong text-white font-semibold text-sm rounded transition-all active:scale-[0.97] disabled:opacity-50"
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
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary hover:bg-primary-strong text-white font-semibold text-sm rounded transition-all active:scale-[0.97]"
                      type="button"
                      onClick={() => setIsDecisionOpen(true)}
                    >
                      <CheckCircle aria-hidden="true" size={18} />
                      Approve Application
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-surface hover:bg-surface-container-low text-on-surface border border-outline-variant font-semibold text-sm rounded transition-all active:scale-[0.97]"
                      type="button"
                      onClick={() => setIsDecisionOpen(true)}
                    >
                      <HelpCircle aria-hidden="true" size={18} />
                      Need More Information
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-transparent hover:bg-red-50 border border-error text-error font-semibold text-sm rounded transition-all active:scale-[0.97]"
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
                  <div className="mt-2 pt-5 border-t border-outline-variant">
                    <p className="text-xs font-semibold tracking-wider uppercase text-on-surface-variant mb-2">Review Deadline</p>
                    <div className="flex items-center gap-2 text-error font-bold text-sm">
                      <Timer size={16} />
                      <span>48 Hours Remaining</span>
                    </div>
                  </div>
                )}
              </aside>

              {/* Lifecycle Events Timeline */}
              {lifecycleEvents.length > 0 && (
                <div className="bg-surface-container-low border border-outline-variant border-opacity-50 rounded-lg p-6">
                  <h4 className="m-0 mb-4 text-sm font-semibold text-on-surface">Lifecycle Events</h4>
                  <ul className="list-none m-0 p-0">
                    {lifecycleEvents.map((event, idx) => (
                      <li key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 mt-1 ${event.muted ? 'bg-outline' : 'bg-primary'}`}
                          />
                          {idx < lifecycleEvents.length - 1 && (
                            <div className="w-px flex-1 bg-outline-variant my-1 min-h-[16px]" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p
                            className={`m-0 text-xs font-semibold ${event.muted ? 'text-on-surface-variant italic' : 'text-on-surface'}`}
                          >
                            {event.label}
                          </p>
                          <p className="m-0 mt-0.5 text-[11px] text-on-surface-variant">
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

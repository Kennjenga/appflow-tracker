import React, { useMemo, useState } from 'react'
import { ArrowLeft, Save, Send, AlertCircle, ShieldCheck, Share2 } from 'lucide-react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { applicationsApi, getApiErrorMessage } from '../api/applications'
import ErrorMessage from '../components/ErrorMessage'
import FieldError from '../components/FieldError'
import StatusBadge from '../components/StatusBadge'
import { APPLICATION_TYPES, isEditable } from '../utils/workflow'
import { hasErrors, validateApplicationForm } from '../utils/validation'

type Application = {
  id?: number | string
  tracking_number?: string
  applicant_name?: string
  applicant_email?: string
  company_name?: string
  application_type?: string
  description?: string
  reviewer_comment?: string | null
  status?: string
}

type FormShape = {
  applicant_name: string
  applicant_email: string
  company_name: string
  application_type: string
  description: string
}

const EMPTY_FORM: FormShape = {
  applicant_name: '',
  applicant_email: '',
  company_name: '',
  application_type: '',
  description: '',
}

const MAX_DESCRIPTION = 2000

function mapApplicationToForm(application?: Application): FormShape {
  if (!application) return EMPTY_FORM

  return {
    applicant_name: application.applicant_name || '',
    applicant_email: application.applicant_email || '',
    company_name: application.company_name || '',
    application_type: application.application_type || '',
    description: application.description || '',
  }
}

export default function ApplicationFormPage() {
  const paramsAny = useParams({ strict: false } as any) as any
  const id = paramsAny?.id as string | undefined
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormShape>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const existingQuery = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.get(id as string),
    enabled: isEdit,
  })

  const existingData = existingQuery.data as Application | undefined
  const activeForm =
    isEdit && existingData && !isDirty
      ? mapApplicationToForm(existingData)
      : form
  const editBlocked =
    isEdit && existingData && !isEditable(existingData.status)

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      isEdit
        ? applicationsApi.update(id as string, payload)
        : applicationsApi.create(payload),
    onSuccess: (application: any) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.setQueryData(
        ['application', String(application.id)],
        application,
      )
      navigate({
        to: '/applications/$id',
        params: { id: String(application.id) },
      })
    },
  })

  const formTitle = useMemo(
    () => (isEdit ? 'Edit Application' : 'Submit New Application'),
    [isEdit],
  )
  const formSubtitle = useMemo(
    () =>
      isEdit
        ? 'Update the application details below.'
        : 'Please fill out the details below to initiate the workflow stream.',
    [isEdit],
  )

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target
    const nextForm = { ...activeForm, [name]: value }
    setIsDirty(true)
    setForm(nextForm)

    if (submitted) {
      setErrors(validateApplicationForm(nextForm))
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    const nextErrors = validateApplicationForm(activeForm)
    setErrors(nextErrors)

    if (hasErrors(nextErrors) || editBlocked) return
    mutation.mutate({
      ...activeForm,
      applicant_name: activeForm.applicant_name.trim(),
      applicant_email: activeForm.applicant_email.trim(),
      company_name: activeForm.company_name.trim(),
      description: activeForm.description.trim(),
    })
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <Link
        className="inline-flex items-center gap-2 mb-5 text-secondary font-semibold text-sm hover:text-primary transition-colors no-underline"
        to={isEdit ? '/applications/$id' : '/'}
        params={(isEdit ? { id } : undefined) as any}
      >
        <ArrowLeft aria-hidden="true" size={18} />
        Back
      </Link>

      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <p className="m-0 text-xs font-semibold tracking-wider uppercase text-on-surface-variant">
            {isEdit ? existingData?.tracking_number : 'Draft intake'}
          </p>
          <h1 className="text-[28px] leading-9 font-semibold text-on-surface tracking-tight m-0 mt-1">
            {formTitle}
          </h1>
          <p className="text-base text-on-surface-variant mt-1 leading-relaxed">
            {formSubtitle}
          </p>
        </div>
        {existingData?.status && <StatusBadge status={existingData.status} />}
      </section>

      {existingQuery.isLoading ? (
        <p className="m-0 p-9 text-on-surface-variant text-center">Loading application...</p>
      ) : (
        <>
          {/* Reviewer Feedback Alert */}
          {isEdit && existingData?.reviewer_comment && (
            <div className="flex gap-3 items-start bg-tertiary-fixed border border-tertiary-fixed-dim text-on-tertiary-fixed-variant rounded p-3 mb-4 text-sm font-semibold">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-1">Reviewer Feedback</strong>
                {existingData.reviewer_comment}
              </div>
            </div>
          )}

          <form className="bg-surface border border-outline-variant rounded-lg p-6" onSubmit={handleSubmit} noValidate>
            <ErrorMessage>
              {editBlocked
                ? `Applications in ${existingData?.status} status cannot be edited.`
                : ''}
            </ErrorMessage>
            <ErrorMessage>
              {existingQuery.isError
                ? getApiErrorMessage(existingQuery.error)
                : ''}
            </ErrorMessage>
            <ErrorMessage>
              {mutation.isError ? getApiErrorMessage(mutation.error) : ''}
            </ErrorMessage>

            {/* Applicant Details Section */}
            <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-4 pb-2 border-b border-outline-variant">
              Applicant Details
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
              <label className="grid gap-[7px]">
                <span className="text-secondary font-semibold text-sm">Full Name</span>
                <input
                  name="applicant_name"
                  value={activeForm.applicant_name}
                  onChange={handleChange}
                  placeholder="e.g. Alexander Pierce"
                  aria-invalid={Boolean(errors.applicant_name)}
                  aria-describedby="applicant_name-error"
                  disabled={editBlocked}
                  className="w-full border border-border rounded px-3 h-[42px] bg-white text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <FieldError id="applicant_name-error">
                  {errors.applicant_name}
                </FieldError>
              </label>

              <label className="grid gap-[7px]">
                <span className="text-secondary font-semibold text-sm">Email Address</span>
                <input
                  name="applicant_email"
                  type="email"
                  value={activeForm.applicant_email}
                  onChange={handleChange}
                  placeholder="alex@company.com"
                  aria-invalid={Boolean(errors.applicant_email)}
                  aria-describedby="applicant_email-error"
                  disabled={editBlocked}
                  className="w-full border border-border rounded px-3 h-[42px] bg-white text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <FieldError id="applicant_email-error">
                  {errors.applicant_email}
                </FieldError>
              </label>

              <label className="grid gap-[7px] md:col-span-2">
                <span className="text-secondary font-semibold text-sm">Company Name</span>
                <input
                  name="company_name"
                  value={activeForm.company_name}
                  onChange={handleChange}
                  placeholder="Enter organization name"
                  aria-invalid={Boolean(errors.company_name)}
                  aria-describedby="company_name-error"
                  disabled={editBlocked}
                  className="w-full border border-border rounded px-3 h-[42px] bg-white text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <FieldError id="company_name-error">
                  {errors.company_name}
                </FieldError>
              </label>
            </div>

            {/* Application Parameters Section */}
            <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-4 pb-2 border-b border-outline-variant mt-6">
              Application Parameters
            </p>
            <label className="grid gap-[7px]">
              <span className="text-secondary font-semibold text-sm">Application Type</span>
              <select
                name="application_type"
                value={activeForm.application_type}
                onChange={handleChange}
                aria-invalid={Boolean(errors.application_type)}
                aria-describedby="application_type-error"
                disabled={editBlocked}
                className="w-full border border-border rounded px-3 h-[42px] bg-white text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select a type...</option>
                {APPLICATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <FieldError id="application_type-error">
                {errors.application_type}
              </FieldError>
            </label>

            <label className="grid gap-[7px] mt-[18px]">
              <span className="text-secondary font-semibold text-sm">Description</span>
              <textarea
                name="description"
                rows={6}
                value={activeForm.description}
                onChange={handleChange}
                placeholder="Provide a detailed overview of the application request..."
                disabled={editBlocked}
                maxLength={MAX_DESCRIPTION}
                className="w-full border border-border rounded px-3 py-2.5 min-h-[120px] resize-y bg-white text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <small className="text-right text-xs text-on-surface-variant font-semibold mt-1">
                {activeForm.description.length} / {MAX_DESCRIPTION} characters
              </small>
            </label>

            {/* Button Row */}
            <div className="flex flex-wrap gap-2.5 mt-6 justify-end">
              <Link
                className="inline-flex items-center justify-center gap-2 min-h-[40px] font-semibold text-sm rounded px-4 border border-outline-variant text-secondary bg-transparent hover:bg-surface-container-low transition-all active:scale-95"
                to={isEdit ? '/applications/$id' : '/'}
                params={(isEdit ? { id } : undefined) as any}
              >
                Save as Draft
              </Link>
              <button
                className="inline-flex items-center justify-center gap-2 min-h-[40px] font-semibold text-sm rounded px-4 bg-primary text-white hover:bg-primary-strong active:scale-95 transition-all disabled:opacity-50"
                type="submit"
                disabled={mutation.isPending || editBlocked}
              >
                <Send aria-hidden="true" size={18} />
                {mutation.isPending
                  ? 'Saving...'
                  : isEdit
                    ? 'Save Changes'
                    : 'Submit Application'}
              </button>
            </div>
          </form>

          {/* Trust Footer */}
          <div className="mt-10 p-6 bg-surface-container-low border border-outline-variant rounded-lg text-center">
            <div className="flex justify-center gap-6 mb-2 text-outline">
              <ShieldCheck size={28} />
              <Share2 size={28} />
            </div>
            <p className="m-0 text-sm text-on-surface-variant leading-relaxed">
              All submissions are tracked via our{' '}
              <strong className="text-on-surface">enterprise-lite transparent audit log</strong> for{' '}
              <span className="text-primary font-semibold">
                maximum security and compliance
              </span>
              .
            </p>
          </div>
        </>
      )}
    </div>
  )
}

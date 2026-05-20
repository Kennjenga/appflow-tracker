import { ArrowLeft, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { applicationsApi, getApiErrorMessage } from '../api/applications'
import ErrorMessage from '../components/ErrorMessage'
import FieldError from '../components/FieldError'
import StatusBadge from '../components/StatusBadge'
import { APPLICATION_TYPES, isEditable } from '../utils/workflow'
import { hasErrors, validateApplicationForm } from '../utils/validation'

const EMPTY_FORM = {
  applicant_name: '',
  applicant_email: '',
  company_name: '',
  application_type: '',
  description: '',
}

function mapApplicationToForm(application) {
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
  const { id } = useParams({ strict: false })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const existingQuery = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.get(id),
    enabled: isEdit,
  })

  const activeForm = isEdit && existingQuery.data && !isDirty ? mapApplicationToForm(existingQuery.data) : form
  const editBlocked = isEdit && existingQuery.data && !isEditable(existingQuery.data.status)

  const mutation = useMutation({
    mutationFn: (payload) => (isEdit ? applicationsApi.update(id, payload) : applicationsApi.create(payload)),
    onSuccess: (application) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.setQueryData(['application', String(application.id)], application)
      navigate({
        to: '/applications/$id',
        params: { id: String(application.id) },
      })
    },
  })

  const formTitle = useMemo(() => (isEdit ? 'Edit application' : 'New application'), [isEdit])

  function handleChange(event) {
    const { name, value } = event.target
    const nextForm = { ...activeForm, [name]: value }
    setIsDirty(true)
    setForm(nextForm)

    if (submitted) {
      setErrors(validateApplicationForm(nextForm))
    }
  }

  function handleSubmit(event) {
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
    <main className="page-shell page-shell--narrow">
      <Link
        className="back-link"
        to={isEdit ? '/applications/$id' : '/'}
        params={isEdit ? { id } : undefined}
      >
        <ArrowLeft aria-hidden="true" size={18} />
        Back
      </Link>

      <section className="page-header">
        <div>
          <p className="eyebrow">{isEdit ? existingQuery.data?.tracking_number : 'Draft intake'}</p>
          <h1>{formTitle}</h1>
        </div>
        {existingQuery.data?.status && <StatusBadge status={existingQuery.data.status} />}
      </section>

      {existingQuery.isLoading ? (
        <p className="empty-state">Loading application...</p>
      ) : (
        <form className="form-panel" onSubmit={handleSubmit} noValidate>
          <ErrorMessage>
            {editBlocked ? `Applications in ${existingQuery.data.status} status cannot be edited.` : ''}
          </ErrorMessage>
          <ErrorMessage>{existingQuery.isError ? getApiErrorMessage(existingQuery.error) : ''}</ErrorMessage>
          <ErrorMessage>{mutation.isError ? getApiErrorMessage(mutation.error) : ''}</ErrorMessage>

          <div className="form-grid">
            <label className="field">
              <span>Applicant name</span>
              <input
                name="applicant_name"
                value={activeForm.applicant_name}
                onChange={handleChange}
                aria-invalid={Boolean(errors.applicant_name)}
                aria-describedby="applicant_name-error"
                disabled={editBlocked}
              />
              <FieldError id="applicant_name-error">{errors.applicant_name}</FieldError>
            </label>

            <label className="field">
              <span>Email</span>
              <input
                name="applicant_email"
                type="email"
                value={activeForm.applicant_email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.applicant_email)}
                aria-describedby="applicant_email-error"
                disabled={editBlocked}
              />
              <FieldError id="applicant_email-error">{errors.applicant_email}</FieldError>
            </label>

            <label className="field">
              <span>Company name</span>
              <input
                name="company_name"
                value={activeForm.company_name}
                onChange={handleChange}
                aria-invalid={Boolean(errors.company_name)}
                aria-describedby="company_name-error"
                disabled={editBlocked}
              />
              <FieldError id="company_name-error">{errors.company_name}</FieldError>
            </label>

            <label className="field">
              <span>Application type</span>
              <select
                name="application_type"
                value={activeForm.application_type}
                onChange={handleChange}
                aria-invalid={Boolean(errors.application_type)}
                aria-describedby="application_type-error"
                disabled={editBlocked}
              >
                <option value="">Select type</option>
                {APPLICATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <FieldError id="application_type-error">{errors.application_type}</FieldError>
            </label>
          </div>

          <label className="field">
            <span>Description</span>
            <textarea
              name="description"
              rows="6"
              value={activeForm.description}
              onChange={handleChange}
              disabled={editBlocked}
            />
          </label>

          <div className="button-row button-row--end">
            <Link
              className="button button--ghost"
              to={isEdit ? '/applications/$id' : '/'}
              params={isEdit ? { id } : undefined}
            >
              Cancel
            </Link>
            <button className="button button--primary" type="submit" disabled={mutation.isPending || editBlocked}>
              <Save aria-hidden="true" size={18} />
              {mutation.isPending ? 'Saving...' : isEdit ? 'Save changes' : 'Create draft'}
            </button>
          </div>
        </form>
      )}
    </main>
  )
}

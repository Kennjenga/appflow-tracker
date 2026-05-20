import { APPLICATION_TYPES } from './workflow'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateApplicationForm(values) {
  const errors = {}

  if (!values.applicant_name?.trim()) {
    errors.applicant_name = 'Applicant name is required.'
  }

  if (!values.applicant_email?.trim()) {
    errors.applicant_email = 'Email is required.'
  } else if (!EMAIL_PATTERN.test(values.applicant_email)) {
    errors.applicant_email = 'Enter a valid email address.'
  }

  if (!values.company_name?.trim()) {
    errors.company_name = 'Company name is required.'
  }

  if (!APPLICATION_TYPES.includes(values.application_type)) {
    errors.application_type = 'Choose an application type.'
  }

  return errors
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0
}

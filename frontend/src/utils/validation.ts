import { APPLICATION_TYPES } from './workflow'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Values = Record<string, any>
export type ValidationErrors = Record<string, string>

export function validateApplicationForm(values: Values): ValidationErrors {
  const errors: ValidationErrors = {}

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

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0
}

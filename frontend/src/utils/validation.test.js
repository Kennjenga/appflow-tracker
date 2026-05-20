import { describe, expect, it } from 'vitest'
import { hasErrors, validateApplicationForm } from './validation'

const VALID_FORM = {
  applicant_name: 'Ada Lovelace',
  applicant_email: 'ada@example.com',
  company_name: 'Analytical Engines Inc.',
  application_type: 'Renewal',
  description: '',
}

describe('application form validation', () => {
  it('accepts a valid application draft', () => {
    const errors = validateApplicationForm(VALID_FORM)

    expect(errors).toEqual({})
    expect(hasErrors(errors)).toBe(false)
  })

  it('requires applicant, email, company, and application type', () => {
    const errors = validateApplicationForm({
      applicant_name: '',
      applicant_email: 'not-an-email',
      company_name: '',
      application_type: 'Something Else',
      description: '',
    })

    expect(errors.applicant_name).toBe('Applicant name is required.')
    expect(errors.applicant_email).toBe('Enter a valid email address.')
    expect(errors.company_name).toBe('Company name is required.')
    expect(errors.application_type).toBe('Choose an application type.')
    expect(hasErrors(errors)).toBe(true)
  })
})

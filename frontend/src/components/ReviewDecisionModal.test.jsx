import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applicationsApi } from '../api/applications'
import ReviewDecisionModal from './ReviewDecisionModal'

vi.mock('../api/applications', async () => {
  const actual = await vi.importActual('../api/applications')
  return {
    ...actual,
    applicationsApi: {
      decision: vi.fn(),
    },
  }
})

function renderModal() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ReviewDecisionModal applicationId="12" onClose={vi.fn()} onSuccess={vi.fn()} />
    </QueryClientProvider>,
  )
}

describe('ReviewDecisionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks rejected decisions without a reviewer comment', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.selectOptions(screen.getByLabelText('Decision'), 'Rejected')
    await user.click(screen.getByRole('button', { name: /save decision/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('A reviewer comment is required')
    expect(applicationsApi.decision).not.toHaveBeenCalled()
  })

  it('submits approved decisions without a comment', async () => {
    applicationsApi.decision.mockResolvedValue({ id: 12, status: 'Approved' })
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: /save decision/i }))

    expect(applicationsApi.decision).toHaveBeenCalledWith('12', {
      decision: 'Approved',
      reviewer_comment: '',
    })
  })
})

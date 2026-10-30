import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/utils/supabase/client'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock the supabase browser client utility
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('useAuth Hook', () => {
  const mockGetUser = vi.fn()
  const mockOnAuthStateChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: mockGetUser,
        onAuthStateChange: mockOnAuthStateChange,
      },
    })
  })

  it('should return loading true initially and resolve user', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })

    const { result } = renderHook(() => useAuth())

    // Initial state should be loading
    expect(result.current.loading).toBe(true)

    // Wait for the async effect to resolve
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it('should handle unauthenticated state when no user exists', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
  })
})

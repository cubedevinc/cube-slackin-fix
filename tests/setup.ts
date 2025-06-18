import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Auth0
vi.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({
    user: null,
    isLoading: false,
  }),
}))

// Mock fetch globally
global.fetch = vi.fn()

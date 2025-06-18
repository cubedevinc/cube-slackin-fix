import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

vi.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({
    user: null,
    isLoading: false,
  }),
}))

global.fetch = vi.fn()

vi.mock('@vercel/edge-config', () => ({
  get: vi.fn().mockResolvedValue(null),
}))

delete process.env.VERCEL

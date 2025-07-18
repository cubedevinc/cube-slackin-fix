import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Environment setup for tests
process.env.EDGE_CONFIG =
  'https://edge-config.vercel.com/ecfg_test123?token=test-token';
process.env.VERCEL_API_TOKEN = 'test-api-token';
process.env.VERCEL_TEAM_ID = 'test-team-id';
process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test/webhook';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

vi.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({
    user: null,
    isLoading: false,
  }),
}));

// Mock global fetch for all tests
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () =>
    Promise.resolve({
      url: 'https://join.slack.com/t/test/shared_invite/zt-test',
      createdAt: '2025-01-01T00:00:00.000Z',
      isActive: true,
    }),
});

// Mock Edge Config SDK
vi.mock('@vercel/edge-config', () => ({
  get: vi.fn().mockResolvedValue({
    url: 'https://join.slack.com/t/test/shared_invite/zt-test',
    createdAt: '2025-01-01T00:00:00.000Z',
    isActive: true,
  }),
}));

// Ensure we're not in Vercel environment during tests
delete process.env.VERCEL;

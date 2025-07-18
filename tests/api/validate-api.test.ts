import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('/api/invite/validate - API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Edge Config REST API responses
    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/items/invite')) {
        // Mock reading invite data
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              url: 'https://join.slack.com/t/test/shared_invite/zt-test-link',
              createdAt: '2025-01-01T00:00:00.000Z',
              isActive: true,
            }),
        });
      }
      if (url.includes('slack.com') && options?.method === 'HEAD') {
        // Mock Slack invite validation
        return Promise.resolve({
          ok: true,
          status: 200,
        });
      }
      if (url.includes('hooks.slack.com')) {
        // Mock Slack webhook
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ok: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });
    });
  });

  describe('POST /api/invite/validate', () => {
    it('should import POST handler without errors', async () => {
      const { POST } = await import('../../app/api/invite/validate/route');
      expect(typeof POST).toBe('function');
    });

    it('should validate existing invite link successfully', async () => {
      const { POST } = await import('../../app/api/invite/validate/route');

      const response = await POST();
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.url).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.message).toContain('valid');
    });

    it('should handle missing invite data', async () => {
      // Mock Edge Config to return null/undefined data
      const mockEdgeConfig = await import('@vercel/edge-config');
      vi.mocked(mockEdgeConfig.get).mockResolvedValueOnce(null);

      const { POST } = await import('../../app/api/invite/validate/route');

      const response = await POST();
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('No invite link to validate');
    });

    it('should handle invalid Slack link', async () => {
      // Mock failed Slack validation
      global.fetch = vi
        .fn()
        .mockImplementation((url: string, options?: any) => {
          if (url.includes('/items/invite')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({
                  url: 'https://join.slack.com/t/test/shared_invite/zt-invalid',
                  createdAt: '2025-01-01T00:00:00.000Z',
                  isActive: true,
                }),
            });
          }
          if (url.includes('slack.com') && options?.method === 'HEAD') {
            return Promise.resolve({
              ok: false,
              status: 404,
            });
          }
          if (url.includes('hooks.slack.com')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ ok: true }),
            });
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({}),
          });
        });

      const { POST } = await import('../../app/api/invite/validate/route');

      const response = await POST();
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('invalid');
    });
  });
});

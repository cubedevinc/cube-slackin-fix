import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (method: string, body?: any): VercelRequest => ({
    method,
    body,
  } as VercelRequest);

  const createMockResponse = () => {
    const res = {
      status: vi.fn(),
      json: vi.fn(),
      redirect: vi.fn(),
    } as any;

    res.status.mockReturnValue(res);
    return res as VercelResponse;
  };

  describe('update-link endpoint', () => {
    it('should reject non-POST requests', async () => {
      const { default: handler } = await import('../api/update-link');

      const req = createMockRequest('GET');
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('should reject requests without inviteLink', async () => {
      const { default: handler } = await import('../api/update-link');

      const req = createMockRequest('POST', {});
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        message: 'inviteLink is required and must be a string'
      });
    });

    it('should reject invalid URLs', async () => {
      const { default: handler } = await import('../api/update-link');

      const req = createMockRequest('POST', {
        inviteLink: 'https://invalid-url.com'
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid invite link',
        message: 'Link must be a valid Slack invite URL'
      });
    });
  });
});

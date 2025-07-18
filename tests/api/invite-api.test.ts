import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

describe('/api/invite - API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch responses for Edge Config REST API
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/items/invite')) {
        // Mock reading invite data
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              url: 'https://join.slack.com/t/test/shared_invite/zt-existing',
              createdAt: '2025-01-01T00:00:00.000Z',
              isActive: true,
            }),
        });
      }
      if (url.includes('/items') && url.includes('PATCH')) {
        // Mock writing invite data
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });
      }
      // Default successful response
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });
    });
  });

  describe('GET /api/invite', () => {
    it('should return invite data successfully', async () => {
      const { GET } = await import('../../app/api/invite/route');

      const response = await GET();
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.url).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.isActive).toBeDefined();
    });
  });

  describe('POST /api/invite', () => {
    it('should handle POST with missing body', async () => {
      const { POST } = await import('../../app/api/invite/route');

      const request = new NextRequest('http://localhost:3000/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBeDefined();
    });

    it('should handle POST with empty JSON body', async () => {
      const { POST } = await import('../../app/api/invite/route');

      const request = new NextRequest('http://localhost:3000/api/invite', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('URL is required');
    });

    it('should reject invalid URL format', async () => {
      const { POST } = await import('../../app/api/invite/route');

      const request = new NextRequest('http://localhost:3000/api/invite', {
        method: 'POST',
        body: JSON.stringify({ url: 'not-a-url' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should accept valid Slack URL', async () => {
      const { POST } = await import('../../app/api/invite/route');

      const validUrl =
        'https://join.slack.com/t/test/shared_invite/zt-new-link';
      const request = new NextRequest('http://localhost:3000/api/invite', {
        method: 'POST',
        body: JSON.stringify({ url: validUrl }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.url).toBe(validUrl);
      expect(result.createdAt).toBeDefined();
      expect(result.isActive).toBe(true);
    });
  });
});

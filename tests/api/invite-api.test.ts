import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

describe('/api/invite - Basic API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API Module Structure', () => {
    it('should import GET and POST handlers without errors', async () => {
      const { GET, POST } = await import('../../app/api/invite/route');

      expect(typeof GET).toBe('function');
      expect(typeof POST).toBe('function');
    });

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
  });
});

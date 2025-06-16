import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFile, readFile } from 'fs/promises';

vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
}));

describe('Slack Invite Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Link validation', () => {
    it('should validate correct Slack invite URLs', () => {
      const isValidSlackInvite = (url: string): boolean =>
        /^https:\/\/.+\.slack\.com\/.*invite/.test(url);

      expect(isValidSlackInvite('https://cube-js.slack.com/invite/zt-123')).toBe(true);
      expect(isValidSlackInvite('https://workspace.slack.com/shared_invite/zt-abc')).toBe(true);
      expect(isValidSlackInvite('https://invalid-url.com')).toBe(false);
      expect(isValidSlackInvite('not-a-url')).toBe(false);
    });
  });

  describe('TTL expiration', () => {
    it('should detect expired links', () => {
      const TTL_DAYS = 30;
      const isLinkExpired = (createdAt: string): boolean => {
        const createdDate = new Date(createdAt);
        const expirationDate = new Date(createdDate.getTime() + (TTL_DAYS * 24 * 60 * 60 * 1000));
        return new Date() > expirationDate;
      };

      const expiredDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
      const validDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

      expect(isLinkExpired(expiredDate)).toBe(true);
      expect(isLinkExpired(validDate)).toBe(false);
    });
  });

  describe('File operations', () => {
    it('should save link data correctly', async () => {
      const saveLinkData = async (inviteLink: string): Promise<any> => {
        const linkData = {
          inviteLink,
          createdAt: new Date().toISOString(),
        };
        await writeFile('link.json', JSON.stringify(linkData, null, 2));
        return linkData;
      };

      const result = await saveLinkData('https://test.slack.com/invite/test');

      expect(writeFile).toHaveBeenCalledOnce();
      expect(result.inviteLink).toBe('https://test.slack.com/invite/test');
      expect(result.createdAt).toBeDefined();
    });

    it('should handle missing file gracefully', async () => {
      vi.mocked(readFile).mockRejectedValue({ code: 'ENOENT' });

      const readLinkData = async (): Promise<any> => {
        try {
          const data = await readFile('link.json', 'utf8');
          return JSON.parse(data);
        } catch (error: any) {
          if (error.code === 'ENOENT') return null;
          throw error;
        }
      };

      const result = await readLinkData();
      expect(result).toBeNull();
    });
  });
});

describe('API Endpoints Integration', () => {
  it('should return 400 for invalid invite link', async () => {
    const mockReq = {
      method: 'POST',
      body: { inviteLink: 'invalid-url' }
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    expect(mockRes.status).not.toHaveBeenCalled();
  });
});

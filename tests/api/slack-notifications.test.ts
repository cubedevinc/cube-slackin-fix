import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock console methods to capture log output
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();

describe('Slack Notifications', () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up environment
    vi.stubEnv('SLACK_WEBHOOK_URL', 'https://hooks.slack.com/test/webhook');

    // Mock console methods
    console.log = mockConsoleLog;
    console.error = mockConsoleError;

    // Mock successful fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('sendSlackNotification', () => {
    it('should send notification with correct payload structure and logging', async () => {
      const { sendSlackNotification } = await import(
        '../../lib/slack-notifications'
      );

      const message = 'Test notification';
      const details = {
        'Key 1': 'Value 1',
        'Key 2': 'Value 2',
      };

      const result = await sendSlackNotification(message, details);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Check logging
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[SLACK] sendSlackNotification - Starting notification send'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[SLACK] sendSlackNotification - Message:',
        message
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[SLACK] sendSlackNotification - Details:',
        details
      );

      // Check fetch call
      const [url, options] = (global.fetch as any).mock.calls[0];
      expect(url).toBe('https://hooks.slack.com/test/webhook');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');

      const payload = JSON.parse(options.body);
      expect(payload.text).toBe(message);
      expect(payload.blocks).toBeDefined();
      expect(payload.blocks[0].text.text).toBe(message);
      expect(payload.blocks[1].fields).toHaveLength(2);
    });

    it('should send simple notification without details', async () => {
      const { sendSlackNotification } = await import(
        '../../lib/slack-notifications'
      );

      const message = 'Simple notification';
      const result = await sendSlackNotification(message);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [, options] = (global.fetch as any).mock.calls[0];
      const payload = JSON.parse(options.body);
      expect(payload.text).toBe(message);
      expect(payload.blocks).toBeUndefined();
    });

    it('should return false when webhook URL is not configured', async () => {
      vi.stubEnv('SLACK_WEBHOOK_URL', '');

      const { sendSlackNotification } = await import(
        '../../lib/slack-notifications'
      );
      const result = await sendSlackNotification('Test');

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[SLACK] sendSlackNotification - SLACK_WEBHOOK_URL not configured, skipping notification'
      );
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const { sendSlackNotification } = await import(
        '../../lib/slack-notifications'
      );
      const result = await sendSlackNotification('Test');

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[SLACK] sendSlackNotification - Error sending notification:',
        expect.any(Error)
      );
    });

    it('should handle non-ok responses', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const { sendSlackNotification } = await import(
        '../../lib/slack-notifications'
      );
      const result = await sendSlackNotification('Test');

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[SLACK] sendSlackNotification - Failed to send notification:',
        {
          status: 400,
          statusText: 'Bad Request',
        }
      );
    });
  });

  describe('SlackNotifications predefined messages', () => {
    it('should call linkExpired with correct parameters and logging', async () => {
      const { SlackNotifications } = await import(
        '../../lib/slack-notifications'
      );

      const result = await SlackNotifications.linkExpired(
        'https://slack.com/invite',
        5
      );

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[SLACK] SlackNotifications.linkExpired - Sending expiring link notification'
      );

      const [, options] = (global.fetch as any).mock.calls[0];
      const payload = JSON.parse(options.body);
      expect(payload.text).toContain('Expiring Soon');
      expect(
        payload.blocks[1].fields.some((f: any) =>
          f.text.includes('https://slack.com/invite')
        )
      ).toBe(true);
      expect(
        payload.blocks[1].fields.some((f: any) => f.text.includes('5'))
      ).toBe(true);
    });

    it('should call linkInvalid with correct parameters and logging', async () => {
      const { SlackNotifications } = await import(
        '../../lib/slack-notifications'
      );

      const result = await SlackNotifications.linkInvalid(
        'https://slack.com/invalid'
      );

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[SLACK] SlackNotifications.linkInvalid - Sending invalid link notification'
      );

      const [, options] = (global.fetch as any).mock.calls[0];
      const payload = JSON.parse(options.body);
      expect(payload.text).toContain('Invalid');
      expect(
        payload.blocks[1].fields.some((f: any) =>
          f.text.includes('https://slack.com/invalid')
        )
      ).toBe(true);
    });

    it('should call linkUpdated with correct parameters and logging', async () => {
      const { SlackNotifications } = await import(
        '../../lib/slack-notifications'
      );

      const oldUrl = 'https://slack.com/old-invite';
      const newUrl = 'https://slack.com/new-invite';
      const result = await SlackNotifications.linkUpdated(oldUrl, newUrl);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[SLACK] SlackNotifications.linkUpdated - Sending link updated notification'
      );

      const [, options] = (global.fetch as any).mock.calls[0];
      const payload = JSON.parse(options.body);
      expect(payload.text).toContain('Updated');
      expect(
        payload.blocks[1].fields.some((f: any) => f.text.includes('old-invite'))
      ).toBe(true);
      expect(
        payload.blocks[1].fields.some((f: any) => f.text.includes('new-invite'))
      ).toBe(true);
    });
  });
});

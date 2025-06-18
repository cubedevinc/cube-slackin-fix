import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

describe('Slack Notifications', () => {
  const mockFetch = global.fetch as any
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset environment variable for each test
    vi.stubEnv('SLACK_WEBHOOK_URL', 'https://hooks.slack.com/test/webhook')

    // Suppress console outputs in tests
    console.warn = vi.fn()
    console.error = vi.fn()

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    })
  })

  afterEach(() => {
    // Restore original console methods
    console.warn = originalConsoleWarn
    console.error = originalConsoleError
  })

  describe('sendSlackNotification', () => {
    it('should send notification with correct payload structure', async () => {
      const { sendSlackNotification } = await import('../../lib/slack-notifications')

      const message = 'Test notification'
      const details = {
        'Key 1': 'Value 1',
        'Key 2': 'Value 2'
      }

      const result = await sendSlackNotification(message, details)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)

      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://hooks.slack.com/test/webhook')
      expect(options.method).toBe('POST')
      expect(options.headers['Content-Type']).toBe('application/json')

      const payload = JSON.parse(options.body)
      expect(payload.text).toBe(message)
      expect(payload.blocks).toBeDefined()
      expect(payload.blocks[0].text.text).toBe(message)
      expect(payload.blocks[1].fields).toHaveLength(2)
    })

    it('should send simple notification without details', async () => {
      const { sendSlackNotification } = await import('../../lib/slack-notifications')

      const message = 'Simple notification'
      const result = await sendSlackNotification(message)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)

      const [, options] = mockFetch.mock.calls[0]
      const payload = JSON.parse(options.body)
      expect(payload.text).toBe(message)
      expect(payload.blocks).toBeUndefined()
    })

    it('should return false when webhook URL is not configured', async () => {
      vi.stubEnv('SLACK_WEBHOOK_URL', '')

      const { sendSlackNotification } = await import('../../lib/slack-notifications')
      const result = await sendSlackNotification('Test')

      expect(result).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { sendSlackNotification } = await import('../../lib/slack-notifications')
      const result = await sendSlackNotification('Test')

      expect(result).toBe(false)
    })

    it('should handle non-ok responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      })

      const { sendSlackNotification } = await import('../../lib/slack-notifications')
      const result = await sendSlackNotification('Test')

      expect(result).toBe(false)
    })
  })

  describe('SlackNotifications predefined messages', () => {
    it('should call linkExpired with correct parameters', async () => {
      const { SlackNotifications } = await import('../../lib/slack-notifications')

      const result = await SlackNotifications.linkExpired('https://slack.com/invite', 5)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)

      const [, options] = mockFetch.mock.calls[0]
      const payload = JSON.parse(options.body)
      expect(payload.text).toContain('Expiring Soon')
      expect(payload.blocks[1].fields.some((f: any) =>
        f.text.includes('https://slack.com/invite')
      )).toBe(true)
      expect(payload.blocks[1].fields.some((f: any) =>
        f.text.includes('5')
      )).toBe(true)
    })

    it('should call linkInvalid with correct parameters', async () => {
      const { SlackNotifications } = await import('../../lib/slack-notifications')

      const result = await SlackNotifications.linkInvalid('https://slack.com/invalid')

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)

      const [, options] = mockFetch.mock.calls[0]
      const payload = JSON.parse(options.body)
      expect(payload.text).toContain('Invalid')
      expect(payload.blocks[1].fields.some((f: any) =>
        f.text.includes('https://slack.com/invalid')
      )).toBe(true)
    })

    it('should call linkUpdated with correct parameters', async () => {
      const { SlackNotifications } = await import('../../lib/slack-notifications')

      const oldUrl = 'https://slack.com/old-invite'
      const newUrl = 'https://slack.com/new-invite'
      const result = await SlackNotifications.linkUpdated(oldUrl, newUrl)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)

      const [, options] = mockFetch.mock.calls[0]
      const payload = JSON.parse(options.body)
      expect(payload.text).toContain('Updated')
      expect(payload.blocks[1].fields.some((f: any) =>
        f.text.includes('old-invite')
      )).toBe(true)
      expect(payload.blocks[1].fields.some((f: any) =>
        f.text.includes('new-invite')
      )).toBe(true)
    })
  })
})

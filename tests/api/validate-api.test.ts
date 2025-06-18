import { describe, it, expect, beforeEach, vi } from 'vitest'

// Basic API tests for /api/invite/validate endpoint
describe('/api/invite/validate - Basic API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('API Module Structure', () => {
    it('should import POST handler without errors', async () => {
      const { POST } = await import('../../app/api/invite/validate/route')

      expect(typeof POST).toBe('function')
    })

    it('should handle validation when no invite file exists', async () => {
      // First, temporarily remove the invite file to test empty state
      const fs = await import('fs')
      const path = await import('path')
      const dataFile = path.join(process.cwd(), 'data', 'invite.json')

      let originalData = null
      try {
        originalData = await fs.promises.readFile(dataFile, 'utf8')
        await fs.promises.unlink(dataFile) // Remove file temporarily
      } catch {
        // File doesn't exist, which is what we want
      }

      const { POST } = await import('../../app/api/invite/validate/route')

      const response = await POST()
      const result = await response.json()

      // Should return 400 when no invite link exists to validate
      expect(response.status).toBe(400)
      expect(result.error).toBe('No invite link to validate')

      // Restore original file if it existed
      if (originalData) {
        await fs.promises.mkdir(path.dirname(dataFile), { recursive: true })
        await fs.promises.writeFile(dataFile, originalData)
      }
    })
  })
})

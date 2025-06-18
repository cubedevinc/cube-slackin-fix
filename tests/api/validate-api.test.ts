import { describe, it, expect, beforeEach, vi } from 'vitest'

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
      const fs = await import('fs')
      const path = await import('path')
      const dataFile = path.join(process.cwd(), 'data', 'invite.json')

      let originalData = null
      try {
        originalData = await fs.promises.readFile(dataFile, 'utf8')
        await fs.promises.unlink(dataFile)
      } catch {
      }

      const { POST } = await import('../../app/api/invite/validate/route')

      const response = await POST()
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('No invite link to validate')

      if (originalData) {
        await fs.promises.mkdir(path.dirname(dataFile), { recursive: true })
        await fs.promises.writeFile(dataFile, originalData)
      }
    })
  })
})

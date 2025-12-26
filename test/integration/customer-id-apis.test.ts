import request from 'supertest'
import app from '../../backend/services/customer-id-service/src/index'

describe('Customer ID System APIs', () => {
  const customerId = 'test-customer-123'
  const sessionId = 'test-session-456'

  // ============ LOYALTY API TESTS ============
  describe('Loyalty APIs', () => {
    it('should get loyalty info', async () => {
      const res = await request(app)
        .get(`/api/customer-id/loyalty/${customerId}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('points')
      expect(res.body.data).toHaveProperty('tier')
    })

    it('should get loyalty tiers', async () => {
      const res = await request(app)
        .get('/api/customer-id/loyalty/tiers/all')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThan(0)
    })

    it('should add points to customer', async () => {
      const res = await request(app)
        .post(`/api/customer-id/loyalty/${customerId}/points`)
        .send({ points: 100, reason: 'Purchase' })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('points')
    })

    it('should get how to earn points', async () => {
      const res = await request(app)
        .get('/api/customer-id/loyalty/earn/methods')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ============ REFERRAL API TESTS ============
  describe('Referral APIs', () => {
    it('should generate referral link', async () => {
      const res = await request(app)
        .post(`/api/customer-id/referral/${customerId}/generate-link`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('referralCode')
      expect(res.body.data).toHaveProperty('referralLink')
    })

    it('should get referral history', async () => {
      const res = await request(app)
        .get(`/api/customer-id/referral/${customerId}/history`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('should get referral stats', async () => {
      const res = await request(app)
        .get(`/api/customer-id/referral/${customerId}/stats`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('totalReferrals')
      expect(res.body.data).toHaveProperty('totalRewards')
    })
  })

  // ============ SEGMENTATION API TESTS ============
  describe('Segmentation APIs', () => {
    it('should get customer segment', async () => {
      const res = await request(app)
        .get(`/api/customer-id/segmentation/${customerId}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('segment')
    })

    it('should get all segments', async () => {
      const res = await request(app)
        .get('/api/customer-id/segmentation/all/segments')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ============ OFFERS API TESTS ============
  describe('Offers APIs', () => {
    it('should get personalized offers', async () => {
      const res = await request(app)
        .get(`/api/customer-id/offers/${customerId}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('should apply offer', async () => {
      const res = await request(app)
        .post(`/api/customer-id/offers/${customerId}/apply`)
        .send({ offerId: 'offer-123' })
        .expect(200)

      expect(res.body.success).toBe(true)
    })
  })

  // ============ ANALYTICS API TESTS ============
  describe('Analytics APIs', () => {
    it('should get customer analytics', async () => {
      const res = await request(app)
        .get(`/api/customer-id/analytics/${customerId}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('totalPurchases')
      expect(res.body.data).toHaveProperty('totalSpent')
    })

    it('should get purchase history', async () => {
      const res = await request(app)
        .get(`/api/customer-id/analytics/${customerId}/purchase-history`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('should get spending trends', async () => {
      const res = await request(app)
        .get(`/api/customer-id/analytics/${customerId}/spending-trends`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ============ NOTIFICATIONS API TESTS ============
  describe('Notifications APIs', () => {
    it('should get notification preferences', async () => {
      const res = await request(app)
        .get(`/api/customer-id/notifications/${customerId}/preferences`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('emailNotifications')
    })

    it('should update notification preferences', async () => {
      const res = await request(app)
        .put(`/api/customer-id/notifications/${customerId}/preferences`)
        .send({ emailNotifications: false })
        .expect(200)

      expect(res.body.success).toBe(true)
    })

    it('should get notification history', async () => {
      const res = await request(app)
        .get(`/api/customer-id/notifications/${customerId}/history`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ============ SUPPORT TICKETS API TESTS ============
  describe('Support Tickets APIs', () => {
    it('should create support ticket', async () => {
      const res = await request(app)
        .post(`/api/customer-id/support/${customerId}/ticket`)
        .send({
          subject: 'Test Issue',
          description: 'This is a test issue',
          category: 'account'
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('ticketId')
    })

    it('should get customer tickets', async () => {
      const res = await request(app)
        .get(`/api/customer-id/support/${customerId}/tickets`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ============ REWARDS API TESTS ============
  describe('Rewards APIs', () => {
    it('should get special date rewards', async () => {
      const res = await request(app)
        .get(`/api/customer-id/rewards/${customerId}/special-dates`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('should get upcoming rewards', async () => {
      const res = await request(app)
        .get(`/api/customer-id/rewards/${customerId}/upcoming`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('should get all available rewards', async () => {
      const res = await request(app)
        .get('/api/customer-id/rewards/all')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ============ SECURITY API TESTS ============
  describe('Security APIs', () => {
    it('should get security status', async () => {
      const res = await request(app)
        .get(`/api/customer-id/security/${customerId}/status`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('overallRisk')
      expect(res.body.data).toHaveProperty('twoFactorEnabled')
    })

    it('should get fraud alerts', async () => {
      const res = await request(app)
        .get(`/api/customer-id/security/${customerId}/alerts`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('should get security recommendations', async () => {
      const res = await request(app)
        .get(`/api/customer-id/security/${customerId}/recommendations`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('should enable two-factor authentication', async () => {
      const res = await request(app)
        .post(`/api/customer-id/security/${customerId}/2fa/enable`)
        .expect(200)

      expect(res.body.success).toBe(true)
    })
  })

  // ============ CUSTOMER SUPPORT API TESTS ============
  describe('Customer Support APIs', () => {
    it('should get support categories', async () => {
      const res = await request(app)
        .get('/api/customer-id/support-chat/categories')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('should start live chat', async () => {
      const res = await request(app)
        .post(`/api/customer-id/support-chat/${customerId}/start`)
        .send({
          topic: 'account',
          message: 'I need help with my account'
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('sessionId')
    })

    it('should get FAQ', async () => {
      const res = await request(app)
        .get('/api/customer-id/support-chat/faq')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('should search FAQ', async () => {
      const res = await request(app)
        .get('/api/customer-id/support-chat/faq/search?query=password')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })
})

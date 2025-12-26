import { Request, Response } from 'express'
import { CustomerSupportService } from '../services/customer-support.service'

export class CustomerSupportController {
  private supportService = new CustomerSupportService()

  // Get live chat sessions
  async getLiveChatSessions(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const sessions = await this.supportService.getLiveChatSessions(customerId)
      res.json({ success: true, data: sessions })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Start live chat
  async startLiveChat(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const { topic, message } = req.body
      const session = await this.supportService.startLiveChat(customerId, topic, message)
      res.json({ success: true, data: session })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Send chat message
  async sendChatMessage(req: Request, res: Response) {
    try {
      const { sessionId } = req.params
      const { customerId, message } = req.body
      const result = await this.supportService.sendChatMessage(sessionId, customerId, message)
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get chat history
  async getChatHistory(req: Request, res: Response) {
    try {
      const { sessionId } = req.params
      const history = await this.supportService.getChatHistory(sessionId)
      res.json({ success: true, data: history })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get FAQ
  async getFAQ(req: Request, res: Response) {
    try {
      const { category } = req.query
      const faq = await this.supportService.getFAQ(category as string)
      res.json({ success: true, data: faq })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Search FAQ
  async searchFAQ(req: Request, res: Response) {
    try {
      const { query } = req.query
      const results = await this.supportService.searchFAQ(query as string)
      res.json({ success: true, data: results })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get support categories
  async getSupportCategories(req: Request, res: Response) {
    try {
      const categories = await this.supportService.getSupportCategories()
      res.json({ success: true, data: categories })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Close chat session
  async closeChatSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params
      const result = await this.supportService.closeChatSession(sessionId)
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}

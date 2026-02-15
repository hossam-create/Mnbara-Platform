import { Request, Response } from 'express'
import { SupportService } from '../services/support.service'

export class SupportController {
  private supportService = new SupportService()

  async createTicket(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const { title, category, priority, description } = req.body
      const ticket = await this.supportService.createTicket(customerId, { title, category, priority, description })
      res.json({ success: true, data: ticket })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  async getTickets(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const tickets = await this.supportService.getTickets(customerId)
      res.json({ success: true, data: tickets })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  async getTicketDetails(req: Request, res: Response) {
    try {
      const { ticketId } = req.params
      const details = await this.supportService.getTicketDetails(ticketId)
      res.json({ success: true, data: details })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  async addComment(req: Request, res: Response) {
    try {
      const { ticketId } = req.params
      const { comment } = req.body
      const result = await this.supportService.addComment(ticketId, comment)
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  async updateTicketStatus(req: Request, res: Response) {
    try {
      const { ticketId } = req.params
      const { status } = req.body
      const result = await this.supportService.updateTicketStatus(ticketId, status)
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}

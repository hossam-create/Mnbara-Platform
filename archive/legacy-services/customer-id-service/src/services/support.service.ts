import { PrismaClient } from '@prisma/client'
import * as crypto from 'crypto'

export class SupportService {
  private prisma = new PrismaClient()

  async createTicket(customerId: string, data: any) {
    const ticketId = `TKT-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketId,
        customerId,
        title: data.title,
        category: data.category,
        priority: data.priority,
        description: data.description,
        status: 'open'
      }
    })

    return {
      id: ticket.id,
      ticketId: ticket.ticketId,
      title: ticket.title,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt
    }
  }

  async getTickets(customerId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' }
    })

    return tickets.map(t => ({
      id: t.id,
      ticketId: t.ticketId,
      title: t.title,
      category: t.category,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }))
  }

  async getTicketDetails(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { ticketId },
      include: { comments: true }
    })

    if (!ticket) {
      throw new Error('Ticket not found')
    }

    return {
      id: ticket.id,
      ticketId: ticket.ticketId,
      title: ticket.title,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      description: ticket.description,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      comments: ticket.comments.map(c => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt
      }))
    }
  }

  async addComment(ticketId: string, comment: string) {
    const newComment = await this.prisma.ticketComment.create({
      data: {
        ticketId,
        text: comment
      }
    })

    return {
      id: newComment.id,
      text: newComment.text,
      createdAt: newComment.createdAt
    }
  }

  async updateTicketStatus(ticketId: string, status: string) {
    const ticket = await this.prisma.supportTicket.update({
      where: { ticketId },
      data: { status }
    })

    return {
      ticketId: ticket.ticketId,
      status: ticket.status,
      updatedAt: ticket.updatedAt
    }
  }
}

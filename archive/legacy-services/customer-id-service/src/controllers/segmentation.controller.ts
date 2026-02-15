import { Request, Response } from 'express'
import { SegmentationService } from '../services/segmentation.service'

export class SegmentationController {
  private segmentationService = new SegmentationService()

  // Get customer segment
  async getCustomerSegment(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const segment = await this.segmentationService.getCustomerSegment(customerId)
      res.json({ success: true, data: segment })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get all segments
  async getAllSegments(req: Request, res: Response) {
    try {
      const segments = await this.segmentationService.getAllSegments()
      res.json({ success: true, data: segments })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get segment benefits
  async getSegmentBenefits(req: Request, res: Response) {
    try {
      const { segment } = req.params
      const benefits = await this.segmentationService.getSegmentBenefits(segment)
      res.json({ success: true, data: benefits })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Get segment statistics
  async getSegmentStats(req: Request, res: Response) {
    try {
      const stats = await this.segmentationService.getSegmentStats()
      res.json({ success: true, data: stats })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  // Update customer segment
  async updateCustomerSegment(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const { segment } = req.body
      const result = await this.segmentationService.updateCustomerSegment(customerId, segment)
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}

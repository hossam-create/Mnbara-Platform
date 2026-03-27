import { Request, Response } from 'express'
import { OffersService } from '../services/offers.service'

export class OffersController {
  private offersService = new OffersService()

  async getPersonalizedOffers(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const offers = await this.offersService.getPersonalizedOffers(customerId)
      res.json({ success: true, data: offers })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  async applyOffer(req: Request, res: Response) {
    try {
      const { customerId, offerId } = req.body
      const result = await this.offersService.applyOffer(customerId, offerId)
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  async getOfferHistory(req: Request, res: Response) {
    try {
      const { customerId } = req.params
      const history = await this.offersService.getOfferHistory(customerId)
      res.json({ success: true, data: history })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  async getOfferDetails(req: Request, res: Response) {
    try {
      const { offerId } = req.params
      const details = await this.offersService.getOfferDetails(offerId)
      res.json({ success: true, data: details })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}

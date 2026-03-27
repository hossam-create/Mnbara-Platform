import { Request, Response } from 'express';
import { CampaignManager } from '../services/CampaignManager';

export class CampaignController {
    private manager: CampaignManager;

    constructor() {
        this.manager = new CampaignManager();
    }

    public create(req: Request, res: Response) {
        try {
            const campaign = this.manager.createCampaign(req.body);
            res.status(201).json(campaign);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create campaign' });
        }
    }

    public list(req: Request, res: Response) {
        try {
            const { sellerId } = req.query;
            if (typeof sellerId !== 'string') return res.status(400).json({ error: 'Seller ID required' });
            
            const campaigns = this.manager.getSellerCampaigns(sellerId);
            res.json(campaigns);
        } catch (error) {
            res.status(500).json({ error: 'Failed to list campaigns' });
        }
    }
}


export interface AdCampaign {
    id: string;
    sellerId: string;
    name: string;
    dailyBudget: number;
    status: 'ACTIVE' | 'PAUSED' | 'ENDED';
    bidStrategy: 'AUTO' | 'MANUAL';
    items: string[]; // Listing IDs
}

export class CampaignManager {
    
    // In-memory store for demo. Replace with DB.
    private campaigns: Map<string, AdCampaign> = new Map();

    public createCampaign(data: Omit<AdCampaign, 'id' | 'status'>): AdCampaign {
        const id = `CMP-${Math.floor(Math.random() * 100000)}`;
        const campaign: AdCampaign = {
            id,
            ...data,
            status: 'ACTIVE'
        };
        this.campaigns.set(id, campaign);
        return campaign;
    }

    public getSellerCampaigns(sellerId: string): AdCampaign[] {
        return Array.from(this.campaigns.values()).filter(c => c.sellerId === sellerId);
    }
}

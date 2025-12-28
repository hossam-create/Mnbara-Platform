
export interface AuctionRequest {
    keyword?: string;
    categoryId?: string;
    slots: number;
}

export interface Ad {
    id: string;
    listingId: string;
    bidAmount: number;
    relevanceScore: number; // 0-1
}

export class AdAuctionEngine {

    /**
     * Selects winning ads based on the VCG (Vickrey-Clarke-Groves) or GSP (Generalized Second Price) model.
     * Simplified here to: Score = Bid * Relevance.
     */
    public runAuction(request: AuctionRequest, candidates: Ad[]): Ad[] {
        // 1. Filter candidates (Must match keyword/category - simplified here)
        
        // 2. Calculate Ad Rank
        const rankedAds = candidates.map(ad => ({
            ...ad,
            adRank: ad.bidAmount * ad.relevanceScore
        }));

        // 3. Sort by Rank (Desc)
        rankedAds.sort((a, b) => b.adRank - a.adRank);

        // 4. Return top N slots
        return rankedAds.slice(0, request.slots);
    }
}

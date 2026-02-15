import { Request, Response } from 'express';
import { PolicyEnforcementScanner, ContentScanRequest } from '../services/PolicyEnforcementScanner';

export class PolicyController {
    
    private scanner: PolicyEnforcementScanner;

    constructor() {
        this.scanner = new PolicyEnforcementScanner();
    }

    /**
     * POST /policy/scan
     * Scan text content for violations.
     */
    public async scanContent(req: Request, res: Response) {
        try {
            const { text, type, userId } = req.body;

            if (!text || !type) {
                return res.status(400).json({ error: 'Missing required text or type' });
            }

            const request: ContentScanRequest = {
                text,
                type,
                userId: userId || 'anonymous'
            };

            const result = this.scanner.scanContent(request);

            return res.json(result);

        } catch (error) {
            console.error('Error scanning content:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

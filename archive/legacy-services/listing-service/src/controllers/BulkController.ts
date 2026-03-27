import { Request, Response } from 'express';
import { CsvImportService } from '../services/CsvImportService';

export class BulkController {
    private importService: CsvImportService;

    constructor() {
        this.importService = new CsvImportService();
    }

    public async uploadInventory(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No CSV file uploaded' });
            }

            const result = await this.importService.processUpload(req.file.buffer);

            res.json({
                message: 'Bulk processing complete',
                ...result
            });
        } catch (error) {
            console.error('Bulk upload error:', error);
            res.status(500).json({ error: 'Failed to process CSV' });
        }
    }
}

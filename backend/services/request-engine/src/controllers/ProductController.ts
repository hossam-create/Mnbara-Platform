import { Request, Response } from 'express';
import { ProductExtractionService } from '../services/ProductExtractionService';

export class ProductController {
  constructor(private productExtractionService: ProductExtractionService) {}

  async extractProduct(req: Request, res: Response): Promise<void> {
    try {
      const { url } = req.body;
      
      if (!url) {
        res.status(400).json({ error: 'URL is required' });
        return;
      }

      const result = await this.productExtractionService.extractFromUrl(url);
      
      if (result.success && result.product) {
        res.status(200).json({
          success: true,
          data: result.product,
          metadata: result.metadata
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || 'Failed to extract product'
        });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = await this.productExtractionService.getProductById(id);
      
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.status(200).json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

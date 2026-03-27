import { Request, Response } from 'express';
import { ProductManagementService } from '../services/product-management.service';

const productService = new ProductManagementService();

export class ProductController {
  async create(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const product = await productService.createProduct(sellerId, req.body);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const products = await productService.getSellerProducts(sellerId, req.query);
      res.json(products);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const { sellerId, productId } = req.params;
      const product = await productService.getProduct(productId, sellerId);
      res.json(product);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { sellerId, productId } = req.params;
      const product = await productService.updateProduct(productId, sellerId, req.body);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { sellerId, productId } = req.params;
      await productService.deleteProduct(productId, sellerId);
      res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async publish(req: Request, res: Response) {
    try {
      const { sellerId, productId } = req.params;
      const product = await productService.publishProduct(productId, sellerId);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async bulkUpdateStatus(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const { productIds, status } = req.body;
      await productService.bulkUpdateStatus(productIds, sellerId, status);
      res.json({ message: 'Products updated successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

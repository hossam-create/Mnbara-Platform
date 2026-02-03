import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';

const productService = new ProductService();

export class ProductController {
  async create(req: Request, res: Response) {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const product = await productService.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const filters = {
        status: req.query.status as string,
        sellerId: req.query.sellerId as string,
        categoryId: req.query.categoryId as string,
        collectionId: req.query.collectionId as string,
        q: req.query.q as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const result = await productService.listProducts(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await productService.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getByHandle(req: Request, res: Response) {
    try {
      const product = await productService.getProductByHandle(req.params.handle);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async addVariant(req: Request, res: Response) {
    try {
      const variant = await productService.addVariant(req.params.id, req.body);
      res.status(201).json(variant);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateInventory(req: Request, res: Response) {
    try {
      const { variantId } = req.params;
      const { quantity } = req.body;
      const variant = await productService.updateInventory(variantId, quantity);
      res.json(variant);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

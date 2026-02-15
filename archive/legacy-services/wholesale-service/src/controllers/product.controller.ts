// Product Controller - Wholesale B2B
// متحكم المنتجات - البيع بالجملة

import { Request, Response } from 'express';
import { productService } from '../services/product.service';

export class ProductController {
  // Create product
  async create(req: Request, res: Response) {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        messageAr: 'تم إنشاء المنتج بنجاح',
        data: product
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get product by ID
  async getById(req: Request, res: Response) {
    try {
      const product = await productService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          messageAr: 'المنتج غير موجود'
        });
      }
      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update product
  async update(req: Request, res: Response) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Product updated successfully',
        messageAr: 'تم تحديث المنتج بنجاح',
        data: product
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Delete product
  async delete(req: Request, res: Response) {
    try {
      await productService.deleteProduct(req.params.id);
      res.json({
        success: true,
        message: 'Product deleted successfully',
        messageAr: 'تم حذف المنتج بنجاح'
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // List products
  async list(req: Request, res: Response) {
    try {
      const { supplierId, category, subcategory, countryOfOrigin, minPrice, maxPrice, inStock, status, page, limit, sortBy, sortOrder } = req.query;
      const result = await productService.listProducts(
        {
          supplierId: supplierId as string,
          category: category as string,
          subcategory: subcategory as string,
          countryOfOrigin: countryOfOrigin as string,
          minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
          inStock: inStock === 'true',
          status: status as any
        },
        parseInt(page as string) || 1,
        parseInt(limit as string) || 20,
        sortBy as string || 'createdAt',
        (sortOrder as 'asc' | 'desc') || 'desc'
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Search products
  async search(req: Request, res: Response) {
    try {
      const { q, category, countryOfOrigin, page, limit } = req.query;
      const result = await productService.searchProducts(
        q as string || '',
        { category: category as string, countryOfOrigin: countryOfOrigin as string },
        parseInt(page as string) || 1,
        parseInt(limit as string) || 20
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get price for quantity
  async getPrice(req: Request, res: Response) {
    try {
      const { quantity } = req.query;
      const pricing = await productService.getPriceForQuantity(
        req.params.id,
        parseInt(quantity as string) || 1
      );
      res.json({ success: true, data: pricing });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Add pricing tier
  async addPricingTier(req: Request, res: Response) {
    try {
      const { minQuantity, maxQuantity, pricePerUnit } = req.body;
      const tier = await productService.addPricingTier(
        req.params.id,
        minQuantity,
        maxQuantity,
        pricePerUnit
      );
      res.status(201).json({
        success: true,
        message: 'Pricing tier added',
        messageAr: 'تم إضافة مستوى السعر',
        data: tier
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Update stock
  async updateStock(req: Request, res: Response) {
    try {
      const { quantity, operation } = req.body;
      const product = await productService.updateStock(req.params.id, quantity, operation);
      res.json({
        success: true,
        message: 'Stock updated',
        messageAr: 'تم تحديث المخزون',
        data: { stockQuantity: product.stockQuantity }
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Check availability
  async checkAvailability(req: Request, res: Response) {
    try {
      const { quantity } = req.query;
      const availability = await productService.checkAvailability(
        req.params.id,
        parseInt(quantity as string) || 1
      );
      res.json({ success: true, data: availability });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get categories
  async getCategories(req: Request, res: Response) {
    try {
      const categories = await productService.getCategories();
      res.json({ success: true, data: categories });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const productController = new ProductController();

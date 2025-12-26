import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { invalidateCategoryCache } from '../middleware/cache';
import { getCategoryWebSocketService } from '../websocket/categoryWebSocket';

const prisma = new PrismaClient();

interface BulkOperation {
  type: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
  items: any[];
  options?: {
    validateOnly?: boolean;
    continueOnError?: boolean;
    batchSize?: number;
  };
}

interface BulkOperationResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    index: number;
    item: any;
    error: string;
  }>;
  results: any[];
}

class CategoryBulkController {
  async bulkCreate(req: Request, res: Response): Promise<void> {
    try {
      const { items, options = {} }: BulkOperation = req.body;
      const { validateOnly = false, continueOnError = false, batchSize = 50 } = options;

      const result: BulkOperationResult = {
        total: items.length,
        successful: 0,
        failed: 0,
        errors: [],
        results: []
      };

      // Validate items first
      const validationErrors = await this.validateBulkCreateItems(items);
      if (validationErrors.length > 0 && !continueOnError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
        return;
      }

      if (validateOnly) {
        res.json({
          success: true,
          message: 'Validation completed',
          validationErrors,
          result
        });
        return;
      }

      // Process in batches
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        for (let j = 0; j < batch.length; j++) {
          const item = batch[j];
          const index = i + j;

          try {
            const created = await this.createSingleCategory(item);
            result.successful++;
            result.results.push(created);
          } catch (error) {
            result.failed++;
            result.errors.push({
              index,
              item,
              error: error.message
            });

            if (!continueOnError) {
              break;
            }
          }
        }
      }

      // Invalidate cache and broadcast updates
      await invalidateCategoryCache();
      this.broadcastBulkUpdate('bulk_create', result.results);

      res.json({
        success: true,
        message: `Bulk create completed. ${result.successful} successful, ${result.failed} failed`,
        result
      });
    } catch (error) {
      console.error('Bulk create error:', error);
      res.status(500).json({
        success: false,
        message: 'Bulk create failed',
        error: error.message
      });
    }
  }

  async bulkUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { items, options = {} }: BulkOperation = req.body;
      const { validateOnly = false, continueOnError = false, batchSize = 50 } = options;

      const result: BulkOperationResult = {
        total: items.length,
        successful: 0,
        failed: 0,
        errors: [],
        results: []
      };

      // Validate items
      const validationErrors = await this.validateBulkUpdateItems(items);
      if (validationErrors.length > 0 && !continueOnError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
        return;
      }

      if (validateOnly) {
        res.json({
          success: true,
          message: 'Validation completed',
          validationErrors,
          result
        });
        return;
      }

      // Process in batches
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        for (let j = 0; j < batch.length; j++) {
          const item = batch[j];
          const index = i + j;

          try {
            const updated = await this.updateSingleCategory(item.id, item.data);
            result.successful++;
            result.results.push(updated);
          } catch (error) {
            result.failed++;
            result.errors.push({
              index,
              item,
              error: error.message
            });

            if (!continueOnError) {
              break;
            }
          }
        }
      }

      // Invalidate cache and broadcast updates
      await invalidateCategoryCache();
      this.broadcastBulkUpdate('bulk_update', result.results);

      res.json({
        success: true,
        message: `Bulk update completed. ${result.successful} successful, ${result.failed} failed`,
        result
      });
    } catch (error) {
      console.error('Bulk update error:', error);
      res.status(500).json({
        success: false,
        message: 'Bulk update failed',
        error: error.message
      });
    }
  }

  async bulkDelete(req: Request, res: Response): Promise<void> {
    try {
      const { categoryIds, options = {} } = req.body;
      const { validateOnly = false, continueOnError = false, batchSize = 50 } = options;

      const result: BulkOperationResult = {
        total: categoryIds.length,
        successful: 0,
        failed: 0,
        errors: [],
        results: []
      };

      // Validate deletions (check for dependencies)
      const validationErrors = await this.validateBulkDeleteItems(categoryIds);
      if (validationErrors.length > 0 && !continueOnError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
        return;
      }

      if (validateOnly) {
        res.json({
          success: true,
          message: 'Validation completed',
          validationErrors,
          result
        });
        return;
      }

      // Process in batches
      for (let i = 0; i < categoryIds.length; i += batchSize) {
        const batch = categoryIds.slice(i, i + batchSize);
        
        for (let j = 0; j < batch.length; j++) {
          const categoryId = batch[j];
          const index = i + j;

          try {
            await this.deleteSingleCategory(categoryId);
            result.successful++;
            result.results.push({ id: categoryId, deleted: true });
          } catch (error) {
            result.failed++;
            result.errors.push({
              index,
              item: { id: categoryId },
              error: error.message
            });

            if (!continueOnError) {
              break;
            }
          }
        }
      }

      // Invalidate cache and broadcast updates
      await invalidateCategoryCache();
      this.broadcastBulkUpdate('bulk_delete', result.results);

      res.json({
        success: true,
        message: `Bulk delete completed. ${result.successful} successful, ${result.failed} failed`,
        result
      });
    } catch (error) {
      console.error('Bulk delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Bulk delete failed',
        error: error.message
      });
    }
  }

  async bulkActivate(req: Request, res: Response): Promise<void> {
    try {
      const { categoryIds, activate = true } = req.body;

      const result = await prisma.category.updateMany({
        where: {
          id: { in: categoryIds }
        },
        data: {
          isActive: activate
        }
      });

      // Invalidate cache and broadcast updates
      await invalidateCategoryCache();
      this.broadcastBulkUpdate(activate ? 'bulk_activate' : 'bulk_deactivate', categoryIds);

      res.json({
        success: true,
        message: `Successfully ${activate ? 'activated' : 'deactivated'} ${result.count} categories`,
        result: {
          total: categoryIds.length,
          updated: result.count
        }
      });
    } catch (error) {
      console.error('Bulk activate/deactivate error:', error);
      res.status(500).json({
        success: false,
        message: 'Bulk status update failed',
        error: error.message
      });
    }
  }

  async bulkImport(req: Request, res: Response): Promise<void> {
    try {
      const { file, options = {} } = req.body;
      const { validateOnly = false, continueOnError = false } = options;

      // This would handle file upload and parsing
      // For now, assuming file content is provided directly
      const categories = file; // Parsed categories from file

      const result: BulkOperationResult = {
        total: categories.length,
        successful: 0,
        failed: 0,
        errors: [],
        results: []
      };

      // Process import
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];

        try {
          const created = await this.createSingleCategory(category);
          result.successful++;
          result.results.push(created);
        } catch (error) {
          result.failed++;
          result.errors.push({
            index: i,
            item: category,
            error: error.message
          });

          if (!continueOnError) {
            break;
          }
        }
      }

      // Invalidate cache and broadcast updates
      await invalidateCategoryCache();
      this.broadcastBulkUpdate('bulk_import', result.results);

      res.json({
        success: true,
        message: `Import completed. ${result.successful} successful, ${result.failed} failed`,
        result
      });
    } catch (error) {
      console.error('Bulk import error:', error);
      res.status(500).json({
        success: false,
        message: 'Bulk import failed',
        error: error.message
      });
    }
  }

  async bulkExport(req: Request, res: Response): Promise<void> {
    try {
      const { format = 'json', filters = {} } = req.query;

      const categories = await prisma.category.findMany({
        where: filters,
        include: {
          stats: true,
          parent: true,
          children: true
        }
      });

      let exportData;
      let contentType;
      let filename;

      switch (format) {
        case 'csv':
          exportData = this.convertToCSV(categories);
          contentType = 'text/csv';
          filename = 'categories.csv';
          break;
        case 'xlsx':
          // Would need xlsx library for this
          exportData = JSON.stringify(categories, null, 2);
          contentType = 'application/json';
          filename = 'categories.json';
          break;
        default:
          exportData = JSON.stringify(categories, null, 2);
          contentType = 'application/json';
          filename = 'categories.json';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
    } catch (error) {
      console.error('Bulk export error:', error);
      res.status(500).json({
        success: false,
        message: 'Bulk export failed',
        error: error.message
      });
    }
  }

  private async validateBulkCreateItems(items: any[]): Promise<string[]> {
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (!item.name) {
        errors.push(`Item ${i}: Name is required`);
      }
      
      if (!item.slug) {
        errors.push(`Item ${i}: Slug is required`);
      }

      // Check for duplicate slugs
      const existing = await prisma.category.findUnique({
        where: { slug: item.slug }
      });
      
      if (existing) {
        errors.push(`Item ${i}: Slug '${item.slug}' already exists`);
      }
    }

    return errors;
  }

  private async validateBulkUpdateItems(items: any[]): Promise<string[]> {
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (!item.id) {
        errors.push(`Item ${i}: ID is required for update`);
        continue;
      }

      const existing = await prisma.category.findUnique({
        where: { id: item.id }
      });
      
      if (!existing) {
        errors.push(`Item ${i}: Category with ID '${item.id}' not found`);
      }

      if (item.data?.slug && item.data.slug !== existing?.slug) {
        const slugExists = await prisma.category.findUnique({
          where: { slug: item.data.slug }
        });
        
        if (slugExists) {
          errors.push(`Item ${i}: Slug '${item.data.slug}' already exists`);
        }
      }
    }

    return errors;
  }

  private async validateBulkDeleteItems(categoryIds: string[]): Promise<string[]> {
    const errors: string[] = [];

    for (const categoryId of categoryIds) {
      // Check if category has products
      const productCount = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { productCount: true }
      });

      if (productCount?.productCount > 0) {
        errors.push(`Category ${categoryId} has ${productCount.productCount} products and cannot be deleted`);
      }

      // Check if category has children
      const childrenCount = await prisma.category.count({
        where: { parentId: categoryId }
      });

      if (childrenCount > 0) {
        errors.push(`Category ${categoryId} has ${childrenCount} child categories and cannot be deleted`);
      }
    }

    return errors;
  }

  private async createSingleCategory(item: any): Promise<any> {
    return await prisma.category.create({
      data: {
        name: item.name,
        nameAr: item.nameAr,
        slug: item.slug,
        description: item.description,
        level: item.level,
        parentId: item.parentId,
        displayOrder: item.displayOrder,
        isActive: item.isActive ?? true,
        productCount: 0
      }
    });
  }

  private async updateSingleCategory(categoryId: string, data: any): Promise<any> {
    return await prisma.category.update({
      where: { id: categoryId },
      data
    });
  }

  private async deleteSingleCategory(categoryId: string): Promise<void> {
    await prisma.category.delete({
      where: { id: categoryId }
    });
  }

  private convertToCSV(categories: any[]): string {
    const headers = ['ID', 'Name', 'Arabic Name', 'Slug', 'Level', 'Parent ID', 'Product Count', 'Active'];
    const rows = categories.map(cat => [
      cat.id,
      cat.name,
      cat.nameAr || '',
      cat.slug,
      cat.level,
      cat.parentId || '',
      cat.productCount,
      cat.isActive
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private broadcastBulkUpdate(type: string, results: any[]): void {
    try {
      const ws = getCategoryWebSocketService();
      ws.broadcastBulkOperation({
        type: type as any,
        categoryIds: results.map(r => r.id || r.categoryId),
        userId: 'system', // Would get from authenticated user
        results
      });
    } catch (error) {
      console.error('Error broadcasting bulk update:', error);
    }
  }
}

export const categoryBulkController = new CategoryBulkController();
export default CategoryBulkController;

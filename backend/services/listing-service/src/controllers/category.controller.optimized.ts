import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OptimizedCategoryController {
    // Get categories with optimized queries
    async getCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const { level, parentId, search, limit = 50, offset = 0, sort = 'displayOrder' } = req.query;
            const { includeStats = false, includeChildren = false } = req.query;

            // Build where clause
            const where: any = { isActive: true };
            
            if (level) where.level = parseInt(level as string);
            if (parentId) where.parentId = parentId === 'null' ? null : parentId;
            
            // Full-text search
            if (search) {
                where.OR = [
                    { name: { contains: search as string, mode: 'insensitive' } },
                    { nameAr: { contains: search as string, mode: 'insensitive' } },
                    { description: { contains: search as string, mode: 'insensitive' } }
                ];
            }

            // Build select clause
            const select: any = {
                id: true,
                name: true,
                nameAr: true,
                slug: true,
                level: true,
                parentId: true,
                displayOrder: true,
                isActive: true,
                hasChildren: true,
                productCount: true,
                path: true,
                depth: true
            };

            // Include stats if requested
            if (includeStats === 'true') {
                select.stats = {
                    select: {
                        productCount: true,
                        activeListings: true,
                        soldProducts: true,
                        avgPrice: true,
                        totalRevenue: true,
                        viewCount: true
                    }
                };
            }

            // Include children if requested
            if (includeChildren === 'true') {
                select.children = {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        nameAr: true,
                        slug: true,
                        level: true,
                        displayOrder: true,
                        productCount: true,
                        hasChildren: true
                    },
                    orderBy: { displayOrder: 'asc' }
                };
            }

            // Build order by clause
            const orderBy: any = {};
            switch (sort) {
                case 'name':
                    orderBy.name = 'asc';
                    break;
                case 'nameAr':
                    orderBy.nameAr = 'asc';
                    break;
                case 'productCount':
                    orderBy.productCount = 'desc';
                    break;
                case 'level':
                    orderBy.level = 'asc';
                    break;
                default:
                    orderBy.displayOrder = 'asc';
            }

            // Execute optimized query
            const categories = await prisma.category.findMany({
                where,
                select,
                orderBy,
                take: parseInt(limit as string),
                skip: parseInt(offset as string)
            });

            // Get total count for pagination
            const total = await prisma.category.count({ where });

            res.json({
                success: true,
                data: categories,
                meta: {
                    total,
                    limit: parseInt(limit as string),
                    offset: parseInt(offset as string),
                    hasMore: (parseInt(offset as string) + categories.length) < total
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get category tree using materialized view for performance
    async getCategoryTree(req: Request, res: Response, next: NextFunction) {
        try {
            const { level, maxDepth = 4, includeStats = false } = req.query;

            // Use materialized view for tree structure
            const treeQuery = `
                WITH RECURSIVE category_tree AS (
                    -- Base case: root categories
                    SELECT 
                        id, name, nameAr, slug, level, depth, path, 
                        parentId, displayOrder, isActive, hasChildren,
                        productCount, actualProductCount, activeListings, 
                        avgPrice, totalRevenue, parentName, parentNameAr, 
                        parentSlug, rootName, rootNameAr, rootSlug,
                        1 as current_depth
                    FROM "CategoryTreeView" 
                    WHERE parentId IS NULL AND isActive = true
                    ${level ? `AND level = ${parseInt(level as string)}` : ''}
                    
                    UNION ALL
                    
                    -- Recursive case: children
                    SELECT 
                        ct.id, ct.name, ct.nameAr, ct.slug, ct.level, ct.depth, ct.path,
                        ct.parentId, ct.displayOrder, ct.isActive, ct.hasChildren,
                        ct.productCount, ct.actualProductCount, ct.activeListings,
                        ct.avgPrice, ct.totalRevenue, ct.parentName, ct.parentNameAr,
                        ct.parentSlug, ct.rootName, ct.rootNameAr, ct.rootSlug,
                        ct_current.current_depth + 1
                    FROM "CategoryTreeView" ct
                    JOIN category_tree ct_current ON ct.parentId = ct_current.id
                    WHERE ct.isActive = true AND ct_current.current_depth < ${maxDepth}
                )
                SELECT * FROM category_tree 
                ORDER BY depth, displayOrder
            `;

            const tree = await prisma.$queryRawUnsafe(treeQuery);

            // Build hierarchical structure
            const buildTree = (categories: any[], parentId: string | null = null): any[] => {
                return categories
                    .filter(cat => cat.parentId === parentId)
                    .map(cat => ({
                        id: cat.id,
                        name: cat.name,
                        nameAr: cat.nameAr,
                        slug: cat.slug,
                        level: cat.level,
                        depth: cat.depth,
                        path: cat.path,
                        displayOrder: cat.displayOrder,
                        productCount: includeStats === 'true' ? {
                            actual: cat.actualProductCount,
                            cached: cat.productCount,
                            active: cat.activeListings,
                            avgPrice: cat.avgPrice,
                            totalRevenue: cat.totalRevenue
                        } : cat.productCount,
                        hasChildren: cat.hasChildren,
                        children: buildTree(categories, cat.id),
                        parent: parentId ? {
                            id: parentId,
                            name: cat.parentName,
                            nameAr: cat.parentNameAr,
                            slug: cat.parentSlug
                        } : null,
                        root: cat.level > 1 ? {
                            name: cat.rootName,
                            nameAr: cat.rootNameAr,
                            slug: cat.rootSlug
                        } : null
                    }));
            };

            const hierarchicalTree = buildTree(tree as any[]);

            res.json({
                success: true,
                data: hierarchicalTree,
                meta: {
                    totalNodes: tree.length,
                    maxDepth: parseInt(maxDepth as string)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get single category with full details
    async getCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { includePath = true, includeStats = true, includeChildren = false } = req.query;

            // Use materialized view for performance
            const category = await prisma.$queryRaw`
                SELECT * FROM "CategoryTreeView" 
                WHERE id = ${id} AND isActive = true
                LIMIT 1
            ` as any[];

            if (!category.length) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            const cat = category[0];

            // Get breadcrumb path
            let breadcrumb = [];
            if (includePath === 'true' && cat.path) {
                const pathIds = cat.path.split('/').filter((p: string) => p);
                breadcrumb = await prisma.$queryRaw`
                    SELECT id, name, nameAr, slug, level 
                    FROM "Category" 
                    WHERE id = ANY(${pathIds}) AND isActive = true
                    ORDER BY level
                `;
            }

            // Get children if requested
            let children = [];
            if (includeChildren === 'true') {
                children = await prisma.category.findMany({
                    where: { parentId: id, isActive: true },
                    select: {
                        id: true,
                        name: true,
                        nameAr: true,
                        slug: true,
                        level: true,
                        displayOrder: true,
                        productCount: true,
                        hasChildren: true,
                        stats: includeStats === 'true' ? {
                            select: {
                                productCount: true,
                                activeListings: true,
                                avgPrice: true
                            }
                        } : false
                    },
                    orderBy: { displayOrder: 'asc' }
                });
            }

            const response = {
                id: cat.id,
                name: cat.name,
                nameAr: cat.nameAr,
                slug: cat.slug,
                description: cat.description,
                level: cat.level,
                depth: cat.depth,
                path: cat.path,
                parentId: cat.parentId,
                displayOrder: cat.displayOrder,
                isActive: cat.isActive,
                hasChildren: cat.hasChildren,
                productCount: cat.productCount,
                breadcrumb,
                children: children.length > 0 ? children : undefined,
                stats: includeStats === 'true' ? {
                    productCount: cat.actualProductCount,
                    activeListings: cat.activeListings,
                    soldProducts: cat.soldProducts || 0,
                    avgPrice: parseFloat(cat.avgPrice) || 0,
                    totalRevenue: parseFloat(cat.totalRevenue) || 0,
                    viewCount: parseInt(cat.viewCount) || 0
                } : undefined,
                parent: cat.parentId ? {
                    id: cat.parentId,
                    name: cat.parentName,
                    nameAr: cat.parentNameAr,
                    slug: cat.parentSlug
                } : null,
                root: cat.level > 1 ? {
                    name: cat.rootName,
                    nameAr: cat.rootNameAr,
                    slug: cat.rootSlug
                } : null
            };

            res.json({
                success: true,
                data: response
            });
        } catch (error) {
            next(error);
        }
    }

    // Get category statistics with real-time data
    async getCategoryStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { refresh = false } = req.query;

            let stats;

            if (refresh === 'true') {
                // Force refresh stats
                await prisma.$executeRaw`SELECT update_category_stats(${id})`;
            }

            // Get stats from CategoryStats table
            stats = await prisma.categoryStats.findUnique({
                where: { categoryId: id }
            });

            if (!stats) {
                // Generate stats if not exists
                await prisma.$executeRaw`SELECT update_category_stats(${id})`;
                stats = await prisma.categoryStats.findUnique({
                    where: { categoryId: id }
                });
            }

            // Get additional metrics
            const additionalMetrics = await prisma.$queryRaw`
                SELECT 
                    COUNT(DISTINCT seller_id) as totalSellers,
                    COUNT(DISTINCT buyer_id) as totalBuyers,
                    AVG(price) as medianPrice,
                    MIN(price) as minPrice,
                    MAX(price) as maxPrice,
                    COUNT(CASE WHEN status = 'SOLD' THEN 1 END) as soldToday
                FROM "Listing" 
                WHERE category_id = ${id} 
                AND created_at >= CURRENT_DATE
            ` as any[];

            const metrics = additionalMetrics[0] || {};

            res.json({
                success: true,
                data: {
                    categoryId: id,
                    productCount: stats?.productCount || 0,
                    activeListings: stats?.activeListings || 0,
                    soldProducts: stats?.soldProducts || 0,
                    avgPrice: parseFloat(stats?.avgPrice) || 0,
                    totalRevenue: parseFloat(stats?.totalRevenue) || 0,
                    viewCount: parseInt(stats?.viewCount) || 0,
                    favoriteCount: stats?.favoriteCount || 0,
                    lastUpdated: stats?.updatedAt,
                    additionalMetrics: {
                        totalSellers: parseInt(metrics.totalSellers) || 0,
                        totalBuyers: parseInt(metrics.totalBuyers) || 0,
                        medianPrice: parseFloat(metrics.medianPrice) || 0,
                        minPrice: parseFloat(metrics.minPrice) || 0,
                        maxPrice: parseFloat(metrics.maxPrice) || 0,
                        soldToday: parseInt(metrics.soldToday) || 0
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get popular categories using materialized view
    async getPopularCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const { limit = 20, level } = req.query;

            let query = 'SELECT * FROM "PopularCategories"';
            const params: any[] = [];

            if (level) {
                query += ' WHERE level = $1';
                params.push(parseInt(level as string));
            }

            query += ' ORDER BY popularityScore DESC LIMIT $' + (params.length + 1);
            params.push(parseInt(limit as string));

            const popularCategories = await prisma.$queryRawUnsafe(query, ...params);

            res.json({
                success: true,
                data: popularCategories
            });
        } catch (error) {
            next(error);
        }
    }

    // Search categories with full-text search
    async searchCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const { q: query, limit = 20, offset = 0 } = req.query;

            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            // Full-text search using searchVector
            const searchResults = await prisma.$queryRaw`
                SELECT 
                    id, name, nameAr, slug, level, depth, path,
                    productCount, activeListings, avgPrice,
                    ts_rank(searchVector, plainto_tsquery('english', ${query})) as rank
                FROM "Category" 
                WHERE searchVector @@ plainto_tsquery('english', ${query})
                    AND isActive = true
                ORDER BY rank DESC, productCount DESC
                LIMIT ${parseInt(limit as string)} OFFSET ${parseInt(offset as string)}
            `;

            const total = await prisma.$queryRaw`
                SELECT COUNT(*) as total
                FROM "Category" 
                WHERE searchVector @@ plainto_tsquery('english', ${query})
                    AND isActive = true
            ` as any[];

            res.json({
                success: true,
                data: searchResults,
                meta: {
                    query,
                    total: parseInt(total[0]?.total || 0),
                    limit: parseInt(limit as string),
                    offset: parseInt(offset as string)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get category path (breadcrumb)
    async getCategoryPath(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Use CategoryPath table for efficient path retrieval
            const path = await prisma.$queryRaw`
                SELECT c.id, c.name, c.nameAr, c.slug, c.level, c.displayOrder
                FROM "CategoryPath" cp
                JOIN "Category" c ON cp.ancestorId = c.id
                WHERE cp.descendantId = ${id}
                ORDER BY cp.depth
            `;

            res.json({
                success: true,
                data: path
            });
        } catch (error) {
            next(error);
        }
    }

    // Refresh category statistics
    async refreshCategoryStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            if (id) {
                // Refresh specific category
                await prisma.$executeRaw`SELECT update_category_stats(${id})`;
            } else {
                // Refresh all categories
                await prisma.$executeRaw`SELECT update_all_category_stats()`;
            }

            // Refresh materialized views
            await prisma.$executeRaw`SELECT refresh_category_views()`;

            res.json({
                success: true,
                message: id ? `Category ${id} stats refreshed` : 'All category stats refreshed'
            });
        } catch (error) {
            next(error);
        }
    }
}

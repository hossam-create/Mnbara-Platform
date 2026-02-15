import { Request, Response, NextFunction } from 'express';
import { ListingService } from '../services/listing.service';

export class ListingController {
    private listingService: ListingService;

    constructor() {
        this.listingService = new ListingService();
    }

    // Create new listing
    createListing = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // TODO: Get userId from JWT token (req.user.id)
            const sellerId = 1; // Placeholder until auth middleware is fully integrated

            const listingData = {
                ...req.body,
                sellerId,
                price: parseFloat(req.body.price),
                categoryId: parseInt(req.body.categoryId),
            };

            const result = await this.listingService.createListing(listingData);

            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    // Get listings with filters
    getListings = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.listingService.getListings(req.query);
            res.json({
                success: true,
                data: result.listings,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    };

    // Get single listing
    getListing = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await this.listingService.getListing(parseInt(id));
            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    // Update listing
    updateListing = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await this.listingService.updateListing(parseInt(id), req.body);
            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    // Delete listing
    deleteListing = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            await this.listingService.deleteListing(parseInt(id));
            res.json({
                success: true,
                message: 'Listing deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    // Upload images
    uploadImages = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            // TODO: Implement actual S3 upload here or in service
            // For now, we assume images are uploaded and URLs are passed or handled by middleware

            res.json({
                success: true,
                message: 'Image upload logic to be implemented with S3',
            });
        } catch (error) {
            next(error);
        }
    };

    // Mark as sold
    markAsSold = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await this.listingService.markAsSold(parseInt(id));
            res.json({
                success: true,
                message: 'Listing marked as sold',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    // Get featured listings
    getFeaturedListings = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { limit } = req.query;
            const result = await this.listingService.getFeaturedListings(limit ? parseInt(limit as string) : 10);
            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
}


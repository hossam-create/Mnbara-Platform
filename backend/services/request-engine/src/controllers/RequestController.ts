import { Request, Response } from 'express';
import { RequestService } from '../services/RequestService';
import { ProductExtractionService } from '../services/ProductExtractionService';
import { StateTransitionService } from '../services/StateTransitionService';
import { CreateRequestData, UpdateRequestData, RequestFilters } from '../models/Request';
import { RequestStatus } from '../models/enums/RequestStatus';

export class RequestController {
  constructor(
    private requestService: RequestService,
    private productExtractionService: ProductExtractionService,
    private stateTransitionService: StateTransitionService
  ) {}

  // Create new request
  async createRequest(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = req.user.id; // From auth middleware
      const requestData: CreateRequestData = req.body;

      // Validate required fields
      if (!requestData.productId || !requestData.delivery) {
        res.status(400).json({
          error: 'Missing required fields: productId and delivery information'
        });
        return;
      }

      const request = await this.requestService.createRequest(requesterId, requestData);
      
      res.status(201).json({
        success: true,
        data: request,
        message: 'Request created successfully'
      });
    } catch (error) {
      console.error('Error creating request:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all requests with filters
  async getRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const filters: RequestFilters = req.query;

      let requests;
      
      if (userRole === 'TRAVELER') {
        // Travelers see visible requests
        requests = await this.requestService.getAvailableRequests(filters);
      } else {
        // Requesters see their own requests
        filters.requesterId = userId;
        requests = await this.requestService.getUserRequests(userId, filters);
      }

      res.status(200).json({
        success: true,
        data: requests
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get single request by ID
  async getRequestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const request = await this.requestService.getRequestById(id, userId, userRole);
      
      if (!request) {
        res.status(404).json({
          error: 'Request not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: request
      });
    } catch (error) {
      console.error('Error fetching request:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update request
  async updateRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData: UpdateRequestData = req.body;

      const request = await this.requestService.getRequestById(id, userId, req.user.role);
      
      if (!request) {
        res.status(404).json({
          error: 'Request not found'
        });
        return;
      }

      // Check if user can update this request
      if (request.requesterId !== userId && req.user.role !== 'ADMIN') {
        res.status(403).json({
          error: 'Not authorized to update this request'
        });
        return;
      }

      const updatedRequest = await this.requestService.updateRequest(id, updateData, userId);
      
      res.status(200).json({
        success: true,
        data: updatedRequest,
        message: 'Request updated successfully'
      });
    } catch (error) {
      console.error('Error updating request:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Cancel request
  async cancelRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const reason = req.body.reason;

      const request = await this.requestService.getRequestById(id, userId, req.user.role);
      
      if (!request) {
        res.status(404).json({
          error: 'Request not found'
        });
        return;
      }

      // Check if user can cancel this request
      if (request.requesterId !== userId && req.user.role !== 'ADMIN') {
        res.status(403).json({
          error: 'Not authorized to cancel this request'
        });
        return;
      }

      const cancelledRequest = await this.stateTransitionService.transitionStatus(
        id,
        RequestStatus.CANCELLED,
        userId,
        reason
      );
      
      res.status(200).json({
        success: true,
        data: cancelledRequest,
        message: 'Request cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling request:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Accept request (for travelers)
  async acceptRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const travelerId = req.user.id;

      const request = await this.requestService.getRequestById(id, travelerId, 'TRAVELER');
      
      if (!request) {
        res.status(404).json({
          error: 'Request not found'
        });
        return;
      }

      // Check if request is visible to travelers
      if (request.status !== RequestStatus.VISIBLE_TO_TRAVELERS) {
        res.status(400).json({
          error: 'Request is not available for acceptance'
        });
        return;
      }

      // Check if traveler already has an active request
      const hasActiveRequest = await this.requestService.hasActiveRequest(travelerId);
      if (hasActiveRequest) {
        res.status(400).json({
          error: 'You already have an active request. Please complete it first.'
        });
        return;
      }

      const acceptedRequest = await this.stateTransitionService.transitionStatus(
        id,
        RequestStatus.ACCEPTED,
        travelerId,
        'Request accepted by traveler'
      );
      
      res.status(200).json({
        success: true,
        data: acceptedRequest,
        message: 'Request accepted successfully'
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update delivery status (for travelers)
  async updateDeliveryStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const travelerId = req.user.id;

      const request = await this.requestService.getRequestById(id, travelerId, 'TRAVELER');
      
      if (!request) {
        res.status(404).json({
          error: 'Request not found'
        });
        return;
      }

      // Check if user is the assigned traveler
      if (request.travelerId !== travelerId) {
        res.status(403).json({
          error: 'Not authorized to update this request'
        });
        return;
      }

      const updatedRequest = await this.stateTransitionService.transitionStatus(
        id,
        status,
        travelerId,
        reason
      );
      
      res.status(200).json({
        success: true,
        data: updatedRequest,
        message: 'Delivery status updated successfully'
      });
    } catch (error) {
      console.error('Error updating delivery status:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get request timeline
  async getRequestTimeline(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const request = await this.requestService.getRequestById(id, userId, req.user.role);
      
      if (!request) {
        res.status(404).json({
          error: 'Request not found'
        });
        return;
      }

      const timeline = await this.requestService.getRequestTimeline(id);
      
      res.status(200).json({
        success: true,
        data: timeline
      });
    } catch (error) {
      console.error('Error fetching timeline:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

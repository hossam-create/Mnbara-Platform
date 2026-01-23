import { RequestService } from './RequestService';
import { RequestStatus } from '../models/enums/RequestStatus';

export class StateTransitionService {
  constructor(private requestService: RequestService) {}

  async transitionStatus(
    requestId: string,
    toStatus: RequestStatus,
    userId: string,
    reason?: string
  ): Promise<any> {
    return await this.requestService.transitionStatus(requestId, toStatus, userId, reason);
  }

  async acceptRequest(requestId: string, travelerId: string): Promise<any> {
    // Check if traveler has active requests
    const hasActiveRequest = await this.requestService.hasActiveRequest(travelerId);
    if (hasActiveRequest) {
      throw new Error('Traveler already has an active request');
    }

    return await this.transitionStatus(requestId, RequestStatus.ACCEPTED, travelerId, 'Request accepted by traveler');
  }

  async startDelivery(requestId: string, travelerId: string): Promise<any> {
    return await this.transitionStatus(requestId, RequestStatus.IN_PROGRESS, travelerId, 'Delivery started');
  }

  async completeDelivery(requestId: string, travelerId: string): Promise<any> {
    return await this.transitionStatus(requestId, RequestStatus.DELIVERED, travelerId, 'Delivery completed successfully');
  }

  async cancelRequest(requestId: string, userId: string, reason?: string): Promise<any> {
    return await this.transitionStatus(requestId, RequestStatus.CANCELLED, userId, reason);
  }

  async expireRequest(requestId: string, userId: string): Promise<any> {
    return await this.transitionStatus(requestId, RequestStatus.EXPIRED, userId, 'Request expired - deadline passed');
  }
}

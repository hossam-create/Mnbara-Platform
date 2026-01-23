import { Request, CreateRequestData, UpdateRequestData, RequestFilters, RequestListResponse } from '../models/Request';
import { RequestStatus, RequestTransition, TimelineEventType } from '../models/enums/RequestStatus';
import { Product } from '../models/Product';

export class RequestService {
  // Database connection would be injected in real implementation
  constructor(private db: any) {}

  async createRequest(requesterId: string, data: CreateRequestData): Promise<Request> {
    // Validate deadline is in the future
    if (new Date(data.delivery.deadline) <= new Date()) {
      throw new Error('Deadline must be in the future');
    }

    // Create request in database
    const request = await this.db.query(`
      INSERT INTO requests (
        requester_id, product_id, origin_country, origin_city, origin_address, origin_postal_code,
        destination_country, destination_city, destination_address, destination_postal_code,
        deadline, delivery_instructions, packaging, insurance, tracking, urgency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      requesterId,
      data.productId,
      data.delivery.origin.country,
      data.delivery.origin.city,
      data.delivery.origin.address,
      data.delivery.origin.postalCode,
      data.delivery.destination.country,
      data.delivery.destination.city,
      data.delivery.destination.address,
      data.delivery.destination.postalCode,
      data.delivery.deadline,
      data.delivery.instructions,
      data.preferences?.packaging || 'STANDARD',
      data.preferences?.insurance || false,
      data.preferences?.tracking || false,
      data.preferences?.urgency || 'STANDARD'
    ]);

    // Create timeline entry
    await this.addTimelineEntry(request.id, TimelineEventType.REQUEST_CREATED, 'Request Created', 'Request has been created and is pending review', requesterId);

    // Auto-transition to VISIBLE_TO_TRAVELERS after creation
    await this.transitionStatus(request.id, RequestStatus.VISIBLE_TO_TRAVELERS, requesterId, 'Request is now visible to travelers');

    return this.mapDbRequestToModel(request);
  }

  async getRequestById(id: string, userId: string, userRole: string): Promise<Request | null> {
    const query = userRole === 'TRAVELER' 
      ? `SELECT r.*, p.title, p.image, p.price, p.currency, p.url 
         FROM requests r 
         JOIN products p ON r.product_id = p.id 
         WHERE r.id = $1 AND r.status = 'VISIBLE_TO_TRAVELERS'`
      : `SELECT r.*, p.title, p.image, p.price, p.currency, p.url 
         FROM requests r 
         JOIN products p ON r.product_id = p.id 
         WHERE r.id = $1 AND (r.requester_id = $2 OR r.traveler_id = $2)`;

    const result = await this.db.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRequestToModel(result.rows[0]);
  }

  async getAvailableRequests(filters: RequestFilters): Promise<RequestListResponse> {
    let query = `
      SELECT r.*, p.title, p.image, p.price, p.currency, p.url 
      FROM requests r 
      JOIN products p ON r.product_id = p.id 
      WHERE r.status = 'VISIBLE_TO_TRAVELERS'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters.originCountry) {
      query += ` AND r.origin_country = $${paramIndex++}`;
      params.push(filters.originCountry);
    }

    if (filters.destinationCountry) {
      query += ` AND r.destination_country = $${paramIndex++}`;
      params.push(filters.destinationCountry);
    }

    if (filters.deadlineFrom) {
      query += ` AND r.deadline >= $${paramIndex++}`;
      params.push(filters.deadlineFrom);
    }

    if (filters.deadlineTo) {
      query += ` AND r.deadline <= $${paramIndex++}`;
      params.push(filters.deadlineTo);
    }

    if (filters.priceMin) {
      query += ` AND p.price >= $${paramIndex++}`;
      params.push(filters.priceMin);
    }

    if (filters.priceMax) {
      query += ` AND p.price <= $${paramIndex++}`;
      params.push(filters.priceMax);
    }

    if (filters.urgency) {
      query += ` AND r.urgency = $${paramIndex++}`;
      params.push(filters.urgency);
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query += ` ORDER BY r.${sortBy} ${sortOrder}`;

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    const requests = result.rows.map(row => this.mapDbRequestToModel(row));

    // Get total count
    const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*$/, '');
    const countResult = await this.db.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    return {
      requests,
      total,
      limit,
      offset,
      hasMore: offset + requests.length < total
    };
  }

  async getUserRequests(userId: string, filters: RequestFilters): Promise<RequestListResponse> {
    let query = `
      SELECT r.*, p.title, p.image, p.price, p.currency, p.url 
      FROM requests r 
      JOIN products p ON r.product_id = p.id 
      WHERE r.requester_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      query += ` AND r.status = ANY($${paramIndex++})`;
      params.push(filters.status);
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query += ` ORDER BY r.${sortBy} ${sortOrder}`;

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    const requests = result.rows.map(row => this.mapDbRequestToModel(row));

    // Get total count
    const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*$/, '');
    const countResult = await this.db.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    return {
      requests,
      total,
      limit,
      offset,
      hasMore: offset + requests.length < total
    };
  }

  async updateRequest(id: string, data: UpdateRequestData, userId: string): Promise<Request> {
    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;

    if (data.delivery) {
      if (data.delivery.origin) {
        if (data.delivery.origin.country) {
          updates.push(`origin_country = $${paramIndex++}`);
          params.push(data.delivery.origin.country);
        }
        if (data.delivery.origin.city) {
          updates.push(`origin_city = $${paramIndex++}`);
          params.push(data.delivery.origin.city);
        }
        if (data.delivery.origin.address) {
          updates.push(`origin_address = $${paramIndex++}`);
          params.push(data.delivery.origin.address);
        }
        if (data.delivery.origin.postalCode) {
          updates.push(`origin_postal_code = $${paramIndex++}`);
          params.push(data.delivery.origin.postalCode);
        }
      }
      if (data.delivery.destination) {
        if (data.delivery.destination.country) {
          updates.push(`destination_country = $${paramIndex++}`);
          params.push(data.delivery.destination.country);
        }
        if (data.delivery.destination.city) {
          updates.push(`destination_city = $${paramIndex++}`);
          params.push(data.delivery.destination.city);
        }
        if (data.delivery.destination.address) {
          updates.push(`destination_address = $${paramIndex++}`);
          params.push(data.delivery.destination.address);
        }
        if (data.delivery.destination.postalCode) {
          updates.push(`destination_postal_code = $${paramIndex++}`);
          params.push(data.delivery.destination.postalCode);
        }
      }
      if (data.delivery.deadline) {
        updates.push(`deadline = $${paramIndex++}`);
        params.push(data.delivery.deadline);
      }
      if (data.delivery.instructions) {
        updates.push(`delivery_instructions = $${paramIndex++}`);
        params.push(data.delivery.instructions);
      }
    }

    if (data.preferences) {
      if (data.preferences.packaging) {
        updates.push(`packaging = $${paramIndex++}`);
        params.push(data.preferences.packaging);
      }
      if (data.preferences.insurance !== undefined) {
        updates.push(`insurance = $${paramIndex++}`);
        params.push(data.preferences.insurance);
      }
      if (data.preferences.tracking !== undefined) {
        updates.push(`tracking = $${paramIndex++}`);
        params.push(data.preferences.tracking);
      }
      if (data.preferences.urgency) {
        updates.push(`urgency = $${paramIndex++}`);
        params.push(data.preferences.urgency);
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    const query = `
      UPDATE requests 
      SET ${updates.join(', ')}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;

    const result = await this.db.query(query, params);
    
    if (result.rows.length === 0) {
      throw new Error('Request not found');
    }

    // Add timeline entry
    await this.addTimelineEntry(id, TimelineEventType.STATUS_UPDATED, 'Request Updated', 'Request details have been updated', userId);

    return this.mapDbRequestToModel(result.rows[0]);
  }

  async hasActiveRequest(travelerId: string): Promise<boolean> {
    const result = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM requests 
      WHERE traveler_id = $1 AND status IN ('ACCEPTED', 'IN_PROGRESS')
    `, [travelerId]);

    return parseInt(result.rows[0].count) > 0;
  }

  async getRequestTimeline(id: string): Promise<any[]> {
    const result = await this.db.query(`
      SELECT * FROM request_timeline 
      WHERE request_id = $1 
      ORDER BY created_at ASC
    `, [id]);

    return result.rows;
  }

  async transitionStatus(id: string, toStatus: RequestStatus, userId: string, reason?: string): Promise<Request> {
    // Get current request
    const currentRequest = await this.db.query('SELECT * FROM requests WHERE id = $1', [id]);
    
    if (currentRequest.rows.length === 0) {
      throw new Error('Request not found');
    }

    const fromStatus = currentRequest.rows[0].status as RequestStatus;

    // Validate transition
    if (!this.isValidTransition(fromStatus, toStatus)) {
      throw new Error(`Invalid transition from ${fromStatus} to ${toStatus}`);
    }

    // Update request status
    const updateQuery = toStatus === RequestStatus.ACCEPTED 
      ? `UPDATE requests SET status = $1, traveler_id = $2, accepted_at = NOW(), updated_at = NOW() WHERE id = $3 RETURNING *`
      : toStatus === RequestStatus.DELIVERED
      ? `UPDATE requests SET status = $1, completed_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *`
      : `UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;

    const params = toStatus === RequestStatus.ACCEPTED ? [toStatus, userId, id] : [toStatus, id];
    const result = await this.db.query(updateQuery, params);

    // Add status history entry
    await this.db.query(`
      INSERT INTO request_status_history (request_id, from_status, to_status, transition, reason, changed_by)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, fromStatus, toStatus, this.getTransitionType(fromStatus, toStatus), reason, userId]);

    // Add timeline entry
    const timelineEvent = this.getTimelineEventType(toStatus);
    await this.addTimelineEntry(id, timelineEvent, this.getTimelineTitle(toStatus), reason || `Status changed to ${toStatus}`, userId);

    return this.mapDbRequestToModel(result.rows[0]);
  }

  private async addTimelineEntry(requestId: string, type: TimelineEventType, title: string, description: string, createdBy: string): Promise<void> {
    await this.db.query(`
      INSERT INTO request_timeline (request_id, type, title, description, created_by)
      VALUES ($1, $2, $3, $4, $5)
    `, [requestId, type, title, description, createdBy]);
  }

  private isValidTransition(from: RequestStatus, to: RequestStatus): boolean {
    const validTransitions: Record<RequestStatus, RequestStatus[]> = {
      [RequestStatus.CREATED]: [RequestStatus.VISIBLE_TO_TRAVELERS, RequestStatus.CANCELLED],
      [RequestStatus.VISIBLE_TO_TRAVELERS]: [RequestStatus.ACCEPTED, RequestStatus.CANCELLED, RequestStatus.EXPIRED],
      [RequestStatus.ACCEPTED]: [RequestStatus.IN_PROGRESS, RequestStatus.CANCELLED],
      [RequestStatus.IN_PROGRESS]: [RequestStatus.DELIVERED, RequestStatus.CANCELLED],
      [RequestStatus.DELIVERED]: [],
      [RequestStatus.CANCELLED]: [],
      [RequestStatus.EXPIRED]: []
    };

    return validTransitions[from]?.includes(to) || false;
  }

  private getTransitionType(from: RequestStatus, to: RequestStatus): RequestTransition {
    const transitionMap: Record<string, RequestTransition> = {
      [`${RequestStatus.CREATED}_${RequestStatus.VISIBLE_TO_TRAVELERS}`]: RequestTransition.CREATED_TO_VISIBLE,
      [`${RequestStatus.CREATED}_${RequestStatus.CANCELLED}`]: RequestTransition.CREATED_TO_CANCELLED,
      [`${RequestStatus.VISIBLE_TO_TRAVELERS}_${RequestStatus.ACCEPTED}`]: RequestTransition.VISIBLE_TO_ACCEPTED,
      [`${RequestStatus.VISIBLE_TO_TRAVELERS}_${RequestStatus.CANCELLED}`]: RequestTransition.VISIBLE_TO_CANCELLED,
      [`${RequestStatus.VISIBLE_TO_TRAVELERS}_${RequestStatus.EXPIRED}`]: RequestTransition.VISIBLE_TO_EXPIRED,
      [`${RequestStatus.ACCEPTED}_${RequestStatus.IN_PROGRESS}`]: RequestTransition.ACCEPTED_TO_IN_PROGRESS,
      [`${RequestStatus.ACCEPTED}_${RequestStatus.CANCELLED}`]: RequestTransition.ACCEPTED_TO_CANCELLED,
      [`${RequestStatus.IN_PROGRESS}_${RequestStatus.DELIVERED}`]: RequestTransition.IN_PROGRESS_TO_DELIVERED,
      [`${RequestStatus.IN_PROGRESS}_${RequestStatus.CANCELLED}`]: RequestTransition.IN_PROGRESS_TO_CANCELLED,
    };
    
    const key = `${from}_${to}`;
    return transitionMap[key] || RequestTransition.CREATED_TO_VISIBLE;
  }

  private getTimelineEventType(status: RequestStatus): TimelineEventType {
    const eventMap: Record<RequestStatus, TimelineEventType> = {
      [RequestStatus.VISIBLE_TO_TRAVELERS]: TimelineEventType.REQUEST_VISIBLE,
      [RequestStatus.ACCEPTED]: TimelineEventType.REQUEST_ACCEPTED,
      [RequestStatus.IN_PROGRESS]: TimelineEventType.DELIVERY_STARTED,
      [RequestStatus.DELIVERED]: TimelineEventType.DELIVERY_COMPLETED,
      [RequestStatus.CANCELLED]: TimelineEventType.REQUEST_CANCELLED,
      [RequestStatus.EXPIRED]: TimelineEventType.REQUEST_EXPIRED,
      [RequestStatus.CREATED]: TimelineEventType.REQUEST_CREATED,
    };

    return eventMap[status] || TimelineEventType.STATUS_UPDATED;
  }

  private getTimelineTitle(status: RequestStatus): string {
    const titleMap: Record<RequestStatus, string> = {
      [RequestStatus.VISIBLE_TO_TRAVELERS]: 'Request Visible',
      [RequestStatus.ACCEPTED]: 'Request Accepted',
      [RequestStatus.IN_PROGRESS]: 'Delivery Started',
      [RequestStatus.DELIVERED]: 'Delivery Completed',
      [RequestStatus.CANCELLED]: 'Request Cancelled',
      [RequestStatus.EXPIRED]: 'Request Expired',
      [RequestStatus.CREATED]: 'Request Created',
    };

    return titleMap[status] || 'Status Updated';
  }

  private mapDbRequestToModel(row: any): Request {
    return {
      id: row.id,
      requesterId: row.requester_id,
      travelerId: row.traveler_id,
      productId: row.product_id,
      product: {
        id: row.product_id,
        title: row.title,
        image: row.image,
        price: parseFloat(row.price),
        currency: row.currency,
        url: row.url
      },
      delivery: {
        origin: {
          country: row.origin_country,
          city: row.origin_city,
          address: row.origin_address,
          postalCode: row.origin_postal_code
        },
        destination: {
          country: row.destination_country,
          city: row.destination_city,
          address: row.destination_address,
          postalCode: row.destination_postal_code
        },
        deadline: row.deadline,
        instructions: row.delivery_instructions
      },
      status: row.status,
      statusHistory: [], // Would be loaded separately
      timeline: [], // Would be loaded separately
      preferences: {
        packaging: row.packaging,
        insurance: row.insurance,
        tracking: row.tracking,
        urgency: row.urgency
      },
      metadata: {
        estimatedDistance: row.estimated_distance,
        estimatedDuration: row.estimated_duration,
        difficulty: row.difficulty,
        tags: row.tags
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      acceptedAt: row.accepted_at,
      completedAt: row.completed_at
    };
  }
}

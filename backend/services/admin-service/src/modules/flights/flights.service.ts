import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class FlightsService {
  constructor(private readonly db: DatabaseService) {}

  async getAllFlights(filters: any) {
    const { status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause = `WHERE flight_status = $${paramIndex++}`;
      values.push(status);
    }

    const countQuery = `SELECT COUNT(*) as count FROM traveler_flights ${whereClause}`;
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    const query = `
      SELECT 
        tf.*,
        u.first_name,
        u.last_name,
        u.email
      FROM traveler_flights tf
      JOIN trips t ON tf.trip_id = t.id
      JOIN users u ON tf.traveler_id = u.id
      ${whereClause}
      ORDER BY tf.scheduled_departure DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    const result = await this.db.query(query, [...values, limit, offset]);

    return {
      data: result.rows,
      total,
      page,
      limit,
    };
  }

  async getActiveFlights() {
    const result = await this.db.query(
      `SELECT 
        tf.*,
        u.first_name,
        u.last_name,
        u.email
      FROM traveler_flights tf
      JOIN users u ON tf.traveler_id = u.id
      WHERE tf.flight_status IN ('SCHEDULED', 'IN_FLIGHT', 'DELAYED')
        AND tf.scheduled_departure >= NOW() - INTERVAL '24 hours'
        AND tf.scheduled_arrival <= NOW() + INTERVAL '48 hours'
      ORDER BY tf.scheduled_departure ASC`
    );

    return result.rows;
  }

  async getFlightById(id: number) {
    const result = await this.db.query(
      `SELECT 
        tf.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
      FROM traveler_flights tf
      JOIN users u ON tf.traveler_id = u.id
      WHERE tf.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  async getFlightsByTrip(tripId: number) {
    const result = await this.db.query(
      `SELECT * FROM traveler_flights 
       WHERE trip_id = $1 
       ORDER BY scheduled_departure ASC`,
      [tripId]
    );

    return result.rows;
  }

  // Simulate flight tracking API integration
  async updateFlightStatus(flightId: number) {
    // In production, integrate with FlightStats or FlightAware API
    const flight = await this.getFlightById(flightId);
    if (!flight) return null;

    // Mock update logic
    const now = new Date();
    const scheduledDeparture = new Date(flight.scheduled_departure);
    const scheduledArrival = new Date(flight.scheduled_arrival);

    let newStatus = flight.flight_status;
    if (now < scheduledDeparture) {
      newStatus = 'SCHEDULED';
    } else if (now >= scheduledDeparture && now < scheduledArrival) {
      newStatus = 'IN_FLIGHT';
    } else {
      newStatus = 'LANDED';
    }

    await this.db.update(
      'traveler_flights',
      { id: flightId },
      {
        flight_status: newStatus,
        last_updated: now,
      }
    );

    return { flightId, status: newStatus };
  }
}

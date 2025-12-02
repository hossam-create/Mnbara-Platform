import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ShipmentStatus = 
    | 'REQUESTED'        // Buyer requested item
    | 'MATCHED'          // Matched with traveler
    | 'PURCHASED'        // Traveler bought the item
    | 'IN_TRANSIT'       // Traveler traveling
    | 'ARRIVED'          // Traveler arrived at destination
    | 'DELIVERED'        // Item delivered to buyer
    | 'COMPLETED'        // Transaction complete
    | 'CANCELLED';       // Cancelled

interface TrackingEvent {
    shipmentId: number;
    status: ShipmentStatus;
    location?: string;
    notes?: string;
}

export class TrackingService {
    
    /**
     * Update shipment status and create tracking event
     */
    async updateStatus(event: TrackingEvent) {
        const { shipmentId, status, location, notes } = event;

        return prisma.$transaction(async (tx) => {
            // 1. Update shipment status
            const shipment = await tx.order.update({
                where: { id: shipmentId },
                data: { 
                    status: status as string,
                    updatedAt: new Date()
                }
            });

            // 2. Create tracking history entry
            const trackingEntry = await tx.trackingHistory.create({
                data: {
                    orderId: shipmentId,
                    status: status as string,
                    location,
                    notes
                }
            });

            // 3. Notify status change
            await this.notifyStatusChange(shipmentId, status);

            return {
                shipment,
                trackingEvent: trackingEntry
            };
        });
    }

    /**
     * Get shipment tracking history
     */
    async getTrackingHistory(shipmentId: number) {
        const shipment = await prisma.order.findUnique({
            where: { id: shipmentId },
            include: {
                buyer: {
                    select: { id: true, firstName: true, lastName: true }
                },
                traveler: {
                    select: { id: true, firstName: true, lastName: true }
                },
                trackingHistory: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        return shipment;
    }

    /**
     * Notify users about status change
     */
    private async notifyStatusChange(shipmentId: number, status: ShipmentStatus) {
        // TODO: Integrate with notification-service
        console.log(`[Tracking] Shipment ${shipmentId} status changed to ${status}`);
        // Send push notification, email, SMS
    }
}

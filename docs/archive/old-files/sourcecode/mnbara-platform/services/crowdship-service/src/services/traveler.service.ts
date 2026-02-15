import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class TravelerService {
    // Update Location
    async updateLocation(userId: number, data: { latitude: number; longitude: number; country?: string; airportCode?: string }) {
        return prisma.travelerLocation.upsert({
            where: { travelerId: userId },
            update: {
                ...data,
                lastSeenAt: new Date(),
            },
            create: {
                travelerId: userId,
                ...data,
            },
        });
    }

    // Get Location
    async getLocation(userId: number) {
        return prisma.travelerLocation.findUnique({
            where: { travelerId: userId },
        });
    }

    // Add Availability (Trip)
    async addAvailability(userId: number, data: any) {
        return prisma.travelerAvailability.create({
            data: {
                travelerId: userId,
                ...data,
                departTime: new Date(data.departTime),
                arriveTime: new Date(data.arriveTime),
            },
        });
    }

    // Get Traveler Trips
    async getTravelerTrips(userId: number) {
        return prisma.travelerAvailability.findMany({
            where: { travelerId: userId },
            orderBy: { departTime: 'asc' },
        });
    }

    // Find Matching Travelers
    async findMatches(origin: string, destination: string, date?: string) {
        const where: Prisma.TravelerAvailabilityWhereInput = {
            origin: { contains: origin, mode: 'insensitive' },
            destination: { contains: destination, mode: 'insensitive' },
            isActive: true,
            departTime: { gte: new Date() },
        };

        if (date) {
            const searchDate = new Date(date);
            const nextDay = new Date(searchDate);
            nextDay.setDate(nextDay.getDate() + 1);

            where.departTime = {
                gte: searchDate,
                lt: nextDay,
            };
        }

        return prisma.travelerAvailability.findMany({
            where,
            include: {
                traveler: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        rating: true,
                    },
                },
            },
            orderBy: { departTime: 'asc' },
        });
    }

    // Get Nearby Travelers (Geo-spatial simulation)
    // Note: Prisma doesn't support PostGIS natively easily without raw queries, 
    // so we'll do a basic box search or just return recent active travelers for MVP
    async getNearbyTravelers(lat: number, lng: number, radiusKm: number = 50) {
        // Simplified: Get travelers updated in last 24h
        // In production, use PostGIS with `ST_DWithin`
        const recentLocations = await prisma.travelerLocation.findMany({
            where: {
                lastSeenAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
                },
            },
            include: {
                traveler: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        rating: true,
                    },
                },
            },
        });

        // Simple Haversine filter in JS
        return recentLocations.filter(loc => {
            const dist = this.calculateDistance(lat, lng, loc.latitude, loc.longitude);
            return dist <= radiusKm;
        });
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371; // km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(val: number) {
        return val * Math.PI / 180;
    }
}

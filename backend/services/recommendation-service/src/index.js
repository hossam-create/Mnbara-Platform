const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const geolib = require('geolib');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'recommendation-service' });
});

/**
 * GET /api/recommendations
 * Returns personalized product recommendations based on:
 * - User location (lat, lon)
 * - User preferences
 * - Nearby buyer requests
 * - Collaborative filtering
 */
app.get('/api/recommendations', async (req, res) => {
    try {
        const { userId, lat, lon, radius = 50 } = req.query;

        if (!userId || !lat || !lon) {
            return res.status(400).json({
                error: 'Missing required parameters: userId, lat, lon'
            });
        }

        // TODO: Implement actual recommendation logic
        // For now, return mock data
        const recommendations = [
            {
                id: '1',
                productName: 'Nike AirMax',
                category: 'Shoes',
                distance: 5.2,
                priority: 'high',
                reason: 'Nearby buyer request',
                estimatedDeliveryFee: 30
            },
            {
                id: '2',
                productName: 'iPhone 15 Pro',
                category: 'Electronics',
                distance: 12.8,
                priority: 'medium',
                reason: 'Popular in your area',
                estimatedDeliveryFee: 50
            }
        ];

        res.json({
            success: true,
            data: recommendations,
            meta: {
                userId,
                location: { lat: parseFloat(lat), lon: parseFloat(lon) },
                radius: parseFloat(radius),
                count: recommendations.length
            }
        });
    } catch (error) {
        console.error('Recommendation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/events/camera
 * Process camera/mic events from travelers
 */
app.post('/api/events/camera', async (req, res) => {
    try {
        const { userId, tags, lat, lon, timestamp } = req.body;

        if (!userId || !tags || !lat || !lon) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        // TODO: Process tags, match with products, create reminders
        console.log('Camera event received:', { userId, tags, location: { lat, lon } });

        res.json({
            success: true,
            message: 'Event processed',
            matchedProducts: []
        });
    } catch (error) {
        console.error('Camera event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/buyer-requests/nearby
 * Get buyer requests near traveler location
 */
app.get('/api/buyer-requests/nearby', async (req, res) => {
    try {
        const { lat, lon, radius = 20 } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                error: 'Missing location parameters'
            });
        }

        // TODO: Query PostGIS for nearby requests
        const nearbyRequests = [];

        res.json({
            success: true,
            data: nearbyRequests,
            meta: { radius: parseFloat(radius) }
        });
    } catch (error) {
        console.error('Nearby requests error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Recommendation Service running on port ${PORT}`);
});

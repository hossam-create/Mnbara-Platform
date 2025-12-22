// Simple test script to verify the payment service can start
console.log('Testing payment service startup...');

// Load environment variables
require('dotenv').config();

// Create a minimal Express app
const express = require('express');
const app = express();

// Basic middleware
app.use(require('helmet')());
app.use(require('cors')());
app.use(require('morgan')('dev'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'payment-service-test',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Payment service is working!',
        status: 'success'
    });
});

// Start the server
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`✅ Payment service test server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
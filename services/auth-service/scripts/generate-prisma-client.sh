#!/bin/bash

# Script to generate Prisma client with updated schema
echo "Generating Prisma client with updated audit logs and live streaming events..."

# Navigate to auth-service directory
cd "E:\New computer\Development Coding\Projects\Repos\geo\mnbara-platform\backend\services\auth-service"

# Generate Prisma client
npx prisma generate

echo "Prisma client generated successfully!"
echo "New AuditAction enum values added:"
echo "- LIVE_STREAM_STARTED"
echo "- LIVE_STREAM_ENDED" 
echo "- LIVE_STREAM_CANCELLED"
echo "- LIVE_STREAM_VIEWER_JOINED"
echo "- LIVE_STREAM_VIEWER_LEFT"
echo "- LIVE_STREAM_CHAT_MESSAGE_SENT"
echo "- LIVE_STREAM_CHAT_MESSAGE_DELETED"
echo "- LIVE_STREAM_USER_BANNED"
echo "- LIVE_STREAM_USER_UNBANNED"
echo "- LIVE_STREAM_PRODUCT_PINNED"
echo "- LIVE_STREAM_PRODUCT_UNPINNED"
echo "- LIVE_AUCTION_STARTED"
echo "- LIVE_AUCTION_ENDED"
echo "- LIVE_AUCTION_BID_PLACED"
echo "- LIVE_AUCTION_BID_CANCELLED"
echo "- LIVE_AUCTION_WINNER_DETERMINED"
echo "- LIVE_AUCTION_PAYMENT_CAPTURED"
echo "- LIVE_STREAM_TECHNICAL_ERROR"
echo "- LIVE_STREAM_QUALITY_DEGRADED"
echo "- LIVE_STREAM_RECORDING_STARTED"
echo "- LIVE_STREAM_RECORDING_ENDED"
echo "- LIVE_STREAM_RECORDING_UPLOADED"
echo "- LIVE_STREAM_THUMBNAIL_UPDATED"
echo "- LIVE_STREAM_METADATA_UPDATED"
echo "- LIVE_STREAM_RTMP_CONNECTION_ESTABLISHED"
echo "- LIVE_STREAM_RTMP_CONNECTION_LOST"
echo "- LIVE_STREAM_HLS_SEGMENT_CREATED"
echo "- LIVE_STREAM_WEBRTC_CONNECTION_ESTABLISHED"
echo "- LIVE_STREAM_WEBRTC_CONNECTION_LOST"
echo "- LIVE_STREAM_MODERATION_ACTION_TAKEN"
echo "- LIVE_STREAM_ANALYTICS_DATA_COLLECTED"
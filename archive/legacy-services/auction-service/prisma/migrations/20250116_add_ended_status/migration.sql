-- Add ENDED status to ListingStatus enum for AUC-001
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'ENDED';






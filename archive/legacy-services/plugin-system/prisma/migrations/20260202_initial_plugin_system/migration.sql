-- ============================================================
-- Plugin System - Initial Migration
-- ============================================================

-- Create Plugin Type Enum
CREATE TYPE "PluginType" AS ENUM (
  'PAYMENT_GATEWAY',
  'SHIPPING_PROVIDER',
  'ANALYTICS',
  'MARKETING',
  'CONTENT',
  'SECURITY',
  'INTEGRATION',
  'CUSTOM'
);

-- Create Plugin Category Enum
CREATE TYPE "PluginCategory" AS ENUM (
  'PAYMENT',
  'SHIPPING',
  'MARKETING',
  'ANALYTICS',
  'CUSTOMER_SERVICE',
  'CONTENT',
  'SOCIAL',
  'MARKETPLACE',
  'UTILITY',
  'SECURITY'
);

-- Create Plugin Status Enum
CREATE TYPE "PluginStatus" AS ENUM (
  'INACTIVE',
  'ACTIVE',
  'ERROR',
  'UPDATING',
  'UNINSTALLING'
);

-- Create Installation Status Enum
CREATE TYPE "InstallationStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'ERROR',
  'UPDATING'
);

-- Plugins Table
CREATE TABLE "plugins" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "version" TEXT NOT NULL,
  "type" "PluginType" NOT NULL,
  "category" "PluginCategory" NOT NULL,
  "manifest" JSONB NOT NULL,
  "status" "PluginStatus" NOT NULL DEFAULT 'INACTIVE',
  "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "activatedAt" TIMESTAMP(3),
  "deactivatedAt" TIMESTAMP(3),
  "errorMessage" TEXT
);

-- Plugin Hooks Table
CREATE TABLE "plugin_hooks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pluginId" TEXT NOT NULL,
  "hookName" TEXT NOT NULL,
  "handlerFunction" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plugin_hooks_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Plugin Configs Table
CREATE TABLE "plugin_configs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pluginId" TEXT NOT NULL,
  "configKey" TEXT NOT NULL,
  "configValue" JSONB,
  "isSecret" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plugin_configs_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Plugin Installations Table
CREATE TABLE "plugin_installations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pluginId" TEXT NOT NULL,
  "userId" TEXT,
  "version" TEXT NOT NULL,
  "config" JSONB,
  "status" "InstallationStatus" NOT NULL DEFAULT 'ACTIVE',
  "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "uninstalledAt" TIMESTAMP(3),
  CONSTRAINT "plugin_installations_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Marketplace Plugins Table
CREATE TABLE "marketplace_plugins" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pluginId" TEXT NOT NULL UNIQUE,
  "developerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" "PluginCategory" NOT NULL,
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "downloadCount" INTEGER NOT NULL DEFAULT 0,
  "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "publishedAt" TIMESTAMP(3),
  CONSTRAINT "marketplace_plugins_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Plugin Reviews Table
CREATE TABLE "plugin_reviews" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pluginId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plugin_reviews_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "marketplace_plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "plugin_reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- Plugin Events Table (Audit Log)
CREATE TABLE "plugin_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pluginId" TEXT,
  "eventType" TEXT NOT NULL,
  "eventData" JSONB,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX "plugins_name_idx" ON "plugins"("name");
CREATE INDEX "plugins_status_idx" ON "plugins"("status");
CREATE INDEX "plugins_type_category_idx" ON "plugins"("type", "category");
CREATE INDEX "plugin_hooks_hookName_idx" ON "plugin_hooks"("hookName");
CREATE INDEX "plugin_hooks_pluginId_priority_idx" ON "plugin_hooks"("pluginId", "priority");
CREATE UNIQUE INDEX "plugin_hooks_pluginId_hookName_key" ON "plugin_hooks"("pluginId", "hookName");
CREATE UNIQUE INDEX "plugin_configs_pluginId_configKey_key" ON "plugin_configs"("pluginId", "configKey");
CREATE INDEX "plugin_configs_pluginId_idx" ON "plugin_configs"("pluginId");
CREATE INDEX "plugin_installations_pluginId_idx" ON "plugin_installations"("pluginId");
CREATE INDEX "plugin_installations_userId_idx" ON "plugin_installations"("userId");
CREATE INDEX "plugin_installations_status_idx" ON "plugin_installations"("status");
CREATE INDEX "marketplace_plugins_category_idx" ON "marketplace_plugins"("category");
CREATE INDEX "marketplace_plugins_isPublished_isVerified_idx" ON "marketplace_plugins"("isPublished", "isVerified");
CREATE INDEX "marketplace_plugins_rating_idx" ON "marketplace_plugins"("rating");
CREATE INDEX "plugin_reviews_pluginId_idx" ON "plugin_reviews"("pluginId");
CREATE INDEX "plugin_reviews_rating_idx" ON "plugin_reviews"("rating");
CREATE UNIQUE INDEX "plugin_reviews_pluginId_userId_key" ON "plugin_reviews"("pluginId", "userId");
CREATE INDEX "plugin_events_pluginId_idx" ON "plugin_events"("pluginId");
CREATE INDEX "plugin_events_eventType_idx" ON "plugin_events"("eventType");
CREATE INDEX "plugin_events_createdAt_idx" ON "plugin_events"("createdAt");


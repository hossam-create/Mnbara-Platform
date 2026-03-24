import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Root Vitest Configuration for Mnbara Platform Monorepo
 * 
 * This configuration provides shared test settings for all packages and services.
 * Individual projects can extend this configuration with their own vitest.config.ts
 */
export default defineConfig({
  test: {
    // Enable global test APIs (describe, it, expect, etc.)
    globals: true,
    
    // Default test environment (can be overridden per project)
    environment: 'node',
    
    // Test file patterns
    include: [
      '**/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}',
      '**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.nx/**',
      '**/coverage/**',
      '**/archive/**',
      '**/backup_phase2_/**'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        '**/__tests__/**',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.spec.{ts,tsx,js,jsx}',
        '**/dist/**',
        '**/build/**',
        '**/*.config.{ts,js}',
        '**/coverage/**',
        'archive/**',
        'backup_phase2_/**'
      ],
      // Coverage thresholds
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80
    },
    
    // Test timeout (30 seconds)
    testTimeout: 30000,
    
    // Hook timeout (10 seconds)
    hookTimeout: 10000,
    
    // Teardown timeout (10 seconds)
    teardownTimeout: 10000,
    
    // Retry failed tests once
    retry: 1,
    
    // Run tests in parallel
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },
    
    // Reporter configuration
    reporters: ['default', 'verbose'],
    
    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@mnbara/types': path.resolve(__dirname, './packages/shared-types/src'),
      '@mnbara/utils': path.resolve(__dirname, './packages/utils/src'),
      '@mnbara/validation': path.resolve(__dirname, './packages/validation/src'),
      '@mnbara/api-client': path.resolve(__dirname, './packages/api-client/src'),
      '@mnbara/ui-components': path.resolve(__dirname, './packages/ui-components/src')
    }
  }
});

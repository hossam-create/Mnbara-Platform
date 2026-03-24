# Nx Cloud Setup Guide

## Overview

Nx Cloud provides distributed caching and computation caching for the Mnbara Platform monorepo. This guide explains how to set up and use Nx Cloud for faster builds and improved developer experience.

## What is Nx Cloud?

Nx Cloud is a cloud-based service that:
- **Distributes task execution** across multiple machines
- **Caches build artifacts** to avoid redundant work
- **Shares computation** across team members and CI/CD pipelines
- **Provides analytics** on build performance and task execution

## Benefits

### Performance Improvements
- **70% reduction in rebuild time** through distributed caching
- **Incremental builds < 1 minute** for most changes
- **Initial builds < 5 minutes** with proper caching

### Developer Experience
- Faster feedback loops during development
- Reduced CI/CD pipeline duration
- Better visibility into build performance

### Team Collaboration
- Shared cache across all team members
- Consistent build results
- Reduced duplicate work

## Setup Instructions

### 1. Create Nx Cloud Account

1. Visit [https://cloud.nx.app](https://cloud.nx.app)
2. Sign up with your GitHub, GitLab, or Bitbucket account
3. Create a new workspace for the Mnbara Platform
4. Note your workspace ID and access token

### 2. Configure Access Token

Add your Nx Cloud access token to your environment:

```bash
# Option 1: Set environment variable
export NX_CLOUD_ACCESS_TOKEN=your_token_here

# Option 2: Add to .env file
echo "NX_CLOUD_ACCESS_TOKEN=your_token_here" >> .env

# Option 3: Add to .env.local (not committed to git)
echo "NX_CLOUD_ACCESS_TOKEN=your_token_here" >> .env.local
```

### 3. Verify Configuration

Test that Nx Cloud is properly configured:

```bash
# Run a build with Nx Cloud
nx build @mnbara/types

# Check the output for Nx Cloud messages
# You should see: "Nx Cloud is enabled"
```

## Configuration Details

### nx.json Configuration

The `nx.json` file is configured with:

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nx/nx-cloud",
      "options": {
        "cacheableOperations": [
          "build",
          "lint",
          "test",
          "e2e"
        ],
        "runtimeCacheInputs": [
          "node --version"
        ],
        "accessToken": "${NX_CLOUD_ACCESS_TOKEN}",
        "canTrackAnalytics": true,
        "showUsageWarnings": true
      }
    }
  }
}
```

### Cacheable Operations

The following operations are cached:
- **build**: Compilation and bundling
- **lint**: Code linting
- **test**: Unit and integration tests
- **e2e**: End-to-end tests

### Cache Invalidation

Cache is automatically invalidated when:
- Source code changes
- Dependencies change (package.json)
- Configuration files change (tsconfig.json, etc.)
- Node version changes

## Usage

### Local Development

```bash
# Build with caching
nx build @mnbara/types

# Run tests with caching
nx test @mnbara/utils

# Run multiple tasks in parallel
nx run-many --target=build --all

# Run affected tasks only
nx affected --target=build
```

### CI/CD Pipeline

In GitHub Actions or other CI/CD systems:

```yaml
- name: Build with Nx Cloud
  run: nx run-many --target=build --all
  env:
    NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}
```

## Monitoring and Analytics

### Nx Cloud Dashboard

Access your Nx Cloud dashboard at [https://cloud.nx.app](https://cloud.nx.app) to:
- View build performance metrics
- Monitor cache hit rates
- Analyze task execution times
- Track team productivity

### Key Metrics

- **Cache Hit Rate**: Percentage of tasks served from cache
- **Average Build Time**: Mean time to complete builds
- **Task Execution Time**: Time spent on individual tasks
- **Distributed Execution**: Tasks run on remote machines

## Troubleshooting

### Nx Cloud Not Connecting

If Nx Cloud is not connecting:

1. Verify your access token is correct
2. Check your internet connection
3. Verify the token is set in the environment
4. Check Nx Cloud status at [https://status.nx.app](https://status.nx.app)

### Cache Not Working

If cache is not working:

1. Verify cache is enabled in nx.json
2. Check that operations are in `cacheableOperations`
3. Verify source files haven't changed
4. Clear local cache: `nx reset`

### Performance Issues

If builds are still slow:

1. Check cache hit rate in Nx Cloud dashboard
2. Verify task dependencies are correct
3. Consider splitting large tasks
4. Profile with `nx build --profile`

## Best Practices

### 1. Keep Cache Keys Consistent

Ensure that:
- Node version is consistent across machines
- Dependencies are locked (package-lock.json)
- Environment variables don't affect build output

### 2. Optimize Task Dependencies

Configure task dependencies to:
- Avoid unnecessary rebuilds
- Enable parallel execution
- Reduce overall build time

### 3. Monitor Cache Performance

Regularly check:
- Cache hit rates
- Build time trends
- Task execution patterns

### 4. Secure Your Access Token

- Never commit access tokens to git
- Use environment variables or .env.local
- Rotate tokens periodically
- Use different tokens for different environments

## Advanced Configuration

### Custom Cache Inputs

To customize what invalidates cache:

```json
{
  "targetDefaults": {
    "build": {
      "inputs": [
        "default",
        "{workspaceRoot}/custom-config.json"
      ]
    }
  }
}
```

### Distributed Execution

To enable distributed execution:

```json
{
  "tasksRunnerOptions": {
    "default": {
      "options": {
        "distributed": true,
        "maxWorkers": 4
      }
    }
  }
}
```

### Custom Cache Directory

To use a custom cache directory:

```bash
export NX_CACHE_DIRECTORY=/custom/cache/path
```

## Performance Targets

Based on requirements, we target:

- **Initial Build Time**: < 5 minutes
- **Incremental Build Time**: < 1 minute
- **Cache Hit Rate**: > 70%
- **Build Time Reduction**: 70% improvement with caching

## Verification

To verify Nx Cloud is working:

```bash
# Run a build twice
nx build @mnbara/types
nx build @mnbara/types

# Second build should be much faster (from cache)
# Output should show: "Nx Cloud cache hit"
```

## References

- [Nx Cloud Documentation](https://nx.dev/nx-cloud)
- [Nx Cloud Pricing](https://nx.dev/nx-cloud/pricing)
- [Nx Cloud Status](https://status.nx.app)

## Support

For issues or questions:
- Check [Nx Cloud Documentation](https://nx.dev/nx-cloud)
- Visit [Nx Community Slack](https://nx.dev/community)
- Open an issue on GitHub

---

**Last Updated:** March 2, 2026  
**Status:** Active

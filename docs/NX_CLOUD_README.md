# Nx Cloud Configuration for Mnbara Platform

## Quick Start

### 1. Get Your Access Token

1. Visit [https://cloud.nx.app](https://cloud.nx.app)
2. Sign up or log in with GitHub
3. Create a workspace for "Mnbara Platform"
4. Copy your access token

### 2. Configure Access Token

```bash
# Option A: Set environment variable
export NX_CLOUD_ACCESS_TOKEN=your_token_here

# Option B: Add to .env.local (recommended for local development)
echo "NX_CLOUD_ACCESS_TOKEN=your_token_here" >> .env.local

# Option C: Use setup script
bash scripts/setup-nx-cloud.sh  # macOS/Linux
scripts/setup-nx-cloud.bat      # Windows
```

### 3. Verify Setup

```bash
# Run a build to test Nx Cloud
nx build @mnbara/shared-types

# You should see output indicating Nx Cloud is enabled
```

## Configuration Files

### nx.json
- **Location**: `nx.json` (root)
- **Purpose**: Nx workspace configuration
- **Key Settings**:
  - `tasksRunnerOptions`: Defines local and cloud runners
  - `targetDefaults`: Configures caching for build, lint, test, e2e
  - `cacheableOperations`: Lists operations that can be cached

### .nxignore
- **Location**: `.nxignore` (root)
- **Purpose**: Files that don't affect cache invalidation
- **Includes**: Documentation, IDE files, logs, etc.

### .env.example
- **Location**: `.env.example` (root)
- **Purpose**: Template for environment variables
- **Key Variable**: `NX_CLOUD_ACCESS_TOKEN`

## How Caching Works

### Local Cache
- Stored in `.nx/cache/`
- Persists between builds on same machine
- Automatically managed by Nx

### Distributed Cache (Nx Cloud)
- Shared across team members
- Shared across CI/CD pipelines
- Accessible from any machine with valid token

### Cache Invalidation
Cache is automatically invalidated when:
- Source code changes
- Dependencies change (package.json)
- Configuration changes (tsconfig.json, etc.)
- Node version changes

## Usage Examples

### Build with Caching
```bash
# First build (no cache)
nx build @mnbara/shared-types

# Second build (from cache - much faster)
nx build @mnbara/shared-types
```

### Run Multiple Tasks
```bash
# Build all packages in parallel
nx run-many --target=build --all

# Test all packages in parallel
nx run-many --target=test --all

# Lint all packages in parallel
nx run-many --target=lint --all
```

### Run Only Affected Projects
```bash
# Build only projects affected by changes
nx affected --target=build

# Test only affected projects
nx affected --target=test

# Lint only affected projects
nx affected --target=lint
```

### Force Rebuild Without Cache
```bash
# Rebuild without using cache
nx build @mnbara/shared-types --no-cache

# Clear all local cache
nx reset

# Clear cache for specific project
nx reset --project=@mnbara/shared-types
```

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Initial Build Time | < 5 minutes | Pending |
| Incremental Build Time | < 1 minute | Pending |
| Cache Hit Rate | > 70% | Pending |
| Build Time Reduction | 70% | Pending |

## Monitoring

### Nx Cloud Dashboard
- **URL**: [https://cloud.nx.app](https://cloud.nx.app)
- **View**: Build performance, cache hit rates, task execution times
- **Metrics**: Team activity, trends, analytics

### Local Monitoring
```bash
# Profile a build
nx build @mnbara/shared-types --profile

# View cache statistics
nx report
```

## Troubleshooting

### Nx Cloud Not Connecting
```bash
# Check if token is set
echo $NX_CLOUD_ACCESS_TOKEN

# Verify token is valid
nx build @mnbara/shared-types --verbose

# Check Nx Cloud status
# Visit: https://status.nx.app
```

### Cache Not Working
```bash
# Clear cache and rebuild
nx reset
nx build @mnbara/shared-types

# Check cache hit rate in Nx Cloud dashboard
# If hit rate is 0%, check:
# 1. Source files haven't changed
# 2. Dependencies haven't changed
# 3. Configuration files haven't changed
```

### Slow Builds
```bash
# Profile the build
nx build @mnbara/shared-types --profile

# Check task dependencies
nx graph

# Check cache hit rate in Nx Cloud dashboard
```

## Best Practices

### 1. Keep Token Secure
- Never commit token to git
- Use .env.local for local development
- Use GitHub Secrets for CI/CD
- Rotate tokens periodically

### 2. Optimize Cache
- Keep dependencies locked (package-lock.json)
- Use consistent Node version
- Avoid environment-specific code
- Monitor cache hit rates

### 3. Use Affected Commands
- Use `nx affected` instead of `nx run-many` when possible
- Reduces unnecessary builds
- Faster feedback during development

### 4. Monitor Performance
- Check Nx Cloud dashboard regularly
- Track build time trends
- Identify slow tasks
- Optimize frequently missed cache

## CI/CD Integration

### GitHub Actions
```yaml
- name: Build with Nx Cloud
  run: nx run-many --target=build --all
  env:
    NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}
```

### GitLab CI
```yaml
build:
  script:
    - nx run-many --target=build --all
  env:
    NX_CLOUD_ACCESS_TOKEN: $CI_JOB_TOKEN
```

## Advanced Configuration

### Custom Cache Inputs
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

## Documentation

- [Nx Caching Strategy](./NX_CACHING_STRATEGY.md)
- [Nx Cloud Setup Guide](./NX_CLOUD_SETUP.md)
- [Nx Documentation](https://nx.dev)
- [Nx Cloud Documentation](https://nx.dev/nx-cloud)

## Support

For issues or questions:
1. Check [Nx Cloud Documentation](https://nx.dev/nx-cloud)
2. Visit [Nx Community Slack](https://nx.dev/community)
3. Open an issue on GitHub

---

**Last Updated:** March 2, 2026  
**Status:** Active

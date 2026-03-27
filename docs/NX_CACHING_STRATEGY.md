# Nx Caching Strategy

## Overview

This document outlines the caching strategy for the Mnbara Platform monorepo using Nx and Nx Cloud. The strategy is designed to meet the performance requirements:

- **Initial build time**: < 5 minutes
- **Incremental builds**: < 1 minute
- **Cache hit rate**: > 70%
- **Build time reduction**: 70% improvement with caching

## Caching Architecture

### Local Cache

Nx maintains a local cache in `.nx/cache/` that stores:
- Build artifacts
- Test results
- Lint results
- Other cacheable operation outputs

### Distributed Cache (Nx Cloud)

Nx Cloud provides:
- Shared cache across team members
- Distributed task execution
- Remote caching for CI/CD pipelines
- Analytics and monitoring

## Cacheable Operations

The following operations are configured as cacheable:

### 1. Build
- **Target**: `build`
- **Inputs**: Source files, dependencies, configuration
- **Outputs**: Compiled code, bundles, artifacts
- **Cache Duration**: Until source or dependencies change

### 2. Lint
- **Target**: `lint`
- **Inputs**: Source files, ESLint configuration
- **Outputs**: Lint results, reports
- **Cache Duration**: Until source or configuration change

### 3. Test
- **Target**: `test`
- **Inputs**: Source files, test files, configuration
- **Outputs**: Test results, coverage reports
- **Cache Duration**: Until source or test files change

### 4. E2E
- **Target**: `e2e`
- **Inputs**: Application code, test files, configuration
- **Outputs**: Test results, reports
- **Cache Duration**: Until code or tests change

## Cache Invalidation

Cache is automatically invalidated when:

### Source Code Changes
- Any file in `src/` directory
- Configuration files (tsconfig.json, etc.)
- Package dependencies (package.json, package-lock.json)

### Environment Changes
- Node version changes
- Environment variables change
- System configuration changes

### Explicit Invalidation
```bash
# Clear local cache
nx reset

# Clear specific project cache
nx reset --project=@mnbara/types

# Force rebuild without cache
nx build @mnbara/types --no-cache
```

## Task Dependencies

Task dependencies are configured to ensure correct build order:

```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "dependsOn": []
    }
  }
}
```

### Dependency Rules

- **`^build`**: Depends on dependencies' build
- **`^test`**: Depends on dependencies' test
- **No dependencies**: Can run independently

## Performance Optimization

### 1. Parallel Execution

Nx automatically runs independent tasks in parallel:

```bash
# Runs all builds in parallel
nx run-many --target=build --all

# Runs affected builds in parallel
nx affected --target=build
```

### 2. Affected Commands

Only rebuild changed projects:

```bash
# Build only affected projects
nx affected --target=build

# Test only affected projects
nx affected --target=test

# Lint only affected projects
nx affected --target=lint
```

### 3. Task Splitting

Large tasks are split into smaller cacheable units:

```bash
# Instead of one large build
nx build @mnbara/web

# Can be split into:
# - Build dependencies
# - Build application
# - Optimize bundle
```

## Cache Hit Optimization

### 1. Consistent Inputs

Ensure cache keys are consistent:
- Lock dependencies (package-lock.json)
- Use consistent Node version
- Avoid environment-specific code

### 2. Minimize Cache Invalidation

Reduce unnecessary cache invalidation:
- Keep configuration files stable
- Avoid changing build scripts frequently
- Use environment variables for dynamic values

### 3. Monitor Cache Performance

Track cache effectiveness:
- Monitor cache hit rates
- Analyze cache miss patterns
- Optimize frequently missed tasks

## Distributed Execution

### Local Distributed Execution

Run tasks on multiple local workers:

```bash
# Run with 4 workers
nx run-many --target=build --all --parallel=4
```

### Remote Distributed Execution (Nx Cloud)

Nx Cloud distributes tasks across remote machines:

```bash
# Automatically distributed by Nx Cloud
nx run-many --target=build --all
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - run: nx affected --target=build
        env:
          NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}
      
      - run: nx affected --target=test
        env:
          NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}
      
      - run: nx affected --target=lint
        env:
          NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}
```

## Monitoring and Analytics

### Nx Cloud Dashboard

Access at [https://cloud.nx.app](https://cloud.nx.app) to view:

- **Build Performance**: Average build times
- **Cache Hit Rate**: Percentage of cached tasks
- **Task Execution**: Individual task performance
- **Team Activity**: Team member activity and trends

### Key Metrics

1. **Cache Hit Rate**
   - Target: > 70%
   - Indicates cache effectiveness
   - Lower rates suggest cache invalidation issues

2. **Average Build Time**
   - Target: < 5 minutes (initial)
   - Target: < 1 minute (incremental)
   - Tracks performance improvements

3. **Task Execution Time**
   - Identifies slow tasks
   - Helps prioritize optimization efforts

4. **Distributed Execution Efficiency**
   - Measures remote execution effectiveness
   - Helps optimize task distribution

## Troubleshooting

### Cache Not Working

**Symptoms**: Tasks always run, cache hit rate is 0%

**Solutions**:
1. Verify cache is enabled in nx.json
2. Check that operations are in `cacheableOperations`
3. Verify source files haven't changed
4. Clear cache: `nx reset`

### Slow Builds Despite Caching

**Symptoms**: Builds still slow even with cache

**Solutions**:
1. Check cache hit rate in Nx Cloud dashboard
2. Verify task dependencies are correct
3. Profile with `nx build --profile`
4. Consider splitting large tasks

### Nx Cloud Not Connecting

**Symptoms**: Nx Cloud features not working

**Solutions**:
1. Verify access token is correct
2. Check internet connection
3. Verify token is set in environment
4. Check Nx Cloud status

## Best Practices

### 1. Keep Cache Keys Consistent
- Use locked dependencies
- Maintain consistent Node version
- Avoid environment-specific code

### 2. Optimize Task Dependencies
- Configure correct `dependsOn` relationships
- Enable parallel execution
- Reduce overall build time

### 3. Monitor Performance
- Check cache hit rates regularly
- Analyze build time trends
- Optimize frequently missed tasks

### 4. Secure Access Tokens
- Never commit tokens to git
- Use environment variables
- Rotate tokens periodically

### 5. Document Cache Strategy
- Keep this document updated
- Document custom cache rules
- Share knowledge with team

## Performance Targets

Based on requirements:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Initial Build Time | < 5 min | TBD | Pending |
| Incremental Build | < 1 min | TBD | Pending |
| Cache Hit Rate | > 70% | TBD | Pending |
| Build Time Reduction | 70% | TBD | Pending |

## Future Improvements

### Phase 2
- [ ] Implement distributed execution
- [ ] Optimize task dependencies
- [ ] Add performance monitoring

### Phase 3
- [ ] Implement advanced caching strategies
- [ ] Add custom cache rules
- [ ] Optimize for specific workflows

### Phase 4
- [ ] Machine learning-based optimization
- [ ] Predictive caching
- [ ] Advanced analytics

## References

- [Nx Caching Documentation](https://nx.dev/features/cache-task-results)
- [Nx Cloud Documentation](https://nx.dev/nx-cloud)
- [Nx Performance Guide](https://nx.dev/recipes/performance)

---

**Last Updated:** March 2, 2026  
**Status:** Active

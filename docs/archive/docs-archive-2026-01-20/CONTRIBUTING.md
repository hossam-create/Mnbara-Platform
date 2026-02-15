# Contributing to MNBARA Platform

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `release/*` - Release preparation

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Adding tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance

Examples:
```
feat(auction): add auto-extend functionality
fix(payment): resolve escrow release timing issue
docs(api): update authentication endpoints
```

## Code Standards

### TypeScript

- Use strict mode
- Prefer interfaces over types
- Use explicit return types
- Document public APIs with JSDoc

### React

- Use functional components with hooks
- Keep components small and focused
- Use React.memo for expensive renders
- Follow the container/presentational pattern

### Testing

- Write unit tests for business logic
- Write integration tests for API endpoints
- Aim for 80%+ coverage on critical paths
- Use meaningful test descriptions

## Project Structure Guidelines

### Backend Services

Each service should follow:

```
service-name/
├── src/
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── repositories/   # Data access
│   ├── middleware/     # Express middleware
│   ├── routes/         # Route definitions
│   ├── types/          # TypeScript types
│   └── index.ts        # Entry point
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # DB migrations
├── __tests__/          # Test files
├── package.json
└── tsconfig.json
```

### Frontend Applications

```
app-name/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React contexts
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript types
├── public/             # Static assets
├── __tests__/          # Test files
└── package.json
```

## Adding New Features

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Implement the feature with tests
3. Update documentation if needed
4. Run linting: `npm run lint`
5. Run tests: `npm test`
6. Create PR against `develop`

## Database Migrations

```bash
# Create a new migration
cd backend/services/<service-name>
npx prisma migrate dev --name <migration-name>

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Environment Variables

Required environment variables are documented in `.env.example`. Never commit actual secrets.

## Getting Help

- Check existing documentation in `/docs`
- Review the spec files in `.kiro/specs`
- Ask in the team Slack channel

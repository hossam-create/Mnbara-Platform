# Contributing to Mnbara Platform

This document outlines the development workflow, code standards, and contribution process for the Mnbara Platform monorepo.

## 📋 Table of Contents

1. [Development Setup](#development-setup)
2. [Code Standards](#code-standards)
3. [Commit Conventions](#commit-conventions)
4. [Pull Request Process](#pull-request-process)
5. [Testing Requirements](#testing-requirements)
6. [Project Structure](#project-structure)
7. [Common Tasks](#common-tasks)

## 🚀 Development Setup

### Prerequisites
- Node.js 20+
- npm 10+
- Git
- Docker (for local services)

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd mnbara-platform

# Install dependencies
npm install

# Verify setup
npm run verify-setup

# Start development environment
npm run dev
```

### Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Configure for your environment
# Edit .env with your settings
```

## 📝 Code Standards

### TypeScript

- Use strict mode: `"strict": true` in tsconfig.json
- Avoid `any` type - use proper typing
- Use interfaces for object shapes
- Use enums for constants

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  roles: UserRole[];
}

enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest'
}

// ❌ Avoid
const user: any = { id: 1, email: 'test@example.com' };
```

### React Components

- Use functional components with hooks
- Use TypeScript for prop types
- Keep components focused and reusable
- Use CSS modules for styling

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary' 
}) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};
```

### NestJS Services

- Use dependency injection
- Implement proper error handling
- Use DTOs for request/response validation
- Add comprehensive logging

```typescript
// ✅ Good
@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private logger: Logger
  ) {}

  async findById(id: string): Promise<User> {
    this.logger.log(`Finding user with id: ${id}`);
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

### Naming Conventions

- **Files**: kebab-case (e.g., `user-service.ts`)
- **Classes**: PascalCase (e.g., `UserService`)
- **Functions**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `IUser`)

### Imports

- Use absolute imports with path aliases
- Group imports: external, internal, relative
- Sort imports alphabetically

```typescript
// ✅ Good
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mnbara/prisma';
import { User } from '@mnbara/types';

import { UserRepository } from './user.repository';
import { logger } from '../utils/logger';
```

### Error Handling

- Use custom error classes
- Provide meaningful error messages
- Log errors appropriately
- Return proper HTTP status codes

```typescript
// ✅ Good
class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`User with id ${id} not found`);
    this.name = 'UserNotFoundError';
  }
}

try {
  const user = await userService.findById(id);
} catch (error) {
  logger.error('Failed to find user', { id, error });
  throw new UserNotFoundError(id);
}
```

## 📌 Commit Conventions

Use conventional commits for clear commit history:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

### Examples

```bash
# Feature
git commit -m "feat(auth): add JWT token refresh mechanism"

# Bug fix
git commit -m "fix(order): correct total calculation with tax"

# Documentation
git commit -m "docs(api): update endpoint documentation"

# Refactor
git commit -m "refactor(user-service): simplify validation logic"
```

## 🔄 Pull Request Process

### Before Creating a PR

1. Create a feature branch from `main`
   ```bash
   git checkout -b feat/user-authentication
   ```

2. Make your changes following code standards

3. Run tests locally
   ```bash
   npm run test
   npm run test:coverage
   ```

4. Run linting
   ```bash
   npm run lint
   npm run lint:fix
   ```

5. Build to verify no errors
   ```bash
   npm run build
   ```

### Creating a PR

1. Push your branch
   ```bash
   git push origin feat/user-authentication
   ```

2. Create PR with descriptive title and description

3. PR Title Format: `[Type] Description`
   - `[Feature] Add user authentication`
   - `[Fix] Correct order total calculation`
   - `[Docs] Update API documentation`

4. PR Description Template:
   ```markdown
   ## Description
   Brief description of changes

   ## Related Issues
   Closes #123

   ## Changes
   - Change 1
   - Change 2

   ## Testing
   - [ ] Unit tests added
   - [ ] Integration tests added
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex logic
   - [ ] Documentation updated
   - [ ] No breaking changes
   ```

### PR Review

- Address all review comments
- Request re-review after changes
- Ensure CI/CD passes
- Squash commits before merge (if requested)

## ✅ Testing Requirements

### Unit Tests

- Minimum 80% code coverage
- Test happy path and error cases
- Use descriptive test names

```typescript
describe('UserService', () => {
  describe('findById', () => {
    it('should return user when found', async () => {
      const user = await userService.findById('123');
      expect(user).toBeDefined();
      expect(user.id).toBe('123');
    });

    it('should throw error when user not found', async () => {
      await expect(userService.findById('invalid')).rejects.toThrow();
    });
  });
});
```

### Integration Tests

- Test service-to-service communication
- Test database operations
- Test API endpoints

```typescript
describe('User API', () => {
  it('should create user and return 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });
});
```

### Property-Based Tests

- Test correctness properties
- Use fast-check for generating test cases
- Document properties being tested

```typescript
describe('Order Total Calculation', () => {
  it('should always calculate correct total', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          price: fc.float({ min: 0.01, max: 1000 }),
          quantity: fc.integer({ min: 1, max: 100 })
        })),
        (items) => {
          const order = createOrder(items);
          const expected = items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0);
          return Math.abs(order.total - expected) < 0.01;
        }
      )
    );
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests for specific package
npm run test @mnbara/types

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run property-based tests
npm run test:pbt
```

## 📁 Project Structure

### Adding a New Package

```bash
# Generate new library
nx generate @nx/node:library --name=my-package --directory=packages

# Or manually create structure
packages/my-package/
├── src/
│   ├── index.ts
│   └── my-package.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Adding a New Service

```bash
# Generate new NestJS service
nx generate @nx/nest:application --name=my-service --directory=services/core

# Or manually create structure
services/core/my-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   └── services/
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## 🛠️ Common Tasks

### Build a Package

```bash
# Build specific package
nx build @mnbara/types

# Build all packages
nx run-many --target=build --all

# Build affected packages
nx affected --target=build
```

### Run Tests

```bash
# Test specific package
nx test @mnbara/types

# Test all packages
nx run-many --target=test --all

# Test affected packages
nx affected --target=test
```

### Lint Code

```bash
# Lint specific package
nx lint @mnbara/types

# Lint all packages
nx run-many --target=lint --all

# Fix linting issues
nx run-many --target=lint --all -- --fix
```

### View Dependency Graph

```bash
# Open interactive graph
nx graph

# Save graph to file
nx graph --file=graph.html
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Update specific package
npm install package@latest
```

## 🐛 Debugging

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "program": "${workspaceFolder}/node_modules/.bin/nest",
      "args": ["start", "--debug", "--watch"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Logging

Use the logger utility:

```typescript
import { logger } from '@mnbara/utils';

logger.info('User created', { userId: user.id });
logger.error('Failed to create user', { error });
logger.warn('Deprecated API used', { endpoint: '/api/v1/users' });
```

## 📚 Resources

- [Nx Documentation](https://nx.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [NestJS Documentation](https://docs.nestjs.com)
- [React Documentation](https://react.dev)
- [Next.js Documentation](https://nextjs.org/docs)

## ❓ Questions?

- Check existing documentation
- Review similar implementations
- Ask in team channels
- Create an issue for discussion

---

**Last Updated:** March 2026  
**Version:** 1.0

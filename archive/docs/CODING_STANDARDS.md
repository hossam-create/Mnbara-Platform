# Mnbarh Platform - Coding Standards

**Version:** 1.0  
**Last Updated:** 2025-12-22  
**Status:** ًں”´ IN PROGRESS

---

## ًں“‹ Table of Contents

1. [General Principles](#general-principles)
2. [JavaScript/TypeScript Standards](#javascripttypescript-standards)
3. [Python Standards](#python-standards)
4. [Dart/Flutter Standards](#dartflutter-standards)
5. [Solidity Standards](#solidity-standards)
6. [Database Standards](#database-standards)
7. [API Standards](#api-standards)
8. [Testing Standards](#testing-standards)
9. [Documentation Standards](#documentation-standards)
10. [Git Standards](#git-standards)

---

## ًںژ¯ General Principles

### 1. Code Quality
- **Readability:** Code should be self-documenting
- **Maintainability:** Easy to understand and modify
- **Performance:** Optimized for speed and memory
- **Security:** Follows security best practices
- **Consistency:** Uniform style across codebase

### 2. SOLID Principles
- **S**ingle Responsibility: One reason to change
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes must be substitutable
- **I**nterface Segregation: Many specific interfaces
- **D**ependency Inversion: Depend on abstractions

### 3. DRY (Don't Repeat Yourself)
- Extract common code into reusable functions
- Use inheritance and composition appropriately
- Create utility functions for repeated logic

### 4. KISS (Keep It Simple, Stupid)
- Avoid over-engineering
- Use straightforward solutions
- Prefer clarity over cleverness

---

## ًں”¤ JavaScript/TypeScript Standards

### File Structure
```
src/
â”œâ”€â”€ services/          # Business logic
â”œâ”€â”€ controllers/       # Request handlers
â”œâ”€â”€ models/           # Data models
â”œâ”€â”€ middleware/       # Express middleware
â”œâ”€â”€ utils/            # Utility functions
â”œâ”€â”€ config/           # Configuration
â”œâ”€â”€ types/            # TypeScript types
â””â”€â”€ tests/            # Test files
```

### Naming Conventions

#### Files
- **Services:** `userService.ts`, `paymentService.ts`
- **Controllers:** `userController.ts`, `orderController.ts`
- **Models:** `User.ts`, `Order.ts`
- **Utils:** `dateUtils.ts`, `validationUtils.ts`
- **Tests:** `userService.test.ts`, `orderController.test.ts`

#### Variables & Functions
```typescript
// Constants - UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_TIMEOUT = 5000;

// Variables - camelCase
let userCount = 0;
const userData = {};

// Functions - camelCase
function calculateTotal() {}
const getUserById = (id: string) => {};

// Classes - PascalCase
class UserService {}
class PaymentProcessor {}

// Interfaces - PascalCase with I prefix (optional)
interface IUser {}
interface IPayment {}

// Enums - PascalCase
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}
```

### Code Style

#### Indentation
- Use 2 spaces (configured in `.prettierrc`)
- Never use tabs

#### Line Length
- Maximum 100 characters
- Break long lines appropriately

#### Semicolons
- Always use semicolons
- Configured in `.eslintrc.json`

#### Quotes
- Use single quotes for strings
- Use backticks for template literals

```typescript
// âœ… Good
const message = 'Hello, World!';
const greeting = `Hello, ${name}!`;

// â‌Œ Bad
const message = "Hello, World!";
const greeting = `Hello, ${name}`;
```

#### Spacing
```typescript
// âœ… Good
if (condition) {
  doSomething();
}

function add(a: number, b: number): number {
  return a + b;
}

// â‌Œ Bad
if(condition){
  doSomething();
}

function add(a:number,b:number):number{
  return a+b;
}
```

### TypeScript Specific

#### Type Annotations
```typescript
// âœ… Good - Always annotate function parameters and return types
function getUserById(id: string): Promise<User> {
  return db.users.findById(id);
}

// â‌Œ Bad - Missing type annotations
function getUserById(id) {
  return db.users.findById(id);
}
```

#### Interfaces vs Types
```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// Use types for unions and complex types
type UserRole = 'admin' | 'user' | 'guest';
type Result<T> = Success<T> | Error;
```

#### Null/Undefined Handling
```typescript
// âœ… Good - Use optional chaining and nullish coalescing
const name = user?.profile?.name ?? 'Unknown';

// â‌Œ Bad - Unsafe access
const name = user.profile.name;
```

### Error Handling

```typescript
// âœ… Good - Specific error handling
try {
  const user = await getUserById(id);
  if (!user) {
    throw new NotFoundError(`User ${id} not found`);
  }
  return user;
} catch (error) {
  if (error instanceof NotFoundError) {
    logger.warn(error.message);
    throw error;
  }
  logger.error('Unexpected error:', error);
  throw new InternalServerError('Failed to get user');
}

// â‌Œ Bad - Generic error handling
try {
  return await getUserById(id);
} catch (error) {
  console.log(error);
  return null;
}
```

### Async/Await

```typescript
// âœ… Good - Use async/await
async function fetchUserData(id: string): Promise<User> {
  try {
    const user = await db.users.findById(id);
    return user;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}

// â‌Œ Bad - Callback hell
function fetchUserData(id, callback) {
  db.users.findById(id, (err, user) => {
    if (err) callback(err);
    else callback(null, user);
  });
}
```

---

## ًںگچ Python Standards

### File Structure
```
src/
â”œâ”€â”€ services/          # Business logic
â”œâ”€â”€ models/           # Data models
â”œâ”€â”€ utils/            # Utility functions
â”œâ”€â”€ config/           # Configuration
â”œâ”€â”€ tests/            # Test files
â””â”€â”€ main.py          # Entry point
```

### Naming Conventions

#### Files
- Use `snake_case` for filenames
- `user_service.py`, `payment_processor.py`

#### Variables & Functions
```python
# Constants - UPPER_SNAKE_CASE
MAX_RETRY_ATTEMPTS = 3
API_TIMEOUT = 5000

# Variables - snake_case
user_count = 0
user_data = {}

# Functions - snake_case
def calculate_total():
    pass

def get_user_by_id(user_id: str) -> User:
    pass

# Classes - PascalCase
class UserService:
    pass

class PaymentProcessor:
    pass
```

### Code Style

#### PEP 8 Compliance
- Follow PEP 8 guidelines
- Use `black` for formatting
- Use `flake8` for linting

#### Line Length
- Maximum 88 characters (black default)

#### Indentation
- Use 4 spaces
- Never use tabs

#### Imports
```python
# âœ… Good - Organized imports
import os
import sys
from typing import List, Optional

import numpy as np
import pandas as pd

from src.models import User
from src.utils import validate_email
```

### Type Hints

```python
# âœ… Good - Always use type hints
def get_user_by_id(user_id: str) -> Optional[User]:
    return db.users.find_by_id(user_id)

def process_users(users: List[User]) -> Dict[str, int]:
    return {user.id: user.age for user in users}

# â‌Œ Bad - Missing type hints
def get_user_by_id(user_id):
    return db.users.find_by_id(user_id)
```

### Error Handling

```python
# âœ… Good - Specific exception handling
try:
    user = get_user_by_id(user_id)
    if not user:
        raise UserNotFoundError(f'User {user_id} not found')
    return user
except UserNotFoundError as e:
    logger.warning(str(e))
    raise
except Exception as e:
    logger.error(f'Unexpected error: {e}')
    raise InternalServerError('Failed to get user')

# â‌Œ Bad - Generic exception handling
try:
    return get_user_by_id(user_id)
except:
    print('Error')
    return None
```

---

## ًںژ¨ Dart/Flutter Standards

### File Structure
```
lib/
â”œâ”€â”€ screens/          # UI screens
â”œâ”€â”€ widgets/          # Reusable widgets
â”œâ”€â”€ services/         # Business logic
â”œâ”€â”€ models/           # Data models
â”œâ”€â”€ providers/        # State management
â”œâ”€â”€ utils/            # Utility functions
â””â”€â”€ config/           # Configuration
```

### Naming Conventions

#### Files
- Use `snake_case` for filenames
- `user_screen.dart`, `payment_service.dart`

#### Classes & Widgets
```dart
// Classes - PascalCase
class UserService {}
class PaymentProcessor {}

// Widgets - PascalCase
class UserProfileScreen extends StatelessWidget {}
class ProductCard extends StatefulWidget {}

// Variables - camelCase
String userName = 'John';
int userAge = 30;

// Constants - camelCase
const double defaultPadding = 16.0;
const String apiBaseUrl = 'https://api.example.com';
```

### Code Style

#### Formatting
- Use `dart format` for formatting
- Maximum 80 characters per line

#### Spacing
```dart
// âœ… Good
class UserService {
  Future<User> getUserById(String id) async {
    return await api.get('/users/$id');
  }
}

// â‌Œ Bad
class UserService{
  Future<User> getUserById(String id)async{
    return await api.get('/users/$id');
  }
}
```

### Null Safety

```dart
// âœ… Good - Use null safety
String? userName;
final String name = user?.name ?? 'Unknown';

// â‌Œ Bad - Unsafe null access
String userName;
final String name = user.name;
```

---

## ًں”— Solidity Standards

### File Structure
```
contracts/
â”œâ”€â”€ core/             # Core contracts
â”œâ”€â”€ interfaces/       # Interface definitions
â”œâ”€â”€ libraries/        # Reusable libraries
â”œâ”€â”€ mocks/            # Mock contracts for testing
â””â”€â”€ test/             # Test files
```

### Naming Conventions

#### Contracts
```solidity
// PascalCase
contract UserRegistry {}
contract PaymentProcessor {}

// Interfaces - I prefix
interface IUserRegistry {}
interface IPaymentProcessor {}

// Libraries - Lib suffix
library SafeMath {}
library StringUtils {}
```

#### Functions & Variables
```solidity
// Functions - camelCase
function getUserById(uint256 id) public view returns (User memory) {}

// State variables - camelCase
uint256 public totalUsers;
mapping(address => User) public users;

// Constants - UPPER_SNAKE_CASE
uint256 constant MAX_USERS = 1000000;
address constant ZERO_ADDRESS = address(0);
```

### Code Style

#### Indentation
- Use 4 spaces
- Never use tabs

#### Visibility
```solidity
// âœ… Good - Explicit visibility
contract PaymentProcessor {
  uint256 private totalAmount;
  
  function processPayment(uint256 amount) external payable {
    // ...
  }
}

// â‌Œ Bad - Implicit visibility
contract PaymentProcessor {
  uint256 totalAmount;
  
  function processPayment(uint256 amount) {
    // ...
  }
}
```

### Security Best Practices

```solidity
// âœ… Good - Checks-Effects-Interactions pattern
function withdraw(uint256 amount) external {
  require(balances[msg.sender] >= amount, 'Insufficient balance');
  balances[msg.sender] -= amount;
  (bool success, ) = msg.sender.call{value: amount}('');
  require(success, 'Transfer failed');
}

// â‌Œ Bad - Vulnerable to reentrancy
function withdraw(uint256 amount) external {
  (bool success, ) = msg.sender.call{value: amount}('');
  require(success, 'Transfer failed');
  balances[msg.sender] -= amount;
}
```

---

## ًں—„ï¸ڈ Database Standards

### Table Naming
- Use `snake_case` for table names
- Use plural form: `users`, `orders`, `products`

### Column Naming
- Use `snake_case` for column names
- Use descriptive names: `created_at`, `updated_at`, `user_id`

### Schema Design
```sql
-- âœ… Good
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- â‌Œ Bad
CREATE TABLE user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255),
  fname VARCHAR(100),
  lname VARCHAR(100)
);
```

### Indexes
- Index foreign keys
- Index frequently queried columns
- Index columns used in WHERE clauses

### Constraints
- Use NOT NULL for required fields
- Use UNIQUE for unique fields
- Use FOREIGN KEY for relationships
- Use CHECK for data validation

---

## ًں”Œ API Standards

### Endpoint Naming
```
GET    /api/v1/users              # List users
POST   /api/v1/users              # Create user
GET    /api/v1/users/:id          # Get user
PUT    /api/v1/users/:id          # Update user
DELETE /api/v1/users/:id          # Delete user
```

### Request/Response Format
```json
// âœ… Good - Consistent format
{
  "status": "success",
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "timestamp": "2025-12-22T10:00:00Z"
}

// Error response
{
  "status": "error",
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID 123 not found"
  },
  "timestamp": "2025-12-22T10:00:00Z"
}
```

### Status Codes
- `200 OK` - Successful request
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## âœ… Testing Standards

### Test Structure
```
tests/
â”œâ”€â”€ unit/             # Unit tests
â”œâ”€â”€ integration/      # Integration tests
â”œâ”€â”€ e2e/              # End-to-end tests
â””â”€â”€ fixtures/         # Test data
```

### Test Naming
```typescript
// âœ… Good - Descriptive test names
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when user exists', () => {});
    it('should throw NotFoundError when user does not exist', () => {});
    it('should return cached user on second call', () => {});
  });
});

// â‌Œ Bad - Vague test names
describe('UserService', () => {
  it('test 1', () => {});
  it('test 2', () => {});
});
```

### Test Coverage
- Minimum 80% code coverage
- 100% coverage for critical paths
- All error cases tested
- All edge cases tested

### Test Best Practices
- One assertion per test (when possible)
- Use descriptive variable names
- Mock external dependencies
- Use fixtures for test data
- Clean up after tests

---

## ًں“ڑ Documentation Standards

### Code Comments
```typescript
// âœ… Good - Explain WHY, not WHAT
// We cache the user for 5 minutes to reduce database load
const cachedUser = await cache.get(`user:${id}`);

// â‌Œ Bad - Obvious comments
// Get the user from cache
const cachedUser = await cache.get(`user:${id}`);
```

### Function Documentation
```typescript
/**
 * Retrieves a user by their ID
 * @param id - The user's unique identifier
 * @returns Promise resolving to the User object
 * @throws NotFoundError if user does not exist
 * @example
 * const user = await getUserById('123');
 */
async function getUserById(id: string): Promise<User> {
  // ...
}
```

### README Files
- Clear project description
- Installation instructions
- Usage examples
- API documentation
- Contributing guidelines

---

## ًں”€ Git Standards

### Commit Messages
```
Format: <type>(<scope>): <subject>

<body>

<footer>

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that don't affect code meaning
- refactor: Code change that neither fixes a bug nor adds a feature
- perf: Code change that improves performance
- test: Adding missing tests
- chore: Changes to build process or dependencies

Examples:
feat(auth): add JWT token refresh mechanism
fix(payment): handle stripe webhook timeout
docs(api): update endpoint documentation
```

### Branch Naming
```
feature/user-authentication
bugfix/payment-processing-error
docs/api-documentation
refactor/database-queries
```

### Pull Request Process
1. Create feature branch from `main`
2. Make changes and commit
3. Push to remote
4. Create pull request
5. Code review (minimum 2 approvals)
6. Merge to `main`
7. Delete feature branch

---

## ًں”چ Code Review Checklist

- [ ] Code follows established standards
- [ ] No hardcoded values or secrets
- [ ] Proper error handling
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No performance regressions
- [ ] Security best practices followed
- [ ] No code duplication

---

**Status:** ًں”´ IN PROGRESS  
**Last Updated:** 2025-12-22  
**Next Review:** 2025-12-29


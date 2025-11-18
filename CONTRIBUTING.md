# Contributing to Nexus Framework

First off, thank you for considering contributing to Nexus Framework! It's people like you that make Nexus such a great tool.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Community](#community)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to contato@oryum.tech.

### Our Pledge

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git
- PostgreSQL (for database-dependent features)
- Redis (for caching features)

### Quick Start

```bash
# Fork and clone the repository
git clone https://github.com/your-username/nexus.git
cd nexus

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your local configuration

# Run tests
npm test

# Start development server
npm run dev
```

---

## 💻 Development Setup

### 1. Fork the Repository

Click the "Fork" button at the top right of the repository page.

### 2. Clone Your Fork

```bash
git clone https://github.com/your-username/nexus.git
cd nexus
```

### 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/KallebyX/nexus.git
```

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `test/description` - Test additions or updates
- `refactor/description` - Code refactoring
- `chore/description` - Maintenance tasks

### 5. Install Dependencies

```bash
npm install
```

### 6. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:

```env
# Minimum required for development
NODE_ENV=development
PORT=3000
JWT_SECRET=your-dev-secret-min-32-chars

# Database (if testing database features)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nexus_dev

# Redis (if testing cache features)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 7. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- path/to/test.js

# Run with coverage
npm test -- --coverage
```

---

## 🤝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Environment details** (OS, Node version, etc.)
- **Screenshots** (if applicable)
- **Error messages or stack traces**

**Bug Report Template:**

```markdown
## Bug Description
A clear and concise description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g., Ubuntu 22.04]
- Node: [e.g., 18.17.0]
- Framework Version: [e.g., 1.0.0]

## Additional Context
Add any other context about the problem.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** - Why is this enhancement useful?
- **Proposed solution**
- **Alternative solutions considered**
- **Additional context**

### Contributing Code

1. **Check existing issues** - Look for open issues or create a new one
2. **Discuss major changes** - For significant changes, open an issue first
3. **Write code** - Follow our coding standards
4. **Write tests** - All new features must include tests
5. **Update documentation** - Document new features or API changes
6. **Submit PR** - Create a pull request

---

## 📝 Coding Standards

### JavaScript/Node.js Style Guide

We follow a consistent coding style across the project:

#### General Rules

- Use **ES6+ features** (const/let, arrow functions, destructuring)
- Use **ES Modules** (import/export) not CommonJS (require/module.exports)
- Use **async/await** for asynchronous operations
- Prefer **const** over let, never use var
- Use **meaningful variable names**
- Keep functions **small and focused**
- Add **JSDoc comments** for public APIs

#### Code Examples

**✅ Good:**

```javascript
// Use descriptive names
const userEmail = 'user@example.com';

// Use const for values that don't change
const MAX_LOGIN_ATTEMPTS = 5;

// Use async/await
async function fetchUser(userId) {
  try {
    const user = await User.findByPk(userId);
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Use destructuring
const { email, firstName, lastName } = user;

// Use template literals
const message = `Welcome, ${firstName} ${lastName}!`;

// Use arrow functions for callbacks
users.map(user => user.email);
```

**❌ Bad:**

```javascript
// Don't use var
var x = 5;

// Don't use unclear names
const e = 'user@example.com';

// Don't use callbacks when async/await is available
User.findByPk(userId, (err, user) => {
  if (err) return callback(err);
  callback(null, user);
});

// Don't concatenate strings
const message = 'Welcome, ' + firstName + ' ' + lastName + '!';
```

### File Organization

```javascript
/**
 * File header with description
 * Module Name - Brief Description
 */

// 1. Imports
import { something } from 'external-package';
import { localFunction } from './local-file.js';

// 2. Constants
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;

// 3. Helper functions
function helperFunction() {
  // Implementation
}

// 4. Main exports
export class MainClass {
  // Implementation
}

export async function mainFunction() {
  // Implementation
}

// 5. Default export (if needed)
export default MainClass;
```

### Module Structure

Each module should follow this structure:

```
module-name/
├── index.js              # Main export
├── config.js             # Configuration
├── services/             # Business logic
│   └── ServiceName.js
├── middleware/           # Middleware functions
│   └── middlewareName.js
├── models/               # Database models
│   └── ModelName.js
├── __tests__/            # Tests
│   ├── index.test.js
│   └── ServiceName.test.js
└── README.md             # Module documentation
```

### ESLint Configuration

Run linter before committing:

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### Prettier Configuration

Format code:

```bash
npm run format      # Format all files
```

---

## 🧪 Testing Guidelines

### Test Structure

- Use **descriptive test names**
- Follow **Arrange-Act-Assert** pattern
- **One assertion per test** when possible
- Use **beforeEach/afterEach** for setup/cleanup

### Test Example

```javascript
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { UserService } from '../UserService.js';

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    test('should create a new user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        first_name: 'Test'
      };

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.password).not.toBe(userData.password); // Should be hashed
    });

    test('should reject invalid email', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        first_name: 'Test'
      };

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Invalid email');
    });
  });
});
```

### Test Coverage

- Aim for **90%+ coverage** for new code
- Critical paths must have **100% coverage**
- Include **edge cases** and **error scenarios**

### Running Tests

```bash
# All tests
npm test

# With coverage
npm test -- --coverage

# Specific file
npm test -- path/to/test.js

# Watch mode
npm run test:watch

# Update snapshots
npm test -- -u
```

---

## 💬 Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD changes
- **build**: Build system changes

### Examples

**Feature:**
```
feat(auth): add password reset functionality

- Add email verification for password reset
- Implement token generation and validation
- Add rate limiting for reset requests

Closes #123
```

**Bug Fix:**
```
fix(database): resolve connection pool leak

Fixed issue where database connections were not being
properly released back to the pool, causing exhaustion
under heavy load.

Fixes #456
```

**Documentation:**
```
docs(api): update authentication endpoints documentation

- Add examples for all auth endpoints
- Document rate limiting behavior
- Add error response schemas
```

### Best Practices

- Use **imperative mood** ("add" not "added")
- Keep subject line **under 50 characters**
- Capitalize subject line
- No period at the end of subject
- Separate subject from body with blank line
- Wrap body at **72 characters**
- Explain **what** and **why**, not how

---

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows project coding standards
- [ ] All tests pass (`npm test`)
- [ ] New tests added for new features
- [ ] Code coverage maintained or improved
- [ ] Linter passes (`npm run lint`)
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Fixes #(issue number)

## How Has This Been Tested?
Describe the tests you ran

## Checklist
- [ ] Tests pass locally
- [ ] Added tests for new features
- [ ] Updated documentation
- [ ] Followed coding standards
- [ ] Self-review completed
```

### Review Process

1. **Automated checks** run (tests, linting, coverage)
2. **Code review** by maintainers
3. **Address feedback** if requested
4. **Approval** by at least one maintainer
5. **Merge** to main branch

### After PR is Merged

- Delete your branch
- Update your local repository:

```bash
git checkout main
git pull upstream main
git push origin main
```

---

## 📚 Documentation

### Code Documentation

- Add **JSDoc comments** for all public APIs
- Include **parameter types** and **return types**
- Provide **usage examples**

**Example:**

```javascript
/**
 * Creates a new user account
 *
 * @param {Object} userData - User data
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password (will be hashed)
 * @param {string} userData.first_name - User's first name
 * @returns {Promise<Object>} Created user object
 * @throws {ValidationError} If user data is invalid
 * @throws {ConflictError} If user already exists
 *
 * @example
 * const user = await createUser({
 *   email: 'user@example.com',
 *   password: 'SecurePass123!',
 *   first_name: 'John'
 * });
 */
async function createUser(userData) {
  // Implementation
}
```

### README Updates

When adding new features, update:

- Main README.md
- Module-specific READMEs
- API documentation
- Examples

### Documentation Files

- **README.md** - Project overview
- **WIKI.md** - Technical reference
- **TUTORIAL.md** - Step-by-step guides
- **API.md** - API documentation
- **CONTRIBUTING.md** - This file

---

## 👥 Community

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and discussions
- **Email** - contato@oryum.tech

### Getting Help

- Check [documentation](./docs/)
- Search [existing issues](https://github.com/KallebyX/nexus/issues)
- Ask in [Discussions](https://github.com/KallebyX/nexus/discussions)
- Email us at contato@oryum.tech

### Recognition

Contributors are recognized in:

- README.md Contributors section
- Release notes
- Project documentation

---

## ❓ FAQ

**Q: How do I set up the database for local development?**

A: See [Development Setup](#development-setup) for database configuration. You'll need PostgreSQL and Redis running locally.

**Q: Do I need to sign a CLA?**

A: No, we don't require a Contributor License Agreement.

**Q: Can I work on an issue that's assigned to someone else?**

A: Please check with the assigned person first or wait to see if they're actively working on it.

**Q: How long does it take to review a PR?**

A: We aim to review PRs within 2-3 business days. Complex PRs may take longer.

**Q: My PR was closed without merging. Why?**

A: PRs may be closed if they don't follow guidelines, have conflicts, or the feature doesn't align with project goals. Feel free to ask for clarification.

---

## 📄 License

By contributing to Nexus Framework, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You!

Thank you for taking the time to contribute to Nexus Framework! Every contribution, no matter how small, makes a difference.

**Happy Coding! 🚀**

---

*Last updated: 2025-11-18*

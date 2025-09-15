# Contributing Guide

Thank you for your interest in contributing to the AI-First SaaS React Starter! This guide will help you get started with contributing to the framework.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Contribution Guidelines](#code-contribution-guidelines)
- [Plugin Contribution](#plugin-contribution)
- [Documentation Contribution](#documentation-contribution)
- [Bug Reports](#bug-reports)
- [Feature Requests](#feature-requests)
- [Code Review Process](#code-review-process)
- [Release Process](#release-process)
- [Community Guidelines](#community-guidelines)

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** installed
- **Git** installed and configured
- **Basic understanding** of React, TypeScript, and modern JavaScript
- **Familiarity** with our plugin architecture (see [Architecture documentation](./architecture.md))

### Ways to Contribute

1. **Code Contributions**
   - Bug fixes
   - New features
   - Performance improvements
   - Plugin development

2. **Documentation**
   - Improving existing documentation
   - Adding examples
   - Writing tutorials
   - Translating content

3. **Community Support**
   - Answering questions in discussions
   - Helping with bug reports
   - Code reviews
   - Testing beta features

4. **Testing**
   - Writing test cases
   - Manual testing of features
   - Performance testing
   - Security testing

## Development Setup

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/your-username/ai-first-saas-react-starter.git
cd ai-first-saas-react-starter
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/original-org/ai-first-saas-react-starter.git
```

### Install Dependencies

```bash
# Install dependencies
npm install

# Verify installation
npm run typecheck
npm run lint
npm test
```

### Development Environment

```bash
# Start development server
npm run dev

# Start with mock API
REACT_APP_USE_MOCK_API=true npm start

# Run tests in watch mode
npm run test:watch
```

### Project Structure

```
ai-first-saas-react-starter/
├── src/
│   ├── core/                 # Core framework code
│   │   ├── auth/            # Authentication system
│   │   ├── api/             # API services
│   │   ├── events/          # Event bus system
│   │   ├── plugins/         # Plugin management
│   │   └── stores/          # State management
│   ├── plugins/             # Built-in plugins
│   ├── utils/               # Shared utilities
│   └── types/               # TypeScript type definitions
├── docs/                    # Documentation
├── examples/                # Example implementations
├── tools/                   # CLI tools and generators
└── tests/                   # Test utilities and setup
```

## Code Contribution Guidelines

### Coding Standards

We follow strict coding standards to maintain code quality:

1. **TypeScript First**: All new code must be written in TypeScript
2. **ESLint**: Code must pass all linting rules
3. **Prettier**: Code must be formatted with Prettier
4. **Tests**: All new features must include tests
5. **Documentation**: Public APIs must be documented

### Code Style

```typescript
// ✅ Good: Follow our coding conventions
export interface UserService {
  fetchUsers(params?: FetchUsersParams): Promise<User[]>;
  createUser(userData: CreateUserData): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

export class UserServiceImpl implements UserService {
  constructor(
    private apiClient: ApiClient,
    private eventBus: EventBus
  ) {}

  async fetchUsers(params: FetchUsersParams = {}): Promise<User[]> {
    try {
      const response = await this.apiClient.get('/users', { params });
      return response.data;
    } catch (error) {
      this.handleError('fetchUsers', error);
      throw error;
    }
  }

  private handleError(operation: string, error: Error): void {
    console.error(`UserService.${operation} failed:`, error);
    this.eventBus.emit('user:operation-failed', {
      operation,
      error: error.message
    });
  }
}
```

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) for consistent commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(plugins): add user management plugin

Add comprehensive user management plugin with CRUD operations,
role management, and integration with the event system.

Closes #123
```

```
fix(auth): handle token refresh edge case

Fix issue where token refresh would fail if multiple requests
were made simultaneously.

Fixes #456
```

```
docs(api): add examples for event system

Add comprehensive examples showing how to use the event system
for plugin communication.
```

### Pull Request Process

1. **Create a branch** from `develop`:

```bash
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name
```

2. **Make your changes** following our coding standards

3. **Test your changes**:

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
```

4. **Commit your changes** using conventional commit format

5. **Push to your fork**:

```bash
git push origin feature/your-feature-name
```

6. **Create a Pull Request** with:
   - Clear title and description
   - Link to related issues
   - Screenshots/videos for UI changes
   - Test coverage information

### Pull Request Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update

## Related Issues
Closes #[issue-number]

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Screenshots/Videos
[If applicable, add screenshots or videos demonstrating the changes]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented (particularly complex areas)
- [ ] Documentation updated
- [ ] No new warnings introduced
```

## Plugin Contribution

### Creating New Plugins

1. **Use the generator**:

```bash
npm run generate plugin YourPluginName
```

2. **Follow plugin structure**:

```typescript
// src/plugins/YourPlugin/YourPluginName.ts
export const YourPluginName: PluginInterface = {
  id: 'your-plugin-name',
  name: 'Your Plugin Name',
  version: '1.0.0',
  description: 'Description of what your plugin does',

  // Dependencies (if any)
  dependencies: ['core-auth', 'user-management'],

  // Plugin lifecycle
  async onInstall() {
    // Setup plugin resources
  },

  async onActivate() {
    // Initialize plugin
    this.registerEventListeners();
    this.initializeStores();
  },

  async onDeactivate() {
    // Cleanup resources
    this.cleanup();
  },

  // Exported functionality
  components: {
    YourComponent
  },

  services: {
    yourService
  },

  stores: {
    useYourStore
  }
};
```

3. **Include comprehensive tests**:

```typescript
// __tests__/YourPluginName.test.ts
describe('YourPluginName', () => {
  beforeEach(async () => {
    await setupPluginTest();
  });

  it('should install and activate successfully', async () => {
    await pluginManager.install('your-plugin-name', YourPluginName);
    await pluginManager.activate('your-plugin-name');

    expect(pluginManager.isActive('your-plugin-name')).toBe(true);
  });

  // Add more tests for plugin functionality
});
```

4. **Add documentation**:

```markdown
# Your Plugin Name

## Overview
Brief description of what the plugin does.

## Installation
\`\`\`bash
npm run generate plugin YourPluginName
\`\`\`

## Usage
Examples of how to use the plugin.

## API Reference
Documentation of exported components, services, and stores.

## Events
List of events emitted and consumed by the plugin.
```

### Plugin Quality Standards

All contributed plugins must meet these standards:

1. **Functionality**
   - Solves a real problem
   - Works as documented
   - Handles edge cases gracefully

2. **Code Quality**
   - Follows coding standards
   - Includes comprehensive tests (80%+ coverage)
   - Proper error handling
   - Performance optimized

3. **Documentation**
   - Clear README with examples
   - API documentation
   - Integration guide

4. **Compatibility**
   - Works with current framework version
   - Doesn't break existing functionality
   - Follows plugin architecture patterns

## Documentation Contribution

### Types of Documentation

1. **API Documentation**: Reference documentation for code
2. **Guides**: Step-by-step tutorials
3. **Examples**: Code examples and use cases
4. **Best Practices**: Recommended patterns and approaches

### Documentation Standards

1. **Clear and Concise**: Use simple language and short sentences
2. **Code Examples**: Include working code examples
3. **Screenshots**: Add visuals for UI components
4. **Up-to-date**: Ensure accuracy with current codebase

### Documentation Structure

```markdown
# Title

Brief introduction and purpose.

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)

## Section 1

Content with examples:

\`\`\`typescript
// Code example
const example = 'hello world';
\`\`\`

## Section 2

More content...

## See Also
- [Related documentation](./related.md)
```

## Bug Reports

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Try the latest version** to see if the bug is already fixed
3. **Reproduce the bug** in a minimal example

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug.

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- Framework version:
- Node.js version:
- Browser:
- OS:

## Code Example
\`\`\`typescript
// Minimal code example that reproduces the bug
\`\`\`

## Additional Context
Any other relevant information.
```

## Feature Requests

### Before Requesting

1. **Check existing feature requests** to avoid duplicates
2. **Consider if it fits** the framework's scope and goals
3. **Think about implementation** and potential challenges

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature.

## Problem Statement
What problem does this feature solve?

## Proposed Solution
How should this feature work?

## Alternative Solutions
Other approaches you've considered.

## Use Cases
Real-world scenarios where this would be useful.

## Implementation Ideas
Technical approach (if you have ideas).
```

## Code Review Process

### Review Criteria

1. **Functionality**: Does the code work as intended?
2. **Code Quality**: Is the code clean, readable, and maintainable?
3. **Tests**: Are there sufficient tests with good coverage?
4. **Performance**: Are there any performance implications?
5. **Security**: Are there any security concerns?
6. **Documentation**: Is the code and changes well documented?

### Review Guidelines

**For Reviewers:**
- Be constructive and respectful
- Explain the reasoning behind suggestions
- Focus on the code, not the person
- Approve when ready, request changes when needed

**For Authors:**
- Respond to feedback promptly
- Ask for clarification if needed
- Make requested changes or explain why you disagree
- Mark conversations as resolved when addressed

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Peer Review**: At least one maintainer reviews the code
3. **Testing**: Changes are tested in a staging environment
4. **Approval**: Maintainer approves and merges the PR

## Release Process

### Version Numbering

We follow [Semantic Versioning (SemVer)](https://semver.org/):

- **Major (X.0.0)**: Breaking changes
- **Minor (0.X.0)**: New features (backward compatible)
- **Patch (0.0.X)**: Bug fixes (backward compatible)

### Release Schedule

- **Major releases**: Every 6-12 months
- **Minor releases**: Every 4-6 weeks
- **Patch releases**: As needed for critical bugs

### Release Branches

- `main`: Stable production code
- `develop`: Integration branch for new features
- `release/X.Y.Z`: Release preparation
- `hotfix/X.Y.Z`: Critical bug fixes

### Release Process

1. **Create release branch** from `develop`
2. **Update version numbers** and changelog
3. **Final testing** and bug fixes
4. **Merge to main** and tag release
5. **Deploy to production**
6. **Merge back to develop**

## Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community discussion
- **Discord/Slack**: Real-time chat with the community
- **Email**: For private/sensitive matters

### Getting Help

If you need help:

1. **Check documentation** first
2. **Search existing issues** and discussions
3. **Ask in community channels**
4. **Create a new issue** if needed

### Recognition

We value all contributions and recognize contributors through:

- **Contributor list** in the README
- **Release notes** mention significant contributions
- **Community highlights** in our newsletter
- **Maintainer invitations** for consistent, high-quality contributors

## Development Workflow

### Typical Workflow

1. **Check for existing issues** or create a new one
2. **Discuss approach** with maintainers if it's a significant change
3. **Fork and clone** the repository
4. **Create a feature branch** from `develop`
5. **Develop and test** your changes
6. **Submit a pull request** with clear description
7. **Address review feedback**
8. **Celebrate** when it's merged! 🎉

### Tips for Success

1. **Start small**: Begin with small contributions to learn the codebase
2. **Ask questions**: Don't hesitate to ask if you're unsure about something
3. **Follow conventions**: Consistency makes everyone's life easier
4. **Test thoroughly**: Well-tested code is more likely to be accepted
5. **Document changes**: Good documentation helps users and future contributors

## Need Help?

If you have questions about contributing:

- Create an issue with the `question` label
- Join our Discord/Slack community
- Email the maintainers
- Check out our [FAQ](./faq.md)

Thank you for contributing to the AI-First SaaS React Starter! 🚀
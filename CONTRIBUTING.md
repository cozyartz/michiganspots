# Contributing to State Spots

Thank you for your interest in contributing to State Spots! We welcome contributions from the community and are excited to work with you.

**State Spots** is a geolocation discovery platform that helps users find hidden gems across America. We're building this as an open-source project under the AGPL-3.0 license with dual commercial licensing.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Contributor License Agreement](#contributor-license-agreement)
- [Community](#community)

---

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our values of respect, collaboration, and inclusivity. We are committed to providing a welcoming environment for all contributors.

**Expected Behavior**:
- Be respectful and constructive in all communications
- Welcome newcomers and help them get started
- Focus on what is best for the community and project
- Show empathy towards other community members
- Provide and gracefully accept constructive feedback

**Unacceptable Behavior**:
- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory remarks
- Public or private harassment
- Publishing others' private information without consent
- Other conduct that could reasonably be considered inappropriate

**Enforcement**: Violations may result in temporary or permanent ban from the project. Report concerns to conduct@statespots.com.

---

## 🎯 How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:
1. **Check existing issues** to see if the bug has already been reported
2. **Use the latest version** of State Spots to confirm the bug still exists
3. **Gather information** about your environment (browser, OS, device)

**Submit a bug report**:
1. Go to [Issues](https://github.com/cozyartz/statespots/issues)
2. Click "New Issue" and select "Bug Report" template
3. Provide a clear title and detailed description
4. Include steps to reproduce, expected vs. actual behavior
5. Add screenshots or error logs if helpful

### Suggesting Enhancements

We love new ideas! To suggest a feature:
1. **Check existing issues** for similar suggestions
2. Go to [Issues](https://github.com/cozyartz/statespots/issues)
3. Click "New Issue" and select "Feature Request" template
4. Describe the feature, its use case, and potential implementation
5. Explain why this would be valuable to State Spots users

### Contributing Code

We welcome code contributions! See the [Development Workflow](#development-workflow) section below.

### Improving Documentation

Documentation is crucial! You can help by:
- Fixing typos or clarifying instructions
- Adding examples and tutorials
- Improving API documentation
- Translating documentation (future)

### Community Support

Help other users by:
- Answering questions in GitHub Discussions
- Reviewing pull requests
- Testing new features and providing feedback

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **pnpm** (we use npm)
- **Git** for version control
- **GitHub account** for contributions
- **Code editor** (VS Code recommended)

### Local Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/statespots.git
   cd statespots
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/cozyartz/statespots.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your local configuration
   ```

6. **Run development server**:
   ```bash
   npm run dev
   ```

7. **Open http://localhost:4321** in your browser

### Project Structure

```
statespots/
├── src/
│   ├── components/     # React/Astro components
│   ├── pages/          # File-based routing
│   ├── layouts/        # Page layouts
│   ├── lib/            # Utility functions and services
│   ├── content/        # MDX content (blog, legal)
│   └── styles/         # Global styles
├── public/             # Static assets
├── database/           # SQL schema and migrations
├── functions/          # Cloudflare Workers API endpoints
├── legal/              # Legal agreements and templates
└── docs/               # Documentation

```

---

## 💻 Development Workflow

### 1. Create a Branch

Always create a new branch for your work:
```bash
git checkout -b feature/your-feature-name
# OR
git checkout -b fix/bug-description
```

**Branch naming conventions**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow the [Coding Standards](#coding-standards)
- Add tests for new features
- Update documentation as needed
- Keep commits focused and atomic

### 3. Test Your Changes

```bash
# Run development server
npm run dev

# Build for production (tests TypeScript compilation)
npm run build

# Run tests (when we add them)
npm test
```

### 4. Commit Your Changes

Write clear, descriptive commit messages:
```bash
git add .
git commit -m "feat: add semantic search for businesses

- Implement Cloudflare Vectorize integration
- Add embeddings generation for business descriptions
- Create semantic search API endpoint
- Update business profile pages with search

Closes #123"
```

**Commit message format**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style/formatting
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Open a Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill out the PR template completely
4. Link related issues (e.g., "Closes #123")
5. Request review from maintainers
6. Address feedback and update PR as needed

---

## 🔄 Pull Request Process

### Before Submitting

- ✅ Code follows our [Coding Standards](#coding-standards)
- ✅ All tests pass (once we have a test suite)
- ✅ TypeScript compiles without errors (`npm run build`)
- ✅ Documentation is updated if needed
- ✅ Commit messages are clear and descriptive
- ✅ You have signed the [CLA](#contributor-license-agreement)

### PR Review Process

1. **Automated Checks**: Our CI/CD pipeline will run:
   - TypeScript type checking
   - Build verification
   - (Future: Linting, tests, security scans)

2. **Code Review**: A maintainer will review your PR and may:
   - Request changes
   - Ask questions for clarification
   - Approve the PR

3. **Approval**: Once approved, a maintainer will merge your PR

### After Your PR is Merged

- Your changes will be included in the next release
- You'll be credited in the CONTRIBUTORS file
- Close any related issues
- Celebrate! 🎉 You've contributed to State Spots!

---

## 📏 Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Enable strict mode in tsconfig.json
- Use meaningful variable and function names
- Prefer `const` over `let`; avoid `var`
- Use async/await instead of .then() chains
- Add JSDoc comments for complex functions

**Example**:
```typescript
/**
 * Generates embeddings for business descriptions using Cloudflare AI
 * @param description - The business description text
 * @returns 768-dimension embedding vector
 */
async function generateEmbedding(description: string): Promise<number[]> {
  // Implementation
}
```

### React/Astro Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript interfaces for props
- Follow Astro's component patterns

**Example**:
```tsx
interface BusinessCardProps {
  name: string;
  description: string;
  category: string;
}

export function BusinessCard({ name, description, category }: BusinessCardProps) {
  return (
    <div className="business-card">
      {/* Component JSX */}
    </div>
  );
}
```

### Styling

- Use **Tailwind CSS** utility classes
- Follow existing design system (colors, spacing)
- Keep custom CSS minimal
- Responsive design (mobile-first)
- Dark mode support where applicable

### File Naming

- Components: `PascalCase.tsx` (e.g., `BusinessCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Pages: `kebab-case.astro` (e.g., `business-directory.astro`)
- Types: `PascalCase.ts` or `types.ts`

### Import Order

1. External dependencies (React, Astro, etc.)
2. Internal utilities and types
3. Components
4. Styles

```typescript
import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { BusinessCard } from '@/components/BusinessCard';
import './styles.css';
```

---

## 📜 Contributor License Agreement

**IMPORTANT**: All contributors must agree to our [Contributor License Agreement (CLA)](./legal/CLA.md) before we can merge your pull request.

### Why We Require a CLA

The CLA:
- Ensures you have the right to contribute the code
- Grants State Spots the necessary rights to use your contribution
- Protects you, the project, and all users from legal issues
- Allows us to offer dual licensing (AGPL-3.0 + Commercial)

### How to Sign the CLA

**Automatic (Recommended)**:
When you submit your first pull request, our CLA bot will comment asking you to sign. Simply reply with:
```
I have read the CLA and I hereby sign the CLA
```

**Manual**:
Download, sign, and email the [CLA](./legal/CLA.md) to contributors@statespots.com

**One-Time Only**: You only need to sign the CLA once. All future contributions are covered.

---

## 👥 Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions, ideas, and community chat
- **Email**: hello@statespots.com (general inquiries)
- **Discord**: [Coming soon] - Real-time chat with the community

### Getting Help

**Stuck?** Here's how to get help:
1. Check the [documentation](./docs/)
2. Search [existing issues](https://github.com/cozyartz/statespots/issues)
3. Ask in [GitHub Discussions](https://github.com/cozyartz/statespots/discussions)
4. Email contributors@statespots.com

### Recognition

Contributors are recognized in:
- CONTRIBUTORS file (automatically generated)
- Release notes
- Project README
- (Future) Hall of Fame on website

---

## 📦 Release Process

State Spots follows semantic versioning (semver):
- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features (backward compatible)
- **Patch** (1.1.1): Bug fixes

Releases are managed by project maintainers. Your contributions may be included in the next scheduled release.

---

## 🙏 Thank You!

Thank you for taking the time to contribute to State Spots. Every contribution, no matter how small, makes a difference.

**Happy coding!** 🚀

---

**© 2025 Cozyartz Media Group d/b/a State Spots**

For questions about contributing, contact: contributors@statespots.com

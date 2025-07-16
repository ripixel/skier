# Contributing

Thank you for your interest in contributing to Skier! We welcome issues, pull requests, and suggestions from the community.

---

## Code of Conduct
Please be respectful and constructive in all interactions.

---

## How to Contribute
- **Report bugs**: Open a GitHub issue with steps to reproduce and environment details.
- **Suggest features**: Open a GitHub issue and describe your use case.
- **Submit pull requests**: See below for PR guidelines.

---

## Development Setup
1. Fork the repository and clone your fork.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Use the Node.js version in `.nvmrc`.
4. Run tests:
   ```sh
   npm test
   ```
5. Run Prettier to check formatting:
   ```sh
   npm run format
   ```

---

## Code Style
- Use Prettier for code formatting (`npm run format`).
- Write clear, descriptive commit messages.
- Require TypeScript for new code.
- Keep functions and modules focused and minimal.

---

## Pull Request Process
- Fork and create a feature branch.
- Write or update tests for your changes.
- Run tests and ensure they pass.
- Open a pull request with a clear description of your changes and why they’re needed.
- Reference related issues if applicable.
- The CI must pass (lint, test, build) before merge.

---

## Issue Reporting
- Search for existing issues before opening a new one.
- Include steps to reproduce, expected vs. actual behavior, and environment info.

---

## Maintainers
- Review PRs for code style, clarity, and test coverage.
- Provide feedback and request changes as needed.
- Merge only after CI passes and at least one approval.

---

Thank you for helping make Skier better!

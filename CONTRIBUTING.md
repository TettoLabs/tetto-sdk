# Contributing to Tetto SDK

Thank you for your interest in contributing to Tetto SDK! 🎉

---

## How to Contribute

### Reporting Bugs

**Before submitting:**
1. Check [existing issues](https://github.com/TettoLabs/tetto-sdk/issues)
2. Search [Discord](https://discord.gg/tetto) for similar problems
3. Try with latest version: `npm install tetto-sdk@latest`

**When creating issue:**
- Use bug report template
- Include SDK version, Node version, OS
- Provide minimal reproduction code
- Include error messages and stack traces

### Suggesting Features

**Feature requests welcome!**

Include:
- Use case / problem it solves
- Proposed API design
- Example code showing usage
- Impact on existing functionality

### Pull Requests

**Process:**
1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes
4. Add tests
5. Run tests: `npm test`
6. Commit: `git commit -m "feat: add awesome feature"`
7. Push: `git push origin feature/my-feature`
8. Create Pull Request

**Requirements:**
- ✅ All tests pass
- ✅ No TypeScript errors
- ✅ Code follows style guide
- ✅ Documentation updated
- ✅ Commits follow [Conventional Commits](https://www.conventionalcommits.org/)

---

## Development Setup

```bash
# Clone repository
git clone https://github.com/TettoLabs/tetto-sdk.git
cd tetto-sdk

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

---

## Code Style

**We use:**
- TypeScript strict mode
- 2 spaces indentation
- Single quotes
- Semicolons required

**Run linter:**
```bash
npm run lint
```

---

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `chore`: Maintenance

**Examples:**
```
feat(agent): add verifyReceipt helper
fix(wallet): handle disconnection gracefully
docs(readme): update installation instructions
test(integration): add devnet test
```

---

## Testing

**Run all tests:**
```bash
npm test
```

**Run specific tests:**
```bash
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
```

**Write tests for:**
- All new features
- All bug fixes
- Edge cases

---

## Documentation

**Update docs for:**
- New features (API reference + guides)
- Breaking changes (migration guide)
- New examples (add to examples/)

**Documentation lives in:**
- `README.md` - Overview
- `docs/` - Detailed guides
- `examples/` - Code examples

---

## Release Process

**Maintainers only:**

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v0.x.x`
4. Push tag: `git push --tags`
5. Publish to npm: `npm publish`
6. Create GitHub release

---

## Questions?

- 💬 [Discord](https://discord.gg/tetto)
- 📧 [Email](mailto:hello@tetto.io)
- 🐛 [GitHub Issues](https://github.com/TettoLabs/tetto-sdk/issues)

---

**Thank you for contributing!** 🚀

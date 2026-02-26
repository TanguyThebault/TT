# CLAUDE.md

This file provides guidance for AI assistants (Claude and others) working in this repository.

## Repository Status

This repository is currently **empty** — no source code, dependencies, or configuration files have been committed yet. This CLAUDE.md serves as a foundational document to be updated as the project evolves.

When the project is initialized, update this file with:
- The actual tech stack and framework versions
- Project-specific build and test commands
- Coding conventions and style guides
- Architecture overview

---

## Git Workflow

### Branch Naming

- Feature branches: `feature/<short-description>`
- Bug fixes: `fix/<short-description>`
- AI-assisted work: `claude/<task-id>`
- Never commit directly to `main` or `master` without a pull request

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short summary>

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(auth): add JWT token refresh logic
fix(api): handle null response from user endpoint
docs: update CLAUDE.md with build instructions
```

### Push Rules

- Always push to the correct feature branch: `git push -u origin <branch-name>`
- Never force-push to `main`/`master`
- Ensure CI passes before merging

---

## Development Principles

### Code Quality

- Prefer clarity over cleverness — code is read more than it is written
- Keep functions small and focused on a single responsibility
- Avoid premature abstraction; three similar lines of code is better than a premature helper
- Do not add docstrings, comments, or type annotations to code that was not changed
- Only add comments where the logic is not self-evident

### Error Handling

- Validate only at system boundaries (user input, external APIs, file I/O)
- Do not add defensive checks for internal invariants that the language or framework already guarantees
- Prefer failing fast with a clear error over silently continuing in a bad state

### Security

- Never commit secrets, credentials, API keys, or `.env` files
- Sanitize all user input before use in queries, shell commands, or HTML output
- Follow OWASP Top 10 guidance; avoid SQL injection, XSS, command injection
- Keep dependencies up to date; remove unused packages

### Testing

- Write tests alongside new features, not after
- Tests should be fast, isolated, and deterministic
- Prefer unit tests for business logic; integration tests for system boundaries
- Do not mock what you do not own (prefer testing with real implementations where practical)

---

## AI Assistant Instructions

### When Analyzing This Repo

1. Read this file first, then explore directory structure before making changes
2. Prefer editing existing files over creating new ones
3. Do not introduce new dependencies without explicit user approval
4. Do not refactor or "improve" code beyond the scope of the current task

### When Making Changes

1. Understand the existing code before modifying it
2. Match the style and conventions already present in the file being edited
3. Keep changes minimal and focused on the requested task
4. Run tests (when available) before committing
5. Commit with a descriptive message following Conventional Commits

### Forbidden Actions

- Never push to `main`/`master` directly
- Never skip pre-commit hooks (`--no-verify`) without explicit user instruction
- Never delete files or branches without user confirmation
- Never commit `.env` or secret files

---

## Project Setup (To Be Filled In)

Once the project is initialized, document the following here:

```bash
# Install dependencies
<command>

# Start development server
<command>

# Run tests
<command>

# Run linter / formatter
<command>

# Build for production
<command>
```

---

## Architecture (To Be Filled In)

Describe the high-level architecture here once the project is initialized:

- **Entry points**: e.g., `src/main.ts`, `cmd/server/main.go`
- **Key modules**: list the main packages/modules and their responsibilities
- **Data flow**: describe how data moves through the system
- **External dependencies**: databases, queues, third-party APIs

---

*Last updated: 2026-02-26 — repository is empty; update this file when the project is initialized.*

# CLAUDE.md

This file provides guidance for AI assistants (Claude and others) working in this repository.

## Repository Status

This repository contains **survival-expedition-resources**, a browser-based survival/expedition resource management game built with React, TypeScript, and Vite.

**Tech stack:**
- React 18 + TypeScript 5
- Vite 5 (dev server on port 8080)
- Tailwind CSS 3 + shadcn/ui (Radix UI primitives)
- TanStack Query v5
- React Router v6
- Supabase JS v2
- Zod, React Hook Form

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

## Project Setup

All commands run from `survival-expedition-resources/`:

```bash
# Install dependencies
npm install

# Start development server (http://localhost:8080)
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

No test runner is configured yet.

---

## Architecture

**Project root:** `survival-expedition-resources/`

- **Entry point:** `src/main.tsx` → `src/App.tsx`
- **Routing:** React Router v6; two routes — `/` (`pages/Index.tsx`) and `*` (`pages/NotFound.tsx`)
- **Path alias:** `@/` maps to `src/`

**Directory structure:**

```
src/
  components/
    game/         # Game UI panels (Inventory, Crafting, Expedition, Survivors, etc.)
    ui/           # shadcn/ui component library
    AppLayout.tsx
    theme-provider.tsx
  contexts/       # React context providers
  data/           # Static game data
  hooks/          # Custom React hooks
  lib/            # Utility helpers
  pages/          # Route-level page components
```

**Key game components:** `ResourceBar`, `InventoryPanel`, `CraftingPanel`, `SurvivorRoster`, `SurvivorCard`, `ExpeditionLauncher`, `ActiveExpeditions`, `ExpeditionResults`, `ExpeditionTimer`, `BaseBuildings`, `GameLog`, `QuickStats`, `Header`, `TabNavigation`

**External dependencies:** Supabase (backend/auth), TanStack Query (server state)

---

*Last updated: 2026-02-26 — survival-expedition-resources React/TS/Vite app initialized.*

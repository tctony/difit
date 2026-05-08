# Repository Guidelines

## Project Structure & Module Organization

The TypeScript sources live under `src`, split by runtime: `src/cli` handles command parsing and Git integration, `src/server` hosts the Express diff service, `src/client` renders the React web UI, `src/tui` covers the Ink terminal UI, and shared helpers sit in `src/utils` and `src/types`. Unit and integration tests live next to the code they cover as `*.test.ts` or `*.test.tsx`, and fixtures under `docs/` support screenshots and copy decks. Built artifacts land in `dist/` after `pnpm build`; do not edit them manually. Static assets for the UI reside in `public/`, while automation scripts live in `scripts/`.

## Build, Test, and Development Commands

- `pnpm install` — install workspace dependencies (Node ≥21; use `mise` to stay aligned).
- `pnpm dev` — run the local development loop (boots the CLI server and UI with hot reload).
- `pnpm build` — generate the CLI bundle and production web assets via TypeScript project references and Vite.
- `pnpm test` / `pnpm test:watch` — execute the Vitest suite once or in watch mode.
- `pnpm check`, `pnpm check:fix`, and `pnpm format` — apply oxlint type-aware checks and oxfmt formatting before you commit.

## Coding Style & Naming Conventions

The codebase uses strict TypeScript (`tsconfig.strictest`) and 2-space indentation; avoid `any` and prefer explicit types. Import types with `import type` and keep module order consistent; oxlint enforces unused imports/variables and type-aware safety rules. React components live under `src/client` or `src/tui`; use PascalCase filenames for components, kebab-case for utilities, and co-locate UI-specific helpers when practical. Run `pnpm format` before submitting to apply oxfmt formatting.

## Testing Guidelines

Vitest with the `happy-dom` environment drives unit and integration coverage, and React work should lean on Testing Library helpers. Place new tests alongside the implementation using the `name.test.ts[x]` pattern and prefer descriptive `describe` blocks tied to features. Ensure asynchronous flows await their assertions and cover both CLI (`src/cli`) and server (`src/server`) branches when they change; use `pnpm test --runInBand` if watchers behave flakily in CI.

## Commit & Pull Request Guidelines

Git history mixes lightweight descriptions with Conventional Commit prefixes—follow the pattern where it clarifies intent: `fix: guard empty diff (#123)` or `feat(cli): add --port flag`. Keep commits focused, include context in the body, and reference issues with `#id` when relevant. Before opening a PR, ensure `pnpm check`, `pnpm test`, and `pnpm build` succeed locally; lefthook re-runs them on commit and push. PRs should outline motivation, implementation notes, manual verification steps, and UI changes (attach refreshed `docs/images` assets or screenshots for web/TUI updates).

## Tooling & Environment

Use `pnpm` for dependency management (avoid mixing with `npm` or `yarn`) and rely on the `mise.toml` pinned versions for local reproducibility. When performance is a concern, run `pnpm perf:*` scripts to benchmark diff rendering before merging significant parser or rendering changes.

## Release Workflow (fork: `@tctony/difit`)

This fork is published to npm as [`@tctony/difit`](https://www.npmjs.com/package/@tctony/difit). Releases are fully automated by `.github/workflows/publish.yml`, which is triggered by pushing a `v*` git tag (and authenticated via npm Trusted Publishing once configured — no token needed).

Versioning rules:

- Stable releases use plain SemVer like `4.0.6` and publish to the `latest` npm dist-tag.
- Pre-release / fork-specific iterations use the `-fork.<n>` suffix (e.g. `4.0.6-fork.1`) and publish to the `next` dist-tag automatically. Other recognized prerelease suffixes: `-alpha.<n>`, `-beta.<n>`, `-rc.<n>`, `-next.<n>`.
- The CHANGELOG keeps a `## Fork` section that lists every fork release; upstream history sits below `## Upstream` for reference.

When the user asks an agent to release this fork, follow the steps below in order. Stop and ask only the questions the user has not already answered.

1. **Confirm the work to release.** Run `git status`, `git log --oneline ORIGIN/develop..HEAD` (or the active fork branch), and skim the unreleased commits. Surface a short summary so the user can sanity-check the scope.
2. **Bump the version number.** A release always changes the version (npm rejects duplicates), so the only decision is the bump level — never ask for or accept an explicit version string.
   - Read the current version from `package.json` (`node -p "require('./package.json').version"`).
   - If the user already said `patch` / `minor` / `major`, use it. Otherwise ask which of the three to bump (default: `patch`).
   - Compute the next version with semver rules. When the current version carries a `-fork.<n>` suffix:
     - `patch` → increment the `<n>` counter while keeping the same `MAJOR.MINOR.PATCH` (e.g. `4.0.5-fork.0` → `4.0.5-fork.1`).
     - `minor` / `major` → bump the corresponding base segment, reset the lower ones to zero, and start a fresh `-fork.0` (e.g. `4.0.5-fork.3` + `minor` → `4.1.0-fork.0`).
   - When the current version is a plain stable release, fall back to standard semver: `4.0.5` + `patch` → `4.0.6`, etc. Stable bumps stay stable.
3. **Update files in this exact order.**
   1. Edit `package.json` `version` to the resolved value.
   2. Edit `CHANGELOG.md`: under `## Fork`, insert a new `### [<version>]` block above the previous one summarising the changes since the last fork release (group by Added / Changed / Fixed when it helps). The section content is the source of truth for the release notes — keep it concise.
   3. Run `pnpm run check` and `pnpm test` to confirm nothing is broken.
4. **Commit and tag.** Stage exactly the two changed files, commit as `chore(release): v<version>`, then tag the commit with `v<version>` (note the leading `v`).
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore(release): v<version>"
   git tag v<version>
   ```
5. **Confirm with the user before pushing** (always — pushing a tag triggers a real npm publish that cannot be undone). Show the planned `git push` commands and the npm dist-tag the workflow will choose. Only push after the user confirms.
6. **Push branch + tag.**
   ```bash
   git push origin HEAD
   git push origin v<version>
   ```
7. **Watch the workflow** finish on GitHub Actions. After it succeeds, verify the package page (`https://www.npmjs.com/package/@tctony/difit`) shows the new version with the right dist-tag.
8. **(Optional) Cut a GitHub Release** from the tag, copying the new CHANGELOG section as the body. Mark it as a pre-release when the version contains a `-fork.<n>` (or other prerelease) suffix.

Hard rules for the agent:

- Never run `npm publish` directly from a developer machine for a fork release; always go through the tag → workflow path so the build and provenance signing are reproducible.
- Never push a tag whose version does not match `package.json` — the workflow has a guard that will fail, but catching it locally is faster.
- Never bump or release while the working tree is dirty or `pnpm test` / `pnpm check` are red.
- If Trusted Publishing has not been configured yet, the workflow falls back to `secrets.NPM_TOKEN`. The very first publish of a brand-new package was performed manually with `npm login` — subsequent releases must use the workflow.

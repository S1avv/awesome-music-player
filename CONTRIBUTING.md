# Contributing to Awesome Music Player

We welcome contributions from internal team members and approved external partners. To maintain code quality, stability, and a clean Git history, please adhere to the following guidelines.

## 1. Branching Strategy
We use a streamlined version of **Git Flow**:
- `main` - The production-ready branch. Code here is stable and tagged with release versions.
- `dev` - The active development branch. All feature branches branch off from here.
- `feature/<name>` - New features or significant architectural changes.
- `bugfix/<name>` - Resolutions for known bugs.
- `hotfix/<name>` - Critical emergency fixes branched directly from `main`.

## 2. Commit Standards
We strictly follow **Conventional Commits** to automate changelog generation.
Format: `<type>(<scope>): <subject>`

**Examples:**
- `feat(audio): implement blob fallback for unsafe paths`
- `fix(ui): correct z-index overlap in search dropdown`
- `refactor(library): optimize rust metadata extraction`
- `chore(deps): update tauri dependencies`

## 3. Pull Request Process
1. Ensure your code is synchronized with the latest `dev` branch.
2. Run all linters and tests locally (`npm run lint`, `cargo clippy`).
3. Create a Pull Request against the `dev` branch.
4. Fill out the PR template thoroughly, detailing *why* the change was made and *how* it was tested.
5. A minimum of one code review approval from a senior maintainer is required before merging.

## 4. Code Quality
- **Do not introduce regressions -** Test your features specifically edge cases (e.g., missing metadata, extremely large files, unencoded paths).
- Keep PRs scoped to a single feature or bug fix. Massive, sprawling PRs will be rejected for splitting.

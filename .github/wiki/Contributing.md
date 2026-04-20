# Contributing

**Status:** Active. The repo is in active development. Breaking changes may occur until v0.5.

By the end of this guide you will:

- Know how to set up your local dev environment for nTV.
- Know which tickets are open and where to start.

## Prerequisites

- **Flutter 3.24+** — install: [flutter.dev/install](https://docs.flutter.dev/get-started/install)
- **Dart 3.5+** — installed with Flutter.
- **Git** — for forking + branching.
- **nSelf CLI** — for the media backend.
- **A running nSelf backend** with the nTV bundle (per [[Backend-Setup]]) — required to test most features.

## Steps

### Step 1 — Fork and clone

```bash
git clone https://github.com/<your-username>/ntv.git
cd ntv
flutter pub get
```

### Step 2 — Add platform scaffolds

Run `flutter create .` to add platform directories if they are not present in your checkout:

```bash
flutter create .
```

Check whether the platform directories (`ios/`, `android/`, `macos/`, `linux/`, `windows/`, `web/`) already exist before running this. If they do, skip this step.

### Step 3 — Pick a ticket

Open issues live at [github.com/nself-org/ntv/issues](https://github.com/nself-org/ntv/issues). Look for `good first issue` and `help wanted` labels (planned label scheme).

The current MVP plan (Phase 1) lives in `.claude/tasks/active.md` (gitignored — read it locally after cloning).

### Step 4 — Develop

Branch convention:

```bash
git checkout -b feat/<short-description>
```

For bug fixes:

```bash
git checkout -b fix/<short-description>
```

### Step 5 — Verify

Before opening a PR:

```bash
flutter analyze         # must pass clean
flutter test            # smoke tests (when the suite lands)
dart format lib         # formatting
```

### Step 6 — Open a pull request

PR title and commit messages follow **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, etc. (e.g. `feat: add HLS multi-audio track support`).

Include in the PR body:

- What changed and why
- Linked issue (if applicable)
- Screenshots for UI changes
- Test coverage notes

## Verification

`flutter analyze` and `flutter test` pass on your branch. CI (planned) confirms the same.

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature or platform support
- `fix:` — bug fix
- `chore:` — maintenance, dependencies
- `docs:` — documentation only
- `test:` — tests only
- `refactor:` — no behaviour change

Breaking API changes: add `!` after type (`feat!:`) and document in the PR body.

## Branching Model

| Branch | Purpose |
|---|---|
| `main` | Latest stable |
| `feat/xxx` | New features |
| `fix/xxx` | Bug fixes |
| `chore/xxx` | Maintenance |
| `docs/xxx` | Documentation only |
| `platform/xxx` | Platform-specific scaffolding work |

## Code of Conduct

nTV follows the broader nSelf community standards. Be kind. Assume good intent. Disagreements are resolved on merit.

## Troubleshooting

### "Cannot run app — no platform scaffolds"

**Symptom:** `flutter run` fails with no target devices or builds.
**Cause:** Platform directories don't exist yet (see Step 2).
**Fix:** Run `flutter create .` locally.

### "Backend connection refused"

**Symptom:** App launches but Library is empty / errors.
**Cause:** No nSelf backend running, or wrong URL.
**Fix:** See [[Backend-Setup]].

## Communication Channels

- **GitHub Issues:** [github.com/nself-org/ntv/issues](https://github.com/nself-org/ntv/issues)
- **GitHub Discussions:** [github.com/nself-org/ntv/discussions](https://github.com/nself-org/ntv/discussions)
- **nself.org** for project-wide announcements

## Security Disclosures

Do not open a public issue for security vulnerabilities. Follow the process in [SECURITY.md](https://github.com/nself-org/ntv/blob/main/.github/SECURITY.md).

## Translations / Internationalisation

nTV internationalisation strategy is under review. Translation contributions are deferred until the strategy is documented. Watch [Discussions](https://github.com/nself-org/ntv/discussions) for updates.

## Code of Conduct

nTV follows the nSelf community standards. See [Code of Conduct](Code-of-Conduct.md) and [ENFORCEMENT.md](https://github.com/nself-org/ntv/blob/main/.github/ENFORCEMENT.md) for the full enforcement process.

## Governance

nTV follows the nSelf [BDFL governance model](https://github.com/nself-org/ntv/blob/main/.github/GOVERNANCE.md). The CODEOWNERS file defines who reviews pull requests. See [CODEOWNERS](https://github.com/nself-org/ntv/blob/main/.github/CODEOWNERS).

## Next Steps

- [[Getting-Started]] — set up the dev loop end-to-end
- [[Architecture]] — understand the design before contributing
- [[Backend-Setup]] — get a backend running
- [GOVERNANCE.md](https://github.com/nself-org/ntv/blob/main/.github/GOVERNANCE.md) — decision model

← [[Home]] | [[_Sidebar]]

# Changelog

All notable changes to `@fireact.dev/app` are documented here.

## 1.1.0

- Fixed: `package.json` declared `"files": ["dist", "src"]`, but `src/components`, `src/contexts`, `src/hooks`, `src/layouts`, `src/utils`, and `src/types.ts` are symlinks into the sibling reference app, which npm's packer silently excludes from the published tarball. The published `src/` was already incomplete (verified against the live 1.0.9 tarball). `files` now only declares `"dist"`, which is what every consumer has always actually used (`main`, `module`, and `types` all resolve there, and `dist/index.d.ts` already contains the full type definitions). No functional change for consumers, no API changes.

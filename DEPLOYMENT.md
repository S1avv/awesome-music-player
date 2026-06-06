# Deployment & Release Engineering

This document details the build processes and CI/CD pipelines required to deploy Awesome Music Player.

## 1. Local Production Build
To create an optimized release build on your local machine:

```bash
npm run tauri build
```

The resulting binaries and installers will be located in:
`src-tauri/target/release/bundle/`

## 2. Supported Targets
Awesome Music Player utilizes Tauri, allowing it to be compiled cross-platform. However, builds must currently be executed on their respective OS hosts unless utilizing cross-compilation toolchains.
- **Windows -** Generates `.msi` and `.exe` installers.
- **macOS -** Generates `.app`, `.dmg`, and `.pkg` bundles.
- **Linux -** Generates `.deb` and `.AppImage`.

## 3. CI/CD Pipeline Integration
For enterprise automation, Awesome Music Player is configured to be built via GitHub Actions using the official `tauri-apps/tauri-action`.

### Release Workflow Requirements
1. The version in `package.json` and `src-tauri/tauri.conf.json` must be identical.
2. A Git tag (e.g., `v0.1.0`) pushed to `main` will trigger the build matrix.
3. Code signing certificates (Apple Developer ID for macOS, Authenticode for Windows) must be loaded into GitHub Secrets to prevent OS-level warnings (SmartScreen / Gatekeeper) for end users.

## 4. Updates & Distribution
Awesome Music Player currently relies on manual installer distribution. Future phases will integrate Tauri's built-in Updater feature to push OTA (Over-The-Air) updates using an enterprise S3 bucket for binary hosting.

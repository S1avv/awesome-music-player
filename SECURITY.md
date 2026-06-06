# Security Policy

Awesome Music Player takes the security of our users' local file systems and system integrity seriously.

## 100% Local and Offline
**Awesome Music Player is a fully local application.** It does not, under any circumstances, send telemetry, music files, metadata, or any other user data outside of your computer. All processing, including metadata extraction and library scanning, happens strictly locally on your machine.

## Reporting a Vulnerability
If you discover a security vulnerability within Awesome Music Player (e.g., directory traversal vulnerabilities, XSS in ID3 tags, or privilege escalation), **do not open a public issue.**

Please report it privately to the maintainers via email or a secure internal communication channel. A maintainer will acknowledge receipt of your vulnerability report within 48 hours and provide an estimated timeline for the fix.

## Technical Security Boundaries
- **Strict Content Security Policy (CSP) -** Evaluated strictly via `tauri.conf.json`. External script execution is blocked. `blob:` and `data:` URIs are restricted strictly to media (`media-src`) and image (`img-src`) directives.
- **FS Isolation -** The `@tauri-apps/plugin-fs` is scoped rigorously using Tauri V2 capabilities. The backend refuses to read arbitrary system files outside of user-defined music library directories.
- **Metadata Sanitization -** ID3 tags parsed by `lofty` are treated as untrusted user input and escaped before being injected into the DOM by React.

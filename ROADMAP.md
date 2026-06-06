# Awesome Music Player Product Roadmap

This document provides a high-level overview of the strategic direction and upcoming milestones for Awesome Music Player.

## Phase 1: Foundation & Core Experience (✅ Completed)
- [x] Tauri + React project initialization.
- [x] Basic UI layout with sidebar, header, and media controls.
- [x] Local filesystem scanning and Rust-based ID3 metadata extraction.
- [x] Standard audio playback functionality.

## Phase 2: Resilience & UX Polish (✅ Completed)
- [x] Implementation of the Blob URL Audio Pipeline (CSP bypass for unsafe characters).
- [x] Playback state persistence (Queue, Volume, Timeline hydration).
- [x] Categorized global search (Tracks, Artists, Playlists).
- [x] Context menus, drag-and-drop navigation, and i18n localization.

## Phase 3: Advanced Audio Features (🚧 In Progress)
- [ ] **Audio Equalizer (EQ) -** Integration of a Web Audio API 10-band equalizer.
- [ ] **Gapless Playback -** Pre-buffering subsequent tracks for seamless transitions in albums.
- [ ] **Lyrics Support -** Parsing embedded `.lrc` files and displaying synchronized lyrics.
- [ ] **Performance Optimizations -** Virtualized lists for rendering libraries with 50,000+ tracks without DOM lag.

## Phase 4: Integrations & Cloud (Planned)
- [ ] **Last.fm Scrobbling -** Official integration to track user listening habits.
- [ ] **Remote Control Protocol -** Allowing mobile devices on the same local network to control desktop playback.
- [ ] **Cross-Device Sync -** Optional secure syncing of playlists, play counts, and settings via a lightweight proprietary cloud backend.
# Development Onboarding & Setup

Welcome to the Awesome Music Player development team. This guide outlines the process to set up your local development environment and run the project safely.

## 1. Prerequisites
Ensure you have the following toolchains installed globally:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Rust** (Latest stable toolchain via `rustup`)
- **C++ Build Tools** (Visual Studio Build Tools for Windows / Xcode Command Line Tools for macOS)

## 2. Environment Setup
Clone the repository and install the frontend dependencies:
```bash
git clone https://github.com/S1avv/awesome-music-player.git
cd awesome-music-player
npm install
```

## 3. Running the Development Server
Awesome Music Player utilizes Vite for the frontend and Cargo for the backend. To spin up both simultaneously with Hot Module Replacement (HMR):
```bash
npm run tauri dev
```
*Note: The first compilation of the Rust core will take several minutes. Subsequent builds will be incremental and much faster.*

## 4. Project Structure
```text
awesome-music-player/
├── src/                # React Frontend Core
│   ├── components/     # Reusable, atomic UI components
│   ├── contexts/       # Global State (Audio, Library, Theme)
│   ├── pages/          # View-level components (Home, Playlist, etc.)
│   ├── i18n/           # Localization dictionaries
│   └── index.css       # Global Tailwind CSS entry
├── src-tauri/          # Rust Backend Core
│   ├── src/            
│   │   ├── commands/   # IPC exposed functions (library scan, file ops)
│   │   └── main.rs     # Application entry & configuration
│   ├── capabilities/   # Tauri V2 security boundaries
│   └── tauri.conf.json # Build configuration and CSP
```
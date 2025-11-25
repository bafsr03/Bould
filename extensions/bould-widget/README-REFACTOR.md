# Bould Widget - Modular Architecture

This widget has been refactored into a clean, modular architecture for better maintainability and readability.

## 📁 Project Structure

```
extensions/bould-widget/
├── src/
│   ├── main.js              # Entry point - orchestrates all modules
│   ├── constants.js         # Configuration constants
│   ├── utils.js             # Utility functions
│   ├── ui/
│   │   ├── header.js        # Header management
│   │   ├── intro.js         # Intro animation manager
│   │   ├── image-viewer.js  # Image viewer component
│   │   ├── loading.js       # Loading feedback manager
│   │   ├── result.js        # Result display manager
│   │   └── notice.js        # Notice/error UI manager
│   └── services/
│       ├── api.js           # API service for backend calls
│       └── storage.js       # LocalStorage service
├── assets/
│   ├── widget.js            # Built output (auto-generated)
│   ├── widget.js.backup     # Original monolithic file
│   └── widget.css           # Styles
├── vite.config.js           # Build configuration
└── package.json             # Dependencies & scripts
```

## 🔧 Development

### Build Commands

```bash
# One-time build
npm run build

# Watch mode (rebuilds on file changes)
npm run dev
```

### Module Overview

#### **UI Modules** (`src/ui/`)
- **header.js** - Manages header state and ARIA labels
- **intro.js** - Handles intro screen animations with ResizeObserver
- **image-viewer.js** - Full-screen image preview with keyboard support
- **loading.js** - Loading feedback cycle with fade animations
- **result.js** - Result screen reveal with staged animations
- **notice.js** - Inline notices, plan state, and debug info

#### **Services** (`src/services/`)
- **api.js** - Backend communication, status checks, gate logic
- **storage.js** - LocalStorage for saving/loading user results

#### **Core** (`src/`)
- **main.js** - Entry point that wires everything together
- **constants.js** - All configuration constants in one place
- **utils.js** - Pure utility functions (no side effects)

## 🎯 Key Improvements

1. **Modularity** - Each file has a single, clear responsibility
2. **Readability** - Code is organized by feature, not by function
3. **Maintainability** - Easy to find and modify specific functionality
4. **Testability** - Modules can be tested in isolation
5. **Build Process** - Vite bundles everything into a single optimized file

## 🚀 Deployment

The built `assets/widget.js` file is what gets deployed to Shopify. The source files in `src/` are for development only.

## 📝 Making Changes

1. Edit files in `src/`
2. Run `npm run build` or `npm run dev`
3. Test the widget
4. The built file in `assets/widget.js` is ready for deployment

## 🔄 Rollback

If you need to revert to the original monolithic version:
```bash
cp assets/widget.js.backup assets/widget.js
```

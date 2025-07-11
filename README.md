# Image Viewer with Metadata

A modern web-based image viewer built with Next.js that allows you to browse and view images with detailed metadata display. The application supports various image formats and displays EXIF data, file information, and other metadata in an easy-to-read format.

## Features

- 📁 **Advanced Directory Browsing**: Hierarchical file explorer with expandable folders
- 🖼️ **Multi-Format Support**: JPEG, PNG, GIF, WebP, HEIC, BMP and more
- 🎥 **Video Support**: MP4, MPEG, WAV, MOV, AVI, WebM with built-in controls
- 📊 **Rich Metadata Display**: Detailed EXIF data and file information
- 🎬 **Slideshow Mode**: Automatic slideshow across all folders with customizable timing
- 🔍 **Full-Screen Viewing**: Immersive full-page image viewing experience
- � **Mobile Optimized**: Responsive design with touch support and mobile fullscreen
- 🎯 **Smart Navigation**: Keyboard shortcuts (arrow keys, 's' for slideshow)
- 🔒 **NSFW Content Management**: Flag/unflag inappropriate content with visibility controls
- 🗑️ **File Management**: Delete files with confirmation dialogs
- ⬇️ **Download Support**: Direct file download functionality
- 🎨 **Modern UI**: Dark theme with smooth animations and hover effects
- 📐 **Resizable Sidebar**: Adjustable sidebar width with drag-to-resize
- 🔄 **Auto-Refresh**: Real-time updates when files are added or removed
- ⚡ **Performance Optimized**: Fast file serving, caching, and HEIC conversion
- 📂 **Environment Configuration**: Configurable folder paths and names via environment variables
- 🎭 **Loading Animations**: Smooth loading overlays with animated indicators
- 💾 **Smart File Sorting**: Chronological ordering by creation date (newest first)

## Recent Updates

### Latest Release Features:
- ✅ **Fixed Desktop & Mobile Fullscreen Slideshow**: Fullscreen mode now works correctly during slideshow on both desktop and mobile devices
- ✅ **Improved NSFW Icon Display**: Resolved Unicode character issues with lock/unlock icons using proper escape sequences
- ✅ **Enhanced Video File Support**: Added proper video file detection with 🎬 icons for MP4, MPEG, WAV, MOV, AVI, WebM
- ✅ **Performance Optimizations**: Reduced excessive re-renders during slideshow operation
- ✅ **Stable Component Mounting**: Implemented stable React key strategy to prevent component unmounting during slideshow
- ✅ **Runtime Configuration**: Added production-friendly configuration that can be changed without rebuilding
- ✅ **Cross-Platform Compatibility**: Ensured consistent functionality across different operating systems and browsers

## Configuration

### Environment Variables (Build-time)

Create a `.env` file in the root directory with your folder configuration:

```env
FOLDERS="/path/to/folder1;/path/to/folder2"
FOLDER_NAMES="Custom Name 1;Custom Name 2"
```

- `FOLDERS`: Semicolon-separated list of absolute paths to image directories
- `FOLDER_NAMES`: (Optional) Semicolon-separated list of custom display names for folders

### Runtime Configuration (Production-friendly)

For production deployments where you need to change folder paths without rebuilding the application, you can use runtime configuration:

#### Option 1: Data Directory Configuration

Create a `data/runtime-config.json` file in your application directory:

```json
{
  "folders": ["/production/generated", "/production/images", "/production/videos"],
  "folderNames": ["Generated", "Images", "Videos"]
}
```

#### Option 2: Custom Configuration Path

Set the `CONFIG_PATH` environment variable to specify a custom configuration file location:

```bash
export CONFIG_PATH="/etc/imageviewer/config.json"
```

#### Configuration Priority

The application checks for configuration in this order:
1. `$CONFIG_PATH` (environment variable override)
2. `data/runtime-config.json` (local data directory)
3. `/etc/imageviewer/config.json` (system-wide configuration)
4. `runtime-config.json` (application root fallback)
5. Environment variables (final fallback)

#### Production Deployment

1. Build your application: `npm run build`
2. Create or modify the runtime configuration file
3. Restart the application - changes take effect immediately

**Note**: Runtime configuration allows you to change folder paths in production without rebuilding the entire application.

## Keyboard Shortcuts

- **Arrow Keys**: Navigate between images
- **S**: Toggle slideshow mode
- **Space**: Pause/resume slideshow (when active)

## Usage

1. **Setup**: Configure your image folders in the `.env` file
2. **Browse**: Use the sidebar to navigate through your folder structure
3. **View**: Click on any image to view it with metadata
4. **Slideshow**: Press 'S' or click the play button to start an automatic slideshow
5. **Manage**: Flag NSFW content, delete files, or download images as needed

## Slideshow Features

- **Recursive Traversal**: Automatically includes all images from all subfolders
- **Smart Ordering**: Respects folder hierarchy and chronological file ordering
- **Dynamic Loading**: Prepares slideshow data on-demand with loading animations
- **Folder Expansion**: Automatically expands relevant folders during slideshow navigation
- **NSFW Filtering**: Respects NSFW visibility settings during slideshow

This is a [Next.js](https://nextjs.org) project.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a `.env` file with your folder configuration (see Configuration section above)

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser

### Production Build

To create a production build:

```bash
npm run build
npm start
```

## Technical Details

- **Framework**: Next.js 15+ with App Router
- **Styling**: Tailwind CSS with custom components
- **Image Processing**: Native browser support + HEIC conversion via libheif-js
- **File System**: Node.js fs module for server-side file operations
- **Metadata Extraction**: EXIF data parsing and file statistics
- **State Management**: React class components with local state
- **Responsive Design**: Mobile-first approach with touch gesture support

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

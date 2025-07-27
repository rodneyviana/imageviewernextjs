# Changelog

All notable changes to the Media Explorer project will be documented in this file.

## [1.1.0] - 2025-01-27

### Added
- **Complete Modern UI Redesign**: New professional interface with clean, modern styling
- **Theme System**: Light/dark mode toggle with automatic localStorage persistence
- **Font Awesome Integration**: Professional iconography throughout the interface
- **Modern Components**: 
  - ModernMainExplorer: Main application container with error boundaries
  - ModernExplorerSidebar: Redesigned sidebar with fixed width layout
  - ModernImageViewer: Enhanced image viewer with 16:9 aspect ratio
  - ThemeContext: React context for theme management
- **Error Boundaries**: Graceful error handling with fallback to classic interface
- **Dynamic Imports**: Code splitting for better performance

### Changed
- **Layout System**: Fixed sidebar widths (300px desktop, 200px mobile) replacing resizable sidebar
- **Image Display**: All images now display in 16:9 aspect ratio with proper scaling
- **Mobile Responsive**: 
  - Sidebar: 200px width on mobile devices
  - Main content: 600px minimum width with horizontal scrolling
  - Toolbar: Limited to 400px maximum width on mobile
  - Buttons: Smaller sizing (35px) and tighter spacing on mobile
- **Toolbar Position**: Centered horizontally over images instead of top-right corner
- **File Selection**: Improved contrast with blue background and white text in both themes
- **Scrolling Behavior**: 
  - Sidebar: Horizontal scroll for long file names
  - Main content: Horizontal scroll when content exceeds container
  - Custom styled scrollbars for better visibility
- **Application Title**: Changed from "Image Viewer with Metadata" to "Media Explorer"

### Removed
- **Sidebar Resizing**: Removed drag-to-resize functionality in favor of fixed widths
- **Classic Mode Button**: Removed debug toggle button from interface
- **Resize Debugging**: Cleaned up all resize-related debugging code and visual elements

### Fixed
- **Theme Persistence**: Theme preferences now saved and restored from localStorage
- **Mobile Layout**: Proper responsive behavior on mobile devices
- **Selection Contrast**: Fixed white-on-white text issue in light theme
- **Horizontal Scrolling**: Both sidebar and main content properly handle overflow
- **Icon Centering**: Toolbar icons properly centered over images
- **File Name Display**: Long file names now show with horizontal scroll instead of ellipsis

### Technical
- **CSS Architecture**: Complete CSS overhaul with modern.css for the new theme system
- **Component Structure**: Modularized components with proper TypeScript interfaces
- **State Management**: Simplified state management with removal of resize-related state
- **Performance**: Improved loading with dynamic imports and error boundaries
- **Accessibility**: Better contrast ratios and keyboard navigation support

## [0.1.0] - Previous Version
- Initial release with classic interface
- Basic image viewing and metadata display
- Slideshow functionality
- NSFW content management
- File management operations

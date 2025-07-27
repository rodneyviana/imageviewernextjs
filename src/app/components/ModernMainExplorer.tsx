"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ModernExplorerSidebar, { ModernExplorerSidebarRef } from './ModernExplorerSidebar';
import ModernImageViewer, { ModernImageViewerRef } from './ModernImageViewer';

interface FileEntry {
  path: string;
  name: string;
  type: 'file' | 'folder';
  nsfwFlagged: boolean;
}

interface ModernMainExplorerState {
  selected: string | null;
  showNSFW: boolean;
  confirmDelete: string | null;
  files: FileEntry[];
  currentIdx: number;
  children: FileEntry[];
  sidebarRefresh: (() => void) | null;
  sidebarVisible: boolean;
  slideshowRunning: boolean;
  slideshowTimer: NodeJS.Timeout | null;
  slideshowFiles: FileEntry[];
  slideshowLoading: boolean;
  showiPhoneFullscreen: boolean;
  iPhoneFullscreenFile: FileEntry | null;
  searchQuery: string;
}

export default function ModernMainExplorer() {
  const { theme, setTheme } = useTheme();
  const sidebarRef = useRef<ModernExplorerSidebarRef>(null);
  const imageViewerRef = useRef<ModernImageViewerRef>(null);
  
  const [state, setState] = useState<ModernMainExplorerState>({
    selected: null,
    showNSFW: false,
    confirmDelete: null,
    files: [],
    currentIdx: 0,
    children: [],
    sidebarRefresh: null,
    sidebarVisible: true,
    slideshowRunning: false,
    slideshowTimer: null,
    slideshowFiles: [],
    slideshowLoading: false,
    showiPhoneFullscreen: false,
    iPhoneFullscreenFile: null,
    searchQuery: ''
  });

  // Fixed sidebar width - no resizing
  const sidebarWidth = 300;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleSlideshow();
        return;
      }

      if (state.slideshowRunning) {
        const { currentIdx, slideshowFiles } = state;
        if (e.key === 'ArrowLeft') {
          const newIdx = Math.max(0, currentIdx - 1);
          setState(prev => ({ ...prev, currentIdx: newIdx, selected: slideshowFiles[newIdx].path }));
        }
        if (e.key === 'ArrowRight') {
          const newIdx = Math.min(slideshowFiles.length - 1, currentIdx + 1);
          setState(prev => ({ ...prev, currentIdx: newIdx, selected: slideshowFiles[newIdx].path }));
        }
        return;
      }

      const { currentIdx, files } = state;
      if (e.key === 'ArrowLeft') {
        stopSlideshow();
        const newIdx = Math.max(0, currentIdx - 1);
        setState(prev => ({ ...prev, currentIdx: newIdx, selected: files[newIdx]?.path }));
      }
      if (e.key === 'ArrowRight') {
        stopSlideshow();
        const newIdx = Math.min(files.length - 1, currentIdx + 1);
        setState(prev => ({ ...prev, currentIdx: newIdx, selected: files[newIdx]?.path }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.slideshowRunning, state.currentIdx, state.files, state.slideshowFiles]);

  // Auto-expand parent folder when selection changes
  useEffect(() => {
    if (state.sidebarVisible && state.selected) {
      if (!state.selected.endsWith('/') && !state.selected.endsWith('\\')) {
        const parentFolder = state.selected.substring(0, Math.max(state.selected.lastIndexOf('/'), state.selected.lastIndexOf('\\')));
        if (parentFolder && sidebarRef.current) {
          setTimeout(() => {
            if (sidebarRef.current?.expandFolderPath) {
              sidebarRef.current.expandFolderPath(parentFolder);
            }
          }, 100);
        }
      }
    }
  }, [state.selected, state.sidebarVisible]);

  // Handle responsive width changes on orientation change - removed resize logic
  React.useEffect(() => {
    // No dynamic resizing - using fixed sidebar width
  }, []);

  const refreshChildren = React.useCallback(async () => {
    const { selected } = state;
    
    // Don't make API calls for empty or invalid selections
    if (!selected || selected.trim() === '') {
      return;
    }
    
    const folderToLoad = selected && !selected.endsWith('/') && !selected.endsWith('\\')
      ? selected.substring(0, Math.max(selected.lastIndexOf('/'), selected.lastIndexOf('\\'))) || ''
      : selected || '';
    
    // Don't make API calls for empty folder paths
    if (!folderToLoad || folderToLoad.trim() === '') {
      return;
    }
    
    // Don't reload if we're just navigating within the same folder
    const currentFolder = state.files.length > 0 && state.files[0] ? 
      state.files[0].path.substring(0, Math.max(state.files[0].path.lastIndexOf('/'), state.files[0].path.lastIndexOf('\\'))) || '' 
      : '';
    
    if (currentFolder === folderToLoad && state.files.length > 0) {
      // Just update the current index without reloading
      let idx = 0;
      if (selected && !selected.endsWith('/') && !selected.endsWith('\\')) {
        const found = state.files.findIndex(f => f.path === selected);
        idx = found !== -1 ? found : 0;
      }
      setState(prev => ({ ...prev, currentIdx: idx }));
      return;
    }
    
    try {
      const response = await fetch(`/api/children?folder=${encodeURIComponent(folderToLoad)}`);
      const data = await response.json();
      const children: FileEntry[] = data.children || [];
      let files = children.filter((c: FileEntry) => c.type === 'file');
      
      if (!state.showNSFW) {
        files = files.filter((f: FileEntry) => !f.nsfwFlagged);
      }
      
      setState(prev => ({ ...prev, children, files }));
      
      if (!state.slideshowRunning) {
        updateCurrentIdx(files, selected);
      }
    } catch (error) {
      console.error('Failed to refresh children:', error);
    }
  }, [state.selected, state.showNSFW, state.slideshowRunning, state.files]);

  // Refresh children when selection or NSFW toggle changes
  useEffect(() => {
    if (!state.slideshowRunning) {
      // Debounce rapid changes to prevent flickering
      const timeoutId = setTimeout(() => {
        refreshChildren();
      }, 50); // 50ms debounce
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selected, state.showNSFW, refreshChildren]);

  const updateCurrentIdx = React.useCallback((files: FileEntry[], selected: string | null) => {
    let idx = 0;
    if (selected && !selected.endsWith('/') && !selected.endsWith('\\')) {
      const found = files.findIndex(f => f.path === selected);
      idx = found !== -1 ? found : 0;
    }
    setState(prev => ({ ...prev, currentIdx: idx }));
  }, []);

  const handleSelect = (path: string) => {
    if (state.slideshowRunning) {
      stopSlideshow();
    }
    setState(prev => ({ ...prev, selected: path }));
  };

  const handleSidebarRefresh = React.useCallback((fn: () => void) => {
    setState(prev => ({ ...prev, sidebarRefresh: fn }));
  }, []);

  const toggleSidebar = () => {
    setState(prev => ({ ...prev, sidebarVisible: !prev.sidebarVisible }));
  };

  const startSlideshow = async () => {
    stopSlideshow();
    
    setState(prev => ({ ...prev, slideshowLoading: true }));
    
    try {
      const response = await fetch('/api/explorer');
      const data = await response.json();
      const rootFolders = data.tree || [];

      const collectAllFiles = async (folderPath: string): Promise<FileEntry[]> => {
        try {
          const response = await fetch(`/api/children?folder=${encodeURIComponent(folderPath)}`);
          const data = await response.json();
          const children = data.children || [];
          
          const files: FileEntry[] = [];
          
          for (const child of children) {
            if (child.type === 'file') {
              files.push({
                path: child.path,
                name: child.name,
                type: 'file' as const,
                nsfwFlagged: child.nsfwFlagged || false
              });
            } else if (child.type === 'folder') {
              const subFiles = await collectAllFiles(child.path);
              files.push(...subFiles);
            }
          }
          
          return files;
        } catch (e) {
          console.error(`Failed to load folder ${folderPath}:`, e);
          return [];
        }
      };

      let slideshowFiles: FileEntry[] = [];
      for (const rootFolder of rootFolders) {
        if (rootFolder.type === 'folder') {
          const folderFiles = await collectAllFiles(rootFolder.path);
          slideshowFiles.push(...folderFiles);
        }
      }

      if (!state.showNSFW) {
        slideshowFiles = slideshowFiles.filter((f: FileEntry) => !f.nsfwFlagged);
      }

      const currentFileIndex = state.selected ? slideshowFiles.findIndex(f => f.path === state.selected) : 0;
      
      setState(prev => ({ 
        ...prev,
        slideshowFiles,
        currentIdx: Math.max(0, currentFileIndex),
        slideshowLoading: false
      }));

      const next = () => {
        setState(prevState => {
          if (prevState.slideshowFiles.length === 0) {
            stopSlideshow();
            return prevState;
          }
          const nextIdx = (prevState.currentIdx + 1) % prevState.slideshowFiles.length;
          const nextFile = prevState.slideshowFiles[nextIdx];
          
          if (prevState.slideshowRunning && imageViewerRef.current) {
            imageViewerRef.current.updateCurrentImage(nextFile);
          }
          
          return { ...prevState, currentIdx: nextIdx, selected: nextFile.path };
        });
      };
      
      next();
      const timer = setInterval(next, 3000);
      setState(prev => ({ ...prev, slideshowRunning: true, slideshowTimer: timer }));
      
    } catch (error) {
      console.error('Error starting slideshow:', error);
      setState(prev => ({ ...prev, slideshowLoading: false }));
    }
  };

  const stopSlideshow = () => {
    if (state.slideshowTimer) {
      clearInterval(state.slideshowTimer);
    }
    
    setState(prev => ({ 
      ...prev,
      slideshowRunning: false, 
      slideshowTimer: null,
      slideshowLoading: false
    }));
    
    setTimeout(() => {
      refreshChildren();
    }, 100);
  };

  const toggleSlideshow = () => {
    if (state.slideshowRunning) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  };

  const handleShowiPhoneFullscreen = (file: FileEntry) => {
    setState(prev => ({ ...prev, showiPhoneFullscreen: true, iPhoneFullscreenFile: file }));
  };

  const handleCloseiPhoneFullscreen = () => {
    setState(prev => ({ ...prev, showiPhoneFullscreen: false, iPhoneFullscreenFile: null }));
  };

  const handleDelete = (file: string) => {
    setState(prev => ({ ...prev, confirmDelete: file }));
  };

  const handleFileChange = React.useCallback((file: string) => {
    // Don't update state with empty or invalid file paths
    if (!file || file.trim() === '') {
      return;
    }
    setState(prev => ({ ...prev, selected: file }));
  }, []);

  const handleSetCurrentIdx = React.useCallback((idx: number) => {
    stopSlideshow();
    setState(prev => {
      const newSelected = prev.slideshowRunning ? 
        prev.slideshowFiles[idx]?.path : 
        prev.files[idx]?.path;
      return { 
        ...prev, 
        currentIdx: idx,
        selected: newSelected || prev.selected
      };
    });
  }, []);

  const confirmDeleteFile = async () => {
    const { confirmDelete, files, currentIdx, sidebarRefresh } = state;
    if (!confirmDelete) return;
    
    const currentPath = files[currentIdx]?.path;
    const deletingCurrent = currentPath === confirmDelete;
    
    let newSelected: string | null = null;
    if (deletingCurrent) {
      if (currentIdx < files.length - 1) {
        newSelected = files[currentIdx + 1].path;
      } else if (currentIdx > 0) {
        newSelected = files[currentIdx - 1].path;
      }
    } else {
      newSelected = currentPath || null;
    }
    
    try {
      await fetch(`/api/delete?file=${encodeURIComponent(confirmDelete)}`, { method: 'DELETE' });
      setState(prev => ({ ...prev, confirmDelete: null, selected: newSelected }));
      refreshChildren();
      if (sidebarRefresh) sidebarRefresh();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleFlagNSFW = async (file: string, flag: boolean) => {
    const endpoint = flag ? 'flag-nsfw' : 'unflag-nsfw';
    
    try {
      await fetch(`/api/${endpoint}`, { 
        method: 'POST', 
        body: JSON.stringify({ file }), 
        headers: { 'Content-Type': 'application/json' } 
      });
      
      // Check actual file existence and update states
      const response = await fetch(`/api/check-nsfw?file=${encodeURIComponent(file)}`);
      const data = await response.json();
      const actualFlag = data.nsfwFlagged || false;
      
      // Update sidebar
      if (sidebarRef.current) {
        sidebarRef.current.updateFileFlag(file, actualFlag);
      }
      
      // Update files arrays
      setState(prev => {
        const updatedFiles = prev.files.map(f => 
          f.path === file ? { ...f, nsfwFlagged: actualFlag } : f
        );
        const updatedSlideshowFiles = prev.slideshowFiles.map(f => 
          f.path === file ? { ...f, nsfwFlagged: actualFlag } : f
        );
        const updatedChildren = prev.children.map(f => 
          f.path === file ? { ...f, nsfwFlagged: actualFlag } : f
        );
        
        return {
          ...prev,
          files: updatedFiles,
          slideshowFiles: updatedSlideshowFiles,
          children: updatedChildren
        };
      });
    } catch (error) {
      console.error('Failed to flag/unflag NSFW:', error);
    }
  };

  const activeFiles = state.slideshowRunning ? state.slideshowFiles : state.files;
  const file = activeFiles[state.currentIdx];
  
  // Check if folder is selected (no file extension)
  const lastPartOfSelected = state.selected ? state.selected.split('/').pop() || '' : '';
  const isFolderSelected = !lastPartOfSelected.includes('.');

  return (
    <>
      {/* iPhone Fullscreen Modal */}
      {state.showiPhoneFullscreen && (() => {
        const currentFile = activeFiles[state.currentIdx];
        if (!currentFile) return null;
        return (
          <div className="modern-fullscreen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/view?file=${encodeURIComponent(currentFile.path)}`}
              alt={currentFile?.name || 'Full screen image'}
            />
            <button
              className="modern-fullscreen-close"
              onClick={handleCloseiPhoneFullscreen}
            >
              &times;
            </button>
          </div>
        );
      })()}

      <div className="modern-app-container">
        {/* Header */}
        <header className="modern-app-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              className="modern-sidebar-toggle"
              onClick={toggleSidebar}
              title={state.sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
            >
              <i className={`fas ${state.sidebarVisible ? 'fa-chevron-left' : 'fa-chevron-right'}`} />
            </button>
            <h1 className="modern-app-title">
              <i className="fas fa-images icon" />
              Media Explorer
            </h1>
          </div>
          
          <div className="modern-controls">
            <div className="modern-search-container">
              <i className="fas fa-search modern-search-icon" />
              <input
                type="text"
                className="modern-search-input"
                placeholder="Search media..."
                value={state.searchQuery}
                onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              />
            </div>
            
            <select
              className="modern-theme-selector"
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
            >
              <option value="light">Light Theme</option>
              <option value="dark">Dark Theme</option>
            </select>
          </div>
        </header>

        {/* Main Content */}
        <div className="modern-explorer-container">
          <ModernExplorerSidebar
            ref={sidebarRef}
            selected={state.selected}
            onSelect={handleSelect}
            onRefresh={refreshChildren}
            onSidebarRefresh={handleSidebarRefresh}
            showNSFW={state.showNSFW}
            onToggleNSFW={() => setState(prev => ({ ...prev, showNSFW: !prev.showNSFW }))}
            visible={state.sidebarVisible}
            width={sidebarWidth}
          />

          <div className="modern-main-content">
            {isFolderSelected ? (
              <div className="modern-no-selection">
                <i className="fas fa-folder-open icon" />
                <h3>Select a file to view</h3>
                <p>Choose an image or video from the sidebar</p>
              </div>
            ) : activeFiles.length === 0 ? (
              <div className="modern-no-selection">
                <i className="fas fa-images icon" />
                <h3>No files found</h3>
                <p>This folder does not contain any viewable files</p>
              </div>
            ) : (
              <ModernImageViewer
                ref={imageViewerRef}
                key={state.slideshowRunning ? 'slideshow-mode' : `${file?.path || 'no-file'}-${file?.nsfwFlagged || 'false'}`}
                files={activeFiles}
                currentIdx={state.currentIdx}
                setCurrentIdx={handleSetCurrentIdx}
                onDelete={handleDelete}
                onFlagNSFW={handleFlagNSFW}
                onFileChange={handleFileChange}
                onShowiPhoneFullscreen={handleShowiPhoneFullscreen}
                onToggleSlideshow={toggleSlideshow}
                slideshowRunning={state.slideshowRunning}
              />
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {state.confirmDelete && (
          <div className="modern-confirm-overlay">
            <div className="modern-confirm-dialog">
              <h2 className="modern-confirm-title">Confirm Delete</h2>
              <p className="modern-confirm-message">
                Are you sure you want to delete this file? This action cannot be undone.
              </p>
              <div className="modern-confirm-actions">
                <button
                  className="modern-btn modern-btn-secondary"
                  onClick={() => setState(prev => ({ ...prev, confirmDelete: null }))}
                >
                  Cancel
                </button>
                <button
                  className="modern-btn modern-btn-danger"
                  onClick={confirmDeleteFile}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Slideshow Loading Overlay */}
        {state.slideshowLoading && (
          <div className="modern-loading-overlay">
            <div className="modern-loading-content">
              <span>Preparing slideshow</span>
              <div className="modern-loading-dots">
                <div className="modern-loading-dot"></div>
                <div className="modern-loading-dot"></div>
                <div className="modern-loading-dot"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

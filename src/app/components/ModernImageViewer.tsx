"use client";

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface FileEntry {
  path: string;
  name: string;
  type: 'file' | 'folder';
  nsfwFlagged: boolean;
}

interface ModernImageViewerProps {
  files: FileEntry[];
  currentIdx: number;
  setCurrentIdx: (idx: number) => void;
  showNSFW: boolean;
  onDelete: (file: string) => void;
  onFlagNSFW: (file: string, flag: boolean) => void;
  onFileChange: (file: string) => void;
  onShowiPhoneFullscreen: (file: FileEntry) => void;
  onToggleSlideshow: () => void;
  slideshowRunning: boolean;
}

interface ModernImageViewerState {
  metadata: any;
  loading: boolean;
}

export interface ModernImageViewerRef {
  updateCurrentImage: (newFile: FileEntry) => void;
}

const ModernImageViewer = forwardRef<ModernImageViewerRef, ModernImageViewerProps>(
  ({ files, currentIdx, setCurrentIdx, showNSFW, onDelete, onFlagNSFW, onFileChange, onShowiPhoneFullscreen, onToggleSlideshow, slideshowRunning }, ref) => {
    const [metadata, setMetadata] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [metadataExpanded, setMetadataExpanded] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);

    useImperativeHandle(ref, () => ({
      updateCurrentImage: (newFile: FileEntry) => {
        // Schedule state updates for next tick to avoid setState during render
        setTimeout(() => {
          fetchMetadata(newFile.path);
          onFileChange(newFile.path);
          // Show overlay if HEIC
          if (newFile.name.toLowerCase().endsWith('.heic')) {
            setLoading(true);
          } else {
            setLoading(false);
          }
        }, 0);
      }
    }));

    const fetchMetadata = async (path: string) => {
      try {
        const response = await fetch(`/api/metadata?file=${encodeURIComponent(path)}`);
        const data = await response.json();
        setMetadata(data.metadata);
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
        setMetadata(null);
      }
    };

    useEffect(() => {
      const file = files[currentIdx];
      if (file) {
        fetchMetadata(file.path);
        onFileChange(file.path);
        // Show overlay if HEIC
        if (file.name.toLowerCase().endsWith('.heic')) {
          setLoading(true);
        }
      }
    }, [currentIdx, files]); // Removed onFileChange from dependencies

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft' && currentIdx > 0) {
          handlePrevious();
        }
        if (e.key === 'ArrowRight' && currentIdx < files.length - 1) {
          handleNext();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [currentIdx, files.length]);

    const handlePrevious = React.useCallback(() => {
      if (currentIdx > 0) {
        const newIdx = currentIdx - 1;
        setCurrentIdx(newIdx);
        // onFileChange will be called by useEffect when currentIdx changes
      }
    }, [currentIdx, setCurrentIdx]);

    const handleNext = React.useCallback(() => {
      if (currentIdx < files.length - 1) {
        const newIdx = currentIdx + 1;
        setCurrentIdx(newIdx);
        // onFileChange will be called by useEffect when currentIdx changes
      }
    }, [currentIdx, files.length, setCurrentIdx]);

    const handleFullscreen = () => {
      const isIPhone = /iPhone/i.test(navigator.userAgent);
      if (isIPhone) {
        onShowiPhoneFullscreen(files[currentIdx]);
        return;
      }
      
      const el = imageRef.current;
      if (el) {
        if (el.requestFullscreen) {
          el.requestFullscreen();
        } else if ((el as any).webkitEnterFullScreen) {
          (el as any).webkitEnterFullScreen();
        } else if ((el as any).msRequestFullscreen) {
          (el as any).msRequestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          (el as any).webkitRequestFullscreen();
        }
      }
    };

    const handleImageLoad = () => {
      setLoading(false);
    };

    const handleDownload = () => {
      const file = files[currentIdx];
      if (file) {
        window.open(`/api/download?file=${encodeURIComponent(file.path)}`);
      }
    };

    const file = files[currentIdx];
    
    if (!file || file.name === undefined || !file.name.includes('.')) {
      return (
        <div className="modern-no-selection">
          <i className="fas fa-images icon" />
          <h3>Select an image to view</h3>
          <p>Choose a file from the sidebar to get started</p>
        </div>
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const isImage = ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp'].includes(ext!);
    const isVideo = ['mp4', 'mpeg', 'wav', 'mov', 'avi', 'webm'].includes(ext!);
    const isHeic = ext === 'heic';

    return (
      <div className="modern-preview-container">
        <div className="modern-media-preview">
          {/* Converting overlay for HEIC */}
          {isHeic && loading && (
            <div className="modern-converting-overlay">
              <div>Converting image</div>
              <div className="modern-loading-dots">
                <div className="modern-loading-dot"></div>
                <div className="modern-loading-dot"></div>
                <div className="modern-loading-dot"></div>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="modern-toolbar">
            <button 
              className="modern-toolbar-btn" 
              onClick={handlePrevious}
              disabled={currentIdx <= 0}
              title="Previous"
            >
              <i className="fas fa-arrow-left" />
            </button>
            <button 
              className="modern-toolbar-btn" 
              onClick={handleNext}
              disabled={currentIdx >= files.length - 1}
              title="Next"
            >
              <i className="fas fa-arrow-right" />
            </button>
            <button 
              className="modern-toolbar-btn" 
              onClick={onToggleSlideshow}
              title="Toggle Slideshow"
            >
              <i className={`fas ${slideshowRunning ? 'fa-pause' : 'fa-play'}`} />
            </button>
            <button 
              className="modern-toolbar-btn" 
              onClick={() => onFlagNSFW(file.path, !file.nsfwFlagged)}
              title={file.nsfwFlagged ? "Unflag NSFW" : "Flag NSFW"}
            >
              <i className={`fas ${file.nsfwFlagged ? 'fa-unlock' : 'fa-lock'}`} />
            </button>
            <button 
              className="modern-toolbar-btn" 
              onClick={handleDownload}
              title="Download"
            >
              <i className="fas fa-download" />
            </button>
            <button 
              className="modern-toolbar-btn" 
              onClick={handleFullscreen}
              title="Full Screen"
            >
              <i className="fas fa-expand" />
            </button>
            <button 
              className="modern-toolbar-btn" 
              onClick={() => onDelete(file.path)}
              title="Delete"
            >
              <i className="fas fa-trash" />
            </button>
          </div>

          {/* Media Content */}
          {(isImage || isHeic) && (
            <img
              ref={imageRef}
              src={`/api/view?file=${encodeURIComponent(file.path)}`}
              alt={file.name}
              className={loading ? 'invisible' : ''}
              onLoad={handleImageLoad}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          )}
          
          {isVideo && (
            <video
              src={`/api/view?file=${encodeURIComponent(file.path)}`}
              controls
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          )}

          {/* File counter */}
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--overlay)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            {currentIdx + 1} of {files.length}
          </div>
        </div>

        {/* Metadata Section */}
        <div className="modern-metadata-container">
          <div 
            className="modern-metadata-header"
            onClick={() => setMetadataExpanded(!metadataExpanded)}
          >
            <h3>File Metadata</h3>
            <i className={`fas ${metadataExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
          </div>
          <div className={`modern-metadata-content ${metadataExpanded ? 'expanded' : ''}`}>
            <div style={{ marginBottom: '1rem', fontFamily: 'inherit' }}>
              <strong>File:</strong> {file.name}
            </div>
            {metadata ? (
              typeof metadata === 'object' ? (
                <pre>{JSON.stringify(metadata, null, 2)}</pre>
              ) : (
                <div>{metadata}</div>
              )
            ) : (
              <div style={{ color: 'var(--textSecondary)', fontStyle: 'italic' }}>
                No metadata available
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ModernImageViewer.displayName = 'ModernImageViewer';

export default ModernImageViewer;

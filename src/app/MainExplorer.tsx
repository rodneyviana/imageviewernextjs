"use client";
/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element, @typescript-eslint/no-non-null-asserted-optional-chain */
import React from 'react';
import ExplorerSidebar from './ExplorerSidebar';

interface FileEntry {
  path: string;
  name: string;
  type: 'file' | 'directory';
  nsfwFlagged: boolean;
}

// Class-based ImageViewer
interface ImageViewerProps {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ImageViewerState { metadata: any; loading: boolean; }
class ImageViewer extends React.Component<ImageViewerProps, ImageViewerState> {
  state: ImageViewerState = { metadata: null, loading: false };

  fetchMetadata(path: string) {
    fetch(`/api/metadata?file=${encodeURIComponent(path)}`)
      .then(res => res.json())
      .then(data => this.setState({ metadata: data.metadata }))
      .catch(console.error);
  }

  componentDidMount() {
    const file = this.props.files[this.props.currentIdx];
    if (file) {
      this.fetchMetadata(file.path);
      // Show overlay if HEIC
      if (file.name.toLowerCase().endsWith('.heic')) {
        this.setState({ loading: true });
      }
    }
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentDidUpdate(prevProps: ImageViewerProps) {
    const prevFile = prevProps.files[prevProps.currentIdx];
    const file = this.props.files[this.props.currentIdx];
    if (file && file.path !== prevFile?.path) {
      this.fetchMetadata(file.path);
      this.props.onFileChange(file.path);
      // Show overlay on new HEIC
      this.setState({ loading: file.name.toLowerCase().endsWith('.heic') });
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (e: KeyboardEvent) => {
    const { currentIdx, files } = this.props;
    if (e.key === 'ArrowLeft' && currentIdx > 0) this.handlePrevious();
    if (e.key === 'ArrowRight' && currentIdx < files.length - 1) this.handleNext();
  };

  handlePrevious = () => {
    const { currentIdx, files, setCurrentIdx, onFileChange } = this.props;
    if (currentIdx > 0) {
      const newIdx = currentIdx - 1;
      setCurrentIdx(newIdx);
      if (files[newIdx]) onFileChange(files[newIdx].path);
    }
  };

  handleNext = () => {
    const { currentIdx, files, setCurrentIdx, onFileChange } = this.props;
    if (currentIdx < files.length - 1) {
      const newIdx = currentIdx + 1;
      setCurrentIdx(newIdx);
      if (files[newIdx]) onFileChange(files[newIdx].path);
    }
  };

  // Ref for fullscreen
  private imageRef = React.createRef<HTMLImageElement>();

  // Enter fullscreen mode on image
  handleFullscreen = () => {
    const isIPhone = /iPhone/i.test(navigator.userAgent);
    if (isIPhone) {
      this.props.onShowiPhoneFullscreen(this.props.files[this.props.currentIdx]);
      return;
    }
    const el = this.imageRef.current;
    if (el) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if ((el as HTMLImageElement & { webkitEnterFullScreen?: () => void }).webkitEnterFullScreen) {
        (el as HTMLImageElement & { webkitEnterFullScreen?: () => void }).webkitEnterFullScreen?.();
      } else if ((el as HTMLImageElement & { msRequestFullscreen?: () => void }).msRequestFullscreen) {
        (el as HTMLImageElement & { msRequestFullscreen?: () => void }).msRequestFullscreen?.();
      } else if ((el as HTMLImageElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
        (el as HTMLImageElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.();
      }
    }
  };

  handleImageLoad = () => {
    this.setState({ loading: false });
  };

  render() {
    const { files, currentIdx, showNSFW, onDelete, onFlagNSFW } = this.props;
    const { metadata, loading } = this.state;
    const file = files[currentIdx];
    if (file === undefined || file.name === undefined || !file.name.includes('.')) {
      return <div className="p-4 text-center text-gray-500">Select an image to see</div>;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isImage = ['jpeg','jpg','png','gif','bmp','webp'].includes(ext!);
    const isVideo = ['mp4','mpeg','wav','mov','avi','webm'].includes(ext!);
    const isHeic = ext === 'heic';

    return (
      <div className="image-viewer relative z-10">
        {/* Overlay when converting HEIC */}
        {isHeic && loading && (
          <div className="converting-overlay">
            <div>Converting image</div>
            <div className="pulsing-dots"><span></span><span></span><span></span></div>
          </div>
        )}
        <div className="image-viewer-actions">
          <button 
            onClick={this.handlePrevious} 
            title="Previous"
            disabled={this.props.currentIdx <= 0}
            className="disabled:opacity-50"
          >
            ⬅️
          </button>
          <button 
            onClick={this.handleNext} 
            title="Next"
            disabled={this.props.currentIdx >= files.length - 1}
            className="disabled:opacity-50"
          >
            ➡️
          </button>
          <span className="mx-2.5 text-xs">
            {this.props.currentIdx + 1} of {files.length}
          </span>
          <button onClick={this.props.onToggleSlideshow} title="Slideshow">{this.props.slideshowRunning ? '❚❚' : '▶'}</button>
          <button onClick={() => window.open(`/api/download?file=${encodeURIComponent(file.path)}`)} title="Download">⬇️</button>
          <button onClick={this.handleFullscreen} title="Full Screen" className="icon-button">⛶</button>
          <button onClick={() => onFlagNSFW(file.path, !file.nsfwFlagged)} title={file.nsfwFlagged ? "Unflag NSFW" : "Flag NSFW"}>
            {file.nsfwFlagged ? '🔓' : '🔒'}
          </button>
          <button onClick={() => onDelete(file.path)} title="Delete">🗑️</button>
        </div>
        {/* Always render image (converted HEIC or other) and hide until loaded */}
        {(isImage || isHeic) && (
          <img
            ref={this.imageRef}
            src={`/api/view?file=${encodeURIComponent(file.path)}`}
            alt={file.name}
            className={`image-viewer-img ${loading ? 'invisible' : ''}`}
            onLoad={this.handleImageLoad}
          />
        )}
        {isVideo && (
          <video
            src={`/api/view?file=${encodeURIComponent(file.path)}`}
            controls
            className="image-viewer-video"
          />
        )}        <div className="image-viewer-meta">
          <div className="image-viewer-meta-title">File: {file.name}</div>
          <div className="image-viewer-meta-title">Metadata</div>
          {metadata ? (typeof metadata === 'object' ? <div className="metadata-json">{JSON.stringify(metadata, null, 2)}</div> : <div>{metadata}</div>) : <div>No metadata</div>}
        </div>
      </div>
    );
  }
}

// MainExplorer class component
interface MainExplorerState {
  selected: string|null;
  showNSFW: boolean;
  confirmDelete: string|null;
  files: FileEntry[];
  currentIdx: number;
  children: FileEntry[];
  sidebarRefresh: (()=>void)|null;
  expanded: Record<string, boolean>;
  sidebarWidth: number; // px
  resizingSidebar: boolean;
  showiPhoneFullscreen: boolean;
  iPhoneFullscreenFile: FileEntry | null;
  sidebarVisible: boolean;
  slideshowRunning: boolean;
  slideshowTimer: NodeJS.Timeout | null;
  slideshowFiles: FileEntry[];
  slideshowLoading: boolean;
}

export default class MainExplorer extends React.Component<Record<string, never>, MainExplorerState> {
  private sidebarRef = React.createRef<ExplorerSidebar>();
  state: MainExplorerState = {
    selected: null,
    showNSFW: false,
    confirmDelete: null,
    files: [],
    currentIdx: 0,
    children: [],
    sidebarRefresh: null,
    expanded: {},
    sidebarWidth: 280, // default width in px
    resizingSidebar: false,
    showiPhoneFullscreen: false,
    iPhoneFullscreenFile: null,
    sidebarVisible: true,
    slideshowRunning: false,
    slideshowTimer: null,
    slideshowFiles: [],
    slideshowLoading: false,
  };

  sidebarMinWidth = 180;
  sidebarMaxWidth = 500;


  handleSidebarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    this.setState({ resizingSidebar: true });
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', this.handleSidebarMouseMove);
    document.addEventListener('mouseup', this.handleSidebarMouseUp);
  };

  handleSidebarTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    this.setState({ resizingSidebar: true });
    document.body.style.cursor = 'col-resize';
    document.addEventListener('touchmove', this.handleSidebarTouchMove);
    document.addEventListener('touchend', this.handleSidebarTouchEnd);
  };

  handleSidebarTouchMove = (e: TouchEvent) => {
    if (!this.state.resizingSidebar) return;
    const touch = e.touches[0];
    if (!touch) return;
    const sidebarLeft = (document.querySelector('.main-explorer-sidebar') as HTMLElement)?.getBoundingClientRect().left || 0;
    let newWidth = touch.clientX - sidebarLeft;
    newWidth = Math.max(this.sidebarMinWidth, Math.min(this.sidebarMaxWidth, newWidth));
    this.setState({ sidebarWidth: newWidth });
  };

  handleSidebarTouchEnd = () => {
    this.setState({ resizingSidebar: false });
    document.body.style.cursor = '';
    document.removeEventListener('touchmove', this.handleSidebarTouchMove);
    document.removeEventListener('touchend', this.handleSidebarTouchEnd);
  };

  handleSidebarMouseMove = (e: MouseEvent) => {
    if (!this.state.resizingSidebar) return;
    // Calculate new width based on mouse X
    const sidebarLeft = (document.querySelector('.main-explorer-sidebar') as HTMLElement)?.getBoundingClientRect().left || 0;
    let newWidth = e.clientX - sidebarLeft;
    newWidth = Math.max(this.sidebarMinWidth, Math.min(this.sidebarMaxWidth, newWidth));
    this.setState({ sidebarWidth: newWidth });
  };

  handleSidebarMouseUp = () => {
    this.setState({ resizingSidebar: false });
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', this.handleSidebarMouseMove);
    document.removeEventListener('mouseup', this.handleSidebarMouseUp);
  };

  stopSlideshow = () => {
    if (this.state.slideshowTimer) {
      clearInterval(this.state.slideshowTimer);
    }
    
    // Show loading overlay briefly while stopping
    this.setState({ slideshowLoading: true });
    
    this.setState({ 
      slideshowRunning: false, 
      slideshowTimer: null,
      slideshowLoading: false
    }, () => {
      // Refresh the children for the current selection so the regular view shows the right files
      this.refreshChildren();
    });
  };

  startSlideshow = async () => {
    this.stopSlideshow(); // Stop any existing slideshow
    
    // Show loading overlay
    this.setState({ slideshowLoading: true });
    
    try {
      // Get the root folders from explorer
      const res = await fetch('/api/explorer');
      const data = await res.json();
      const rootFolders = data.tree || [];

      // Recursively collect all files from all folders
      const collectAllFiles = async (folderPath: string): Promise<FileEntry[]> => {
        try {
          const res = await fetch(`/api/children?folder=${encodeURIComponent(folderPath)}`);
          const data = await res.json();
          const children = data.children || [];
          
          const files: FileEntry[] = [];
          
          for (const child of children) {
            if (child.type === 'file') {
              const fileEntry = {
                path: child.path,
                name: child.name,
                type: 'file' as const,
                nsfwFlagged: child.nsfwFlagged || false
              };
              files.push(fileEntry);
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

      // Collect files from all root folders
      let slideshowFiles: FileEntry[] = [];
      for (const rootFolder of rootFolders) {
        if (rootFolder.type === 'folder') {
          const folderFiles = await collectAllFiles(rootFolder.path);
          slideshowFiles.push(...folderFiles);
        }
      }

      if (!this.state.showNSFW) {
        slideshowFiles = slideshowFiles.filter((f:FileEntry)=>!f.nsfwFlagged);
      }

      // Find the current file in the slideshow list and start from there
      const { selected } = this.state;
      const currentFileIndex = selected ? slideshowFiles.findIndex(f => f.path === selected) : 0;
      
      this.setState({ 
        slideshowFiles,
        currentIdx: Math.max(0, currentFileIndex),
        slideshowLoading: false
      });

      const next = () => {
        this.setState(prevState => {
          if (prevState.slideshowFiles.length === 0) {
            this.stopSlideshow();
            return null;
          }
          const nextIdx = (prevState.currentIdx + 1) % prevState.slideshowFiles.length;
          const nextFile = prevState.slideshowFiles[nextIdx];
          return { currentIdx: nextIdx, selected: nextFile.path };
        });
      }
      next(); // show next image immediately
      const timer = setInterval(next, 3000);
      this.setState({ slideshowRunning: true, slideshowTimer: timer });
    } catch (error) {
      console.error('Error starting slideshow:', error);
      this.setState({ slideshowLoading: false });
    }
  };

  toggleSlideshow = () => {
    if (this.state.slideshowRunning) {
      this.stopSlideshow();
    } else {
      this.startSlideshow();
    }
  };

  toggleSidebar = () => {
    this.setState(prevState => ({ sidebarVisible: !prevState.sidebarVisible }));
  };

  handleShowiPhoneFullscreen = (file: FileEntry) => {
    this.setState({ showiPhoneFullscreen: true, iPhoneFullscreenFile: file });
  };

  handleCloseiPhoneFullscreen = () => {
    this.setState({ showiPhoneFullscreen: false, iPhoneFullscreenFile: null });
  };

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentDidUpdate(prevProps: Record<string, never>, prevState: MainExplorerState) {
    // Only refresh children if we're not in slideshow mode or if showNSFW changed
    if ((prevState.selected !== this.state.selected && !this.state.slideshowRunning) || prevState.showNSFW !== this.state.showNSFW) {
      this.refreshChildren();
    }
    
    // Handle slideshow mode index synchronization and folder expansion
    if (this.state.selected !== prevState.selected && this.state.slideshowRunning) {
      const newIdx = this.state.slideshowFiles.findIndex(f => f.path === this.state.selected);
      if (newIdx !== -1) {
        this.setState({currentIdx: newIdx});
        
        // Expand parent folder for the new selected file
        if (this.state.selected && !this.state.selected.endsWith('/') && !this.state.selected.endsWith('\\')) {
          const parentFolder = this.state.selected.substring(0, Math.max(this.state.selected.lastIndexOf('/'), this.state.selected.lastIndexOf('\\')));
          if (parentFolder && this.sidebarRef.current && this.sidebarRef.current.expandFolderPath) {
            this.sidebarRef.current.expandFolderPath(parentFolder);
          }
        }
      } else {
        this.stopSlideshow();
      }
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.stopSlideshow();
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 's') {
      this.toggleSlideshow();
      return;
    }

    if (this.state.slideshowRunning) {
      const { currentIdx, slideshowFiles } = this.state;
      if (e.key === 'ArrowLeft') {
        const newIdx = Math.max(0, currentIdx - 1);
        this.setState({ currentIdx: newIdx, selected: slideshowFiles[newIdx].path });
      }
      if (e.key === 'ArrowRight') {
        const newIdx = Math.min(slideshowFiles.length - 1, currentIdx + 1);
        this.setState({ currentIdx: newIdx, selected: slideshowFiles[newIdx].path });
      }
      return;
    }

    const { currentIdx, files } = this.state;
    if (e.key === 'ArrowLeft') {
      this.stopSlideshow();
      const newIdx = Math.max(0, currentIdx - 1);
      this.setState({ currentIdx: newIdx, selected: files[newIdx]?.path });
    }
    if (e.key === 'ArrowRight') {
      this.stopSlideshow();
      const newIdx = Math.min(files.length - 1, currentIdx + 1);
      this.setState({ currentIdx: newIdx, selected: files[newIdx]?.path });
    }
  };

  handleSelect = (path: string) => {
    // Stop slideshow when user manually selects a different item
    if (this.state.slideshowRunning) {
      this.stopSlideshow();
    }
    this.setState({ selected: path });
  };

  handleSidebarRefresh = (fn: ()=>void) => {
    this.setState({ sidebarRefresh: fn });
  };


  // Call updateFileFlag on ExplorerSidebar via ref
  updateSidebarFileFlag = (filePath: string, nsfwFlagged: boolean) => {
    if (this.sidebarRef.current && this.sidebarRef.current.updateFileFlag) {
      this.sidebarRef.current.updateFileFlag(filePath, nsfwFlagged);
    }
  };

  refreshChildren = async () => {
    const { selected } = this.state;
    const folderToLoad = selected && !selected.endsWith('/') && !selected.endsWith('\\')
      ? selected.substring(0, Math.max(selected.lastIndexOf('/'), selected.lastIndexOf('\\'))) || ''
      : selected || '';
    const res = await fetch(`/api/children?folder=${encodeURIComponent(folderToLoad)}`);
    const data = await res.json();
    const children: FileEntry[] = data.children || [];
    let files = children.filter((c:FileEntry)=>c.type==='file');
    if (!this.state.showNSFW) files = files.filter((f:FileEntry)=>!f.nsfwFlagged);
    this.setState({ children, files }, () => {
      if (!this.state.slideshowRunning) {
        this.updateCurrentIdx();
      }
    });
  };

  updateCurrentIdx = () => {
    const { files, selected, currentIdx, slideshowRunning, slideshowFiles } = this.state;
    
    // In slideshow mode, use slideshowFiles array
    if (slideshowRunning) {
      const idx = selected ? slideshowFiles.findIndex(f => f.path === selected) : 0;
      this.setState({ currentIdx: Math.max(0, idx) });
      return;
    }
    
    // Regular mode logic
    let idx = 0;
    if (selected && !selected.endsWith('/') && !selected.endsWith('\\')) {
      const found = files.findIndex(f=>f.path===selected);
      idx = found !== -1 ? found : 0;
    } else if (files.length===0 || currentIdx>=files.length) {
      idx = 0;
    }
    this.setState({ currentIdx: idx });
  };

  handleDelete = (file: string) => {
    this.setState({ confirmDelete: file });
  };

  confirmDeleteFile = async () => {
    const { confirmDelete, files, currentIdx, sidebarRefresh } = this.state;
    if (!confirmDelete) return;
    const currentPath = files[currentIdx]?.path;
    const deletingCurrent = currentPath === confirmDelete;
    // Determine next selection: next file if exists, else previous, else none
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
    await fetch(`/api/delete?file=${encodeURIComponent(confirmDelete)}`, { method: 'DELETE' });
    // Clear confirm and update selection, then refresh
    this.setState({ confirmDelete: null, selected: newSelected }, () => {
      this.refreshChildren();
      if (sidebarRefresh) sidebarRefresh();
    });
  };

  handleFlagNSFW = async (file: string, flag: boolean) => {
    const endpoint = flag ? 'flag-nsfw' : 'unflag-nsfw';
    await fetch(`/api/${endpoint}`, { method: 'POST', body: JSON.stringify({ file }), headers: { 'Content-Type':'application/json' } });
    // Targeted update in sidebar
    this.updateSidebarFileFlag(file, flag);
    // Also update in local files state for viewer and refresh selected if needed
    this.setState(prev => {
      const updatedFiles = prev.files.map(f => f.path === file ? { ...f, nsfwFlagged: flag } : f);
      const isSelected = prev.selected === file;
      return {
        files: updatedFiles,
        selected: isSelected ? file : prev.selected
      };
    });
  };

  render() {
    const { files, currentIdx, showNSFW, confirmDelete, selected, showiPhoneFullscreen, iPhoneFullscreenFile, sidebarVisible, slideshowRunning, children, slideshowFiles, slideshowLoading } = this.state;
    // const isFolderSelected = selected && children.some(child => child.type === 'directory' && child.path === selected);
    
    // In slideshow mode, use slideshowFiles array, otherwise use regular files array
    const activeFiles = slideshowRunning ? slideshowFiles : files;
    const file = activeFiles[currentIdx];
    
    // folder is selected if select is a directory like /root/folder1/subfolder, basically if the selected does not contains a file extension
    const lastPartOfSelected = selected ? selected.split('/').pop() || '' : '';
    const isFolderSelected = !lastPartOfSelected.includes('.');
    let isImage = false;
    let isVideo = false;
    let isHeic = false;
    if (!isFolderSelected) {
      isImage = file && ['jpeg','jpg','png','gif','bmp','webp'].includes(file.name.split('.').pop()?.toLowerCase()!);
      isVideo = file && ['mp4','mpeg','wav','mov','avi','webm'].includes(file.name.split('.').pop()?.toLowerCase()!);
      isHeic = file && file.name.split('.').pop()?.toLowerCase() === 'heic';
    }
    


    return (
      <React.Fragment>
        {showiPhoneFullscreen && iPhoneFullscreenFile && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'black', zIndex: 9999 }}>
            <img
              src={`/api/view?file=${encodeURIComponent(iPhoneFullscreenFile.path)}`}
              alt={iPhoneFullscreenFile.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            <button
              onClick={this.handleCloseiPhoneFullscreen}
              style={{ position: 'absolute', top: '20px', right: '20px', color: 'white', background: 'none', border: 'none', fontSize: '30px', cursor: 'pointer' }}
            >
              &times;
            </button>
          </div>
        )}
      <div className="main-explorer flex flex-row w-full h-full overflow-hidden relative">
        {sidebarVisible && <React.Fragment>
          {/* Sidebar with resizable width, flexbox only, no z-index, no absolute, no overflow */}
          <div
            className="main-explorer-sidebar flex flex-col bg-white p-0 m-0"
            style={{ flex: `0 0 ${this.state.sidebarWidth}px`, minWidth: this.sidebarMinWidth, maxWidth: this.sidebarMaxWidth }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <ExplorerSidebar
                ref={this.sidebarRef}
                selected={selected}
                onSelect={this.handleSelect}
                onRefresh={this.refreshChildren}
                onSidebarRefresh={this.handleSidebarRefresh}
                showNSFW={showNSFW}
                onToggleNSFW={() => this.setState({ showNSFW: !showNSFW })}
                style={{ width: '100%', height: '100%', flex: 1, padding: 0, margin: 0 }}
              />
            </div>
          </div>
          {/* Draggable divider, always visible and on top, not inside sidebar */}
          <div
            className="sidebar-resize-handle"
            style={{ position: 'absolute', top: 0, left: this.state.sidebarWidth - 3, height: '100%', width: '6px', cursor: 'col-resize', zIndex: 100, userSelect: 'none', background: 'rgba(80,80,80,0.18)', borderRight: '2px solid #888' }}
            onMouseDown={this.handleSidebarMouseDown}
            onTouchStart={this.handleSidebarTouchStart}
          />
        </React.Fragment>}
        {/* Main content, flex-1, always fills remaining space */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-shrink-0 p-4 bg-gray-800 text-white image-viewer-header flex items-center">
            <button onClick={this.toggleSidebar} className="icon-button mr-4" title={sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}>{sidebarVisible ? '‹' : '›'}</button>
            <h1 className="text-lg font-semibold">Image Viewer</h1>
          </div>
          <div className="flex-1 overflow-auto">
            {isFolderSelected ? (
              <div className="p-4 text-center text-gray-500">Select an item to see the image</div>
            ) : activeFiles.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No files found</div>
            ) : (
              <ImageViewer
                files={isFolderSelected ? [] : activeFiles}
                currentIdx={isFolderSelected ? -1 : currentIdx}
                setCurrentIdx={(idx) => {
                  this.stopSlideshow();
                  this.setState({ currentIdx: idx });
                }}
                showNSFW={showNSFW}
                onDelete={this.handleDelete}
                onFlagNSFW={this.handleFlagNSFW}
                onFileChange={(file) => this.setState({ selected: file })}
                onShowiPhoneFullscreen={this.handleShowiPhoneFullscreen}
                onToggleSlideshow={this.toggleSlideshow}
                slideshowRunning={slideshowRunning}
              />
            )}
          </div>
        </div>
        {confirmDelete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
              <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
              <p className="text-gray-700 mb-4">Are you sure you want to delete this file?</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => this.setState({ confirmDelete: null })}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={this.confirmDeleteFile}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Slideshow Loading Overlay */}
        {slideshowLoading && (
          <div 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100vw', 
              height: '100vh', 
              backgroundColor: 'rgba(0, 0, 0, 0.7)', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              zIndex: 9998,
              pointerEvents: 'none' 
            }}
          >
            <div style={{ 
              color: 'white', 
              fontSize: '24px', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>Preparing</span>
              <div style={{ 
                display: 'inline-flex', 
                gap: '4px' 
              }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: 'white', 
                  borderRadius: '50%',
                  animation: 'dot-bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0s'
                }}></div>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: 'white', 
                  borderRadius: '50%',
                  animation: 'dot-bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0.16s'
                }}></div>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: 'white', 
                  borderRadius: '50%',
                  animation: 'dot-bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0.32s'
                }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      </React.Fragment>
    );
  }
}

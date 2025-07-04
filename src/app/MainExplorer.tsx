"use client";
/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element, @typescript-eslint/no-non-null-asserted-optional-chain */
import React from 'react';
import ExplorerSidebar from './ExplorerSidebar';

// Class-based ImageViewer
interface ImageViewerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  files: any[];
  currentIdx: number;
  setCurrentIdx: (idx: number) => void;
  showNSFW: boolean;
  onDelete: (file: string) => void;
  onFlagNSFW: (file: string, flag: boolean) => void;
  onFileChange: (file: string) => void;
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
    const newIdx = currentIdx - 1;
    setCurrentIdx(newIdx);
    if (files[newIdx]) onFileChange(files[newIdx].path);
  };

  handleNext = () => {
    const { currentIdx, files, setCurrentIdx, onFileChange } = this.props;
    const newIdx = currentIdx + 1;
    setCurrentIdx(newIdx);
    if (files[newIdx]) onFileChange(files[newIdx].path);
  };

  // Ref for fullscreen
  private imageRef = React.createRef<HTMLImageElement>();

  // Enter fullscreen mode on image
  handleFullscreen = () => {
    const el = this.imageRef.current;
    if (el) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((el as any).msRequestFullscreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (el as any).msRequestFullscreen();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((el as any).webkitRequestFullscreen) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (el as any).webkitRequestFullscreen();
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
          </span>        <button onClick={() => window.open(`/api/download?file=${encodeURIComponent(file.path)}`)} title="Download">⬇️</button>
          <button onClick={this.handleFullscreen} title="Full Screen">⛶</button>
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  files: any[];
  currentIdx: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any[];
  sidebarRefresh: (()=>void)|null;
  expanded: Record<string, boolean>;
}
// eslint-disable-next-line
export default class MainExplorer extends React.Component<{}, MainExplorerState> {
  state: MainExplorerState = { selected:null, showNSFW:false, confirmDelete:null, files: [], currentIdx:0, children: [], sidebarRefresh:null, expanded: {} };

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentDidUpdate(prevProps: any, prevState: MainExplorerState) {
    if (prevState.selected !== this.state.selected || prevState.showNSFW !== this.state.showNSFW) {
      this.refreshChildren();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (e: KeyboardEvent) => {
    const { currentIdx, files } = this.state;
    if (e.key === 'ArrowLeft' && currentIdx>0) this.setState({ currentIdx: currentIdx-1 });
    if (e.key === 'ArrowRight' && currentIdx<files.length-1) this.setState({ currentIdx: currentIdx+1 });
  };

  handleSelect = (path: string) => {
    this.setState({ selected: path });
  };

  handleSidebarRefresh = (fn: ()=>void) => {
    this.setState({ sidebarRefresh: fn });
  };

  refreshChildren = async () => {
    const { selected } = this.state;
    const folderToLoad = selected && !selected.endsWith('/') && !selected.endsWith('\\')
      ? selected.substring(0, Math.max(selected.lastIndexOf('/'), selected.lastIndexOf('\\'))) || ''
      : selected || '';
    const res = await fetch(`/api/children?folder=${encodeURIComponent(folderToLoad)}`);
    const data = await res.json();
    const children = data.children || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let files = children.filter((c:any)=>c.type==='file');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!this.state.showNSFW) files = files.filter((f:any)=>!f.nsfwFlagged);
    this.setState({ children, files }, this.updateCurrentIdx);
  };

  updateCurrentIdx = () => {
    const { files, selected, currentIdx } = this.state;
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
    const { files, currentIdx, sidebarRefresh } = this.state;
    const currentPath = files[currentIdx]?.path;
    if (currentPath) this.refreshChildren();
    if (sidebarRefresh) sidebarRefresh();
  };

  render() {
    const { files, currentIdx, showNSFW, confirmDelete, selected } = this.state;
    const file = files[currentIdx];
    const isImage = file && ['jpeg','jpg','png','gif','bmp','webp'].includes(file.name.split('.').pop()?.toLowerCase()!);
    const isVideo = file && ['mp4','mpeg','wav','mov','avi','webm'].includes(file.name.split('.').pop()?.toLowerCase()!);
    const isHeic = file && file.name.split('.').pop()?.toLowerCase() === 'heic';

    return (
      <div className="main-explorer flex-1 flex overflow-hidden">
        <ExplorerSidebar 
          selected={selected}
          onSelect={this.handleSelect}
          onRefresh={this.refreshChildren}
          onSidebarRefresh={this.handleSidebarRefresh}
          showNSFW={showNSFW}
          onToggleNSFW={() => this.setState({ showNSFW: !showNSFW })}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 p-4 bg-gray-800 text-white">
            <h1 className="text-lg font-semibold">Image Viewer</h1>
          </div>
          <div className="flex-1 overflow-auto">
            {files.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No files found</div>
            ) : (
              <ImageViewer
                files={files}
                currentIdx={currentIdx}
                setCurrentIdx={(idx) => this.setState({ currentIdx: idx })}
                showNSFW={showNSFW}
                onDelete={this.handleDelete}
                onFlagNSFW={this.handleFlagNSFW}
                onFileChange={(file) => this.setState({ selected: file })}
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
      </div>
    );
  }
}

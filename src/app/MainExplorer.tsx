"use client";
import React from 'react';
import ExplorerSidebar from './ExplorerSidebar';

// Class-based ImageViewer
interface ImageViewerProps {
  files: any[];
  currentIdx: number;
  setCurrentIdx: (idx: number) => void;
  showNSFW: boolean;
  onDelete: (file: string) => void;
  onFlagNSFW: (file: string, flag: boolean) => void;
  onFileChange: (file: string) => void;
}
interface ImageViewerState { metadata: any; }
class ImageViewer extends React.Component<ImageViewerProps, ImageViewerState> {
  state: ImageViewerState = { metadata: null };

  fetchMetadata(path: string) {
    fetch(`/api/metadata?file=${encodeURIComponent(path)}`)
      .then(res => res.json())
      .then(data => this.setState({ metadata: data.metadata }))
      .catch(console.error);
  }

  componentDidMount() {
    const file = this.props.files[this.props.currentIdx];
    if (file) this.fetchMetadata(file.path);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentDidUpdate(prevProps: ImageViewerProps) {
    const prevFile = prevProps.files[prevProps.currentIdx];
    const file = this.props.files[this.props.currentIdx];
    if (file && file.path !== prevFile?.path) {
      this.fetchMetadata(file.path);
      this.props.onFileChange(file.path);
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

  render() {
    const { files, currentIdx, showNSFW, onDelete, onFlagNSFW } = this.props;
    const { metadata } = this.state;
    const file = files[currentIdx];
    if (!file) return <div className="no-image-selected">No image selected</div>;
    if (file.nsfwFlagged && !showNSFW) return <div className="no-image-selected">NSFW content hidden</div>;
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isImage = ['jpeg','jpg','png','gif','bmp','webp'].includes(ext!);
    const isVideo = ['mp4','mpeg','wav','mov','avi','webm'].includes(ext!);
    const isHeic = ext === 'heic';

    return (
      <div className="image-viewer relative z-10">
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
          <button onClick={() => window.open(`/api/view?file=${encodeURIComponent(file.path)}`, '_blank')} title="Full Page">🖥️</button>
          <button onClick={() => onFlagNSFW(file.path, !file.nsfwFlagged)} title={file.nsfwFlagged ? "Unflag NSFW" : "Flag NSFW"}>
            {file.nsfwFlagged ? '🔓' : '🔒'}
          </button>
          <button onClick={() => onDelete(file.path)} title="Delete">🗑️</button>
        </div>
        {isImage && <img src={`/api/view?file=${encodeURIComponent(file.path)}`} alt={file.name} className="image-viewer-img" />}
        {isVideo && <video src={`/api/view?file=${encodeURIComponent(file.path)}`} controls className="image-viewer-video" />}
        {isHeic && (
          <div className="heic-notice">
            <p>HEIC files are not directly supported in browsers.</p>
            <button onClick={() => window.open(`/api/download?file=${encodeURIComponent(file.path)}`, '_blank')} title="Download to view">
              📥 Download to View
            </button>
          </div>
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
  files: any[];
  currentIdx: number;
  children: any[];
  sidebarRefresh: (()=>void)|null;
}
export default class MainExplorer extends React.Component<{}, MainExplorerState> {
  state: MainExplorerState = { selected:null, showNSFW:false, confirmDelete:null, files: [], currentIdx:0, children: [], sidebarRefresh:null };

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

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
    let files = children.filter((c:any)=>c.type==='file');
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
    await fetch(`/api/delete?file=${encodeURIComponent(confirmDelete)}`, { method: 'DELETE' });
    this.setState({ confirmDelete: null });
    this.refreshChildren();
    if (sidebarRefresh) sidebarRefresh();
    if (!deletingCurrent && currentPath) this.setState({ selected: currentPath });
  };

  handleFlagNSFW = async (file: string, flag: boolean) => {
    const endpoint = flag ? 'flag-nsfw' : 'unflag-nsfw';
    await fetch(`/api/${endpoint}`, { method: 'POST', body: JSON.stringify({ file }), headers: { 'Content-Type':'application/json' } });
    const { files, currentIdx, sidebarRefresh } = this.state;
    const currentPath = files[currentIdx]?.path;
    if (currentPath) this.setState({ selected: currentPath });
    this.refreshChildren();
    if (sidebarRefresh) sidebarRefresh();
  };

  toggleShowNSFW = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ showNSFW: e.target.checked });
  };

  render() {
    const { selected, showNSFW, files, currentIdx, confirmDelete } = this.state;
    return (
      <div className="explorer-main">
        <ExplorerSidebar
          onSelect={this.handleSelect}
          selected={selected}
          showNSFW={showNSFW}
          onRefreshReady={this.handleSidebarRefresh}
        />
        <div className="explorer-content">
          <div className="explorer-toolbar">
            <label><input type="checkbox" checked={showNSFW} onChange={this.toggleShowNSFW} /> Show NSFW</label>
          </div>
          <div className="explorer-viewer">
            <ImageViewer
              files={files}
              currentIdx={currentIdx}
              setCurrentIdx={(idx)=>this.setState({currentIdx:idx})}
              showNSFW={showNSFW}
              onDelete={this.handleDelete}
              onFlagNSFW={this.handleFlagNSFW}
              onFileChange={(path)=>this.setState({selected:path})}
            />
          </div>
        </div>
        {confirmDelete && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-box">
              <div className="delete-confirm-message">Are you sure you want to delete this file?</div>
              <div className="delete-confirm-actions">
                <button onClick={()=>this.setState({confirmDelete:null})}>Cancel</button>
                <button onClick={this.confirmDeleteFile} className="delete-confirm-danger">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

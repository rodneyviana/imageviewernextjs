"use client";
import React, { useState } from 'react';
import ExplorerSidebar from './ExplorerSidebar';
import { useChildren, useMetadata } from './hooks';

function ImageViewer({ files, currentIdx, setCurrentIdx, showNSFW, onDelete, onFlagNSFW, onFileChange }: any) {
  const file = files[currentIdx];
  
  // All hooks must be called before any early returns
  const { metadata } = useMetadata(file?.path);
  
  // Debug log to track file changes
  React.useEffect(() => {
    if (file) {
      console.log('ImageViewer - Current file:', file.name, 'Path:', file.path, 'NSFW:', file.nsfwFlagged, 'Index:', currentIdx, 'Total files:', files.length);
    }
  }, [file?.path, file?.nsfwFlagged, currentIdx, files.length]);
  
  // Early returns after all hooks are called
  if (!file) return <div className="no-image-selected">No image selected</div>;
  
  const ext = file.name.split('.').pop()?.toLowerCase();
  const isImage = ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp'].includes(ext!);
  const isVideo = ['mp4', 'mpeg', 'wav', 'mov', 'avi', 'webm'].includes(ext!);
  const isHeic = ext === 'heic';
  const nsfwFlagged = file.nsfwFlagged;
  
  // Don't show NSFW content if showNSFW is false
  if (nsfwFlagged && !showNSFW) {
    return <div className="no-image-selected">NSFW content hidden</div>;
  }  const handlePrevious = () => {
    const newIdx = currentIdx - 1; // Go to previous file (lower index)
    setCurrentIdx(newIdx);
    if (files[newIdx]) {
      onFileChange(files[newIdx].path);
    }
  };

  const handleNext = () => {
    const newIdx = currentIdx + 1; // Go to next file (higher index)
    setCurrentIdx(newIdx);
    if (files[newIdx]) {
      onFileChange(files[newIdx].path);
    }
  };
  
  return (
    <div className="image-viewer" style={{ position: 'relative', zIndex: 1 }}>
      <div className="image-viewer-actions">        <button 
          onClick={handlePrevious} 
          title="Previous"
          disabled={currentIdx <= 0}
          style={{ opacity: currentIdx <= 0 ? 0.5 : 1 }}
        >
          ⬅️
        </button>
        <button 
          onClick={handleNext} 
          title="Next"
          disabled={currentIdx >= files.length - 1}
          style={{ opacity: currentIdx >= files.length - 1 ? 0.5 : 1 }}
        >
          ➡️
        </button>
        <span style={{ margin: '0 10px', fontSize: '12px' }}>
          {currentIdx + 1} of {files.length}
        </span>        <button onClick={() => window.open(`/api/download?file=${encodeURIComponent(file.path)}`)} title="Download">⬇️</button>
        <button onClick={() => window.open(`/api/view?file=${encodeURIComponent(file.path)}`, '_blank')} title="Full Page">🖥️</button><button onClick={() => onFlagNSFW(file.path, !nsfwFlagged)} title={nsfwFlagged ? "Unflag NSFW" : "Flag NSFW"}>
          {nsfwFlagged ? '🔓' : '🔒'} {/* Current file: {file.name} */}
        </button>
        <button onClick={() => onDelete(file.path)} title="Delete">🗑️</button>      </div>      {isImage && <img src={`/api/view?file=${encodeURIComponent(file.path)}`} alt={file.name} className="image-viewer-img" />}
      {isVideo && <video src={`/api/view?file=${encodeURIComponent(file.path)}`} controls className="image-viewer-video" />}
      {isHeic && (
        <div className="heic-notice">
          <p>HEIC files are not directly supported in browsers.</p>
          <button onClick={() => window.open(`/api/download?file=${encodeURIComponent(file.path)}`, '_blank')} title="Download to view">
            📥 Download to View
          </button>
        </div>
      )}      <div className="image-viewer-meta">
        <div className="image-viewer-meta-title">File: {file.name}</div>
        <div className="image-viewer-meta-title">Metadata</div>
        {metadata ? (typeof metadata === 'object' ? <div className="metadata-json">{JSON.stringify(metadata, null, 2)}</div> : <div>{metadata}</div>) : <div>No metadata</div>}
      </div>
    </div>
  );
}

export default function MainExplorer() {  const [selected, setSelected] = useState<string | null>(null);
  const [showNSFW, setShowNSFW] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
    // Determine what folder to load children for
  const folderToLoad = selected && !selected.endsWith('/') && !selected.endsWith('\\') ? 
    selected.substring(0, Math.max(selected.lastIndexOf('/'), selected.lastIndexOf('\\'))) || '' : 
    selected || '';
  
  const { children, refresh, isFile } = useChildren(folderToLoad);
React.useEffect(() => {
    if (children) {      let filtered = children.filter((c: any) => c.type === 'file');
      if (!showNSFW) filtered = filtered.filter((f: any) => !f.nsfwFlagged);
      
      // API already returns sorted data, no need to sort again
      setFiles(filtered);
      console.log('=== Files Updated ===');
      console.log('New files array:', filtered.map(f => f.name));
      console.log('Selected file:', selected);
      
      // If a specific file was selected, find its index in the filtered array
      if (selected && !selected.endsWith('/') && !selected.endsWith('\\')) {
        const fileIndex = filtered.findIndex((f: any) => f.path === selected);
        console.log('Looking for selected file in new array, found at index:', fileIndex);
        if (fileIndex !== -1) {
          setCurrentIdx(fileIndex);
          console.log('Set currentIdx to:', fileIndex, 'for file:', filtered[fileIndex].name);
        } else {
          // File not found in filtered array (maybe NSFW and showNSFW is false)
          console.log('Selected file not found in filtered array, setting to 0');
          setCurrentIdx(0);
        }
      } else {
        // Only reset currentIdx if files array actually changed or is empty
        if (filtered.length === 0 || currentIdx >= filtered.length) {
          setCurrentIdx(0);
        }
      }
    }  }, [children, showNSFW, selected]);

  // Add keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIdx > 0) {
        const newIdx = currentIdx - 1; // Previous (earlier file)
        setCurrentIdx(newIdx);
        if (files[newIdx]) {
          setSelected(files[newIdx].path);
        }
      } else if (e.key === 'ArrowRight' && currentIdx < files.length - 1) {
        const newIdx = currentIdx + 1; // Next (later file)
        setCurrentIdx(newIdx);
        if (files[newIdx]) {
          setSelected(files[newIdx].path);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, files]);
  const handleDelete = async (file: string) => {
    console.log('=== Delete Action ===');
    console.log('Target file:', file);
    console.log('Current displayed file:', files[currentIdx]?.name, files[currentIdx]?.path);
    console.log('Are they the same?', file === files[currentIdx]?.path);
    setConfirmDelete(file);
  };  const confirmDeleteFile = async () => {
    if (confirmDelete) {
      // Store current file info before deletion
      const currentFile = files[currentIdx];
      const currentFilePath = currentFile?.path;
      const deletingCurrentFile = currentFile && confirmDelete === currentFile.path;
      
      console.log('=== Delete Confirmation ===');
      console.log('Deleting:', confirmDelete);
      console.log('Current file:', currentFilePath);
      console.log('Deleting current file?', deletingCurrentFile);
      
      await fetch(`/api/delete?file=${encodeURIComponent(confirmDelete)}`, { method: 'DELETE' });
      
      // Always preserve current file selection after refresh
      if (currentFilePath && !deletingCurrentFile) {
        setSelected(currentFilePath);
      } else if (deletingCurrentFile && files.length > 1) {
        // If deleting current file, select the next one (or previous if at end)
        const nextIdx = currentIdx < files.length - 1 ? currentIdx : currentIdx - 1;
        if (files[nextIdx] && files[nextIdx].path !== confirmDelete) {
          setSelected(files[nextIdx].path);
        }
      }      setConfirmDelete(null);
      refresh(); // Refresh to sync with server state
      
      // Also refresh the sidebar to remove deleted file from tree
      console.log('Attempting to refresh sidebar, sidebarRefresh:', typeof sidebarRefresh, sidebarRefresh);
      if (sidebarRefresh && typeof sidebarRefresh === 'function') {
        try {
          sidebarRefresh();
        } catch (error) {
          console.error('Error calling sidebarRefresh:', error);
        }
      } else {
        console.warn('sidebarRefresh is not available, type:', typeof sidebarRefresh);
      }
    }
  };const handleFlagNSFW = async (file: string, flag: boolean) => {
    console.log('=== NSFW Flag Action ===');
    console.log('Target file:', file);
    console.log('Flag to:', flag);
    console.log('Current displayed file:', files[currentIdx]?.name, files[currentIdx]?.path);
    console.log('Are they the same?', file === files[currentIdx]?.path);
    
    // Store current file info before the API call
    const currentFile = files[currentIdx];
    const currentFilePath = currentFile?.path;
    
    if (flag) {
      await fetch('/api/flag-nsfw', { method: 'POST', body: JSON.stringify({ file }), headers: { 'Content-Type': 'application/json' } });
    } else {
      await fetch('/api/unflag-nsfw', { method: 'POST', body: JSON.stringify({ file }), headers: { 'Content-Type': 'application/json' } });
    }
      // Always preserve the selection of the current file after refresh
    console.log('Preserving selection for:', currentFilePath);
    if (currentFilePath) {
      setSelected(currentFilePath);
    }
    
    refresh();
    
    // Also refresh the sidebar to update NSFW flags in tree
    console.log('Attempting to refresh sidebar after NSFW flag, sidebarRefresh:', typeof sidebarRefresh, sidebarRefresh);
    if (sidebarRefresh && typeof sidebarRefresh === 'function') {
      try {
        sidebarRefresh();
      } catch (error) {
        console.error('Error calling sidebarRefresh after NSFW flag:', error);
      }
    } else {
      console.warn('sidebarRefresh is not available for NSFW flag, type:', typeof sidebarRefresh);
    }
  };  // Reference to sidebar refresh function
  const [sidebarRefresh, setSidebarRefresh] = useState<(() => void) | null>(null);
  
  // Debug when sidebarRefresh gets set
  React.useEffect(() => {
    console.log('MainExplorer: sidebarRefresh updated:', typeof sidebarRefresh, !!sidebarRefresh);
  }, [sidebarRefresh]);

  return (
    <div className="explorer-main">
      <ExplorerSidebar 
        onSelect={setSelected} 
        selected={selected} 
        showNSFW={showNSFW} 
        onRefreshReady={setSidebarRefresh}
      />
      <div className="explorer-content">
        <div className="explorer-toolbar">
          <label><input type="checkbox" checked={showNSFW} onChange={e => setShowNSFW(e.target.checked)} /> Show NSFW</label>
        </div>        <div className="explorer-viewer">
          <ImageViewer 
            files={files} 
            currentIdx={currentIdx} 
            setCurrentIdx={setCurrentIdx} 
            showNSFW={showNSFW} 
            onDelete={handleDelete} 
            onFlagNSFW={handleFlagNSFW}
            onFileChange={setSelected}
          />
        </div>
      </div>
      {confirmDelete && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-box">
            <div className="delete-confirm-message">Are you sure you want to delete this file?</div>
            <div className="delete-confirm-actions">
              <button onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button onClick={confirmDeleteFile} className="delete-confirm-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

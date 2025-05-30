"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useFolders } from './hooks';

function FolderTree({ tree, onSelect, selected, showNSFW, onCacheClearReady }: any) {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [folderChildren, setFolderChildren] = useState<{ [key: string]: any[] }>({});
  
  // Expose cache clearing function to parent
  const clearCache = React.useCallback(() => {
    console.log('FolderTree: Clearing folderChildren cache');
    setFolderChildren({});
  }, []);
  
  React.useEffect(() => {
    if (onCacheClearReady) {
      onCacheClearReady(clearCache);
    }
  }, [onCacheClearReady, clearCache]);
  
  // Clear folderChildren cache when showNSFW changes to force refresh of NSFW flags
  React.useEffect(() => {
    clearCache();
  }, [showNSFW, clearCache]);
  
  const handleToggle = async (path: string) => {
    const newExpanded = { ...expanded, [path]: !expanded[path] };
    setExpanded(newExpanded);
      // If opening a folder and we don't have its children yet, load them
    if (newExpanded[path] && !folderChildren[path]) {      try {
        const res = await fetch(`/api/children?folder=${encodeURIComponent(path)}`);
        const data = await res.json();
        
        // API already returns sorted data, no need to sort again
        const children = data.children || [];
        
        setFolderChildren(prev => ({ ...prev, [path]: children }));
      } catch (e) {
        console.error('Failed to load folder children:', e);
      }
    }
  };

  const getIndentClass = (level: number) => `folder-indent-level-${Math.min(level, 10)}`;

  const renderNode = (node: any, level = 0) => {
    if (node.type === 'folder') {
      const isOpen = expanded[node.path];
      const children = folderChildren[node.path] || node.children || [];
      return (
        <div key={node.path} className={getIndentClass(level)}>          <div
            className={selected === node.path ? 'folder-selected folder-row' : 'folder folder-row'}
            onClick={() => handleToggle(node.path)}
          >
            <span className="folder-icon">{isOpen ? '📂' : '📁'}</span>
            <span onClick={e => { e.stopPropagation(); onSelect(node.path); }}>{node.name}</span>
          </div>
          {isOpen && children.map((child: any) => renderNode(child, level + 1))}
        </div>
      );
    } else if (node.type === 'file') {
      if (!showNSFW && node.nsfwFlagged) return null;
      const icon = node.nsfwFlagged ? '🔒' : '🖼️';
      return (
        <div key={node.path} className={getIndentClass(level + 2) + ' ' + (selected === node.path ? 'file-selected' : 'file')} onClick={() => onSelect(node.path)}>
          {icon} {node.name}
        </div>
      );
  }
    return null;
  };
    return <div className="explorer-tree-container">{tree.map((node: any) => renderNode(node, 0))}</div>;
}

export default function ExplorerSidebar({ onSelect, selected, showNSFW, onRefreshReady }: any) {
  const { tree, loading, refresh } = useFolders();
  const [clearFolderCache, setClearFolderCache] = useState<(() => void) | null>(null);
  
  // Enhanced refresh that clears both tree and folder cache
  const fullRefresh = React.useCallback(() => {
    if (clearFolderCache) {
      clearFolderCache();
    }
    refresh();
  }, [refresh, clearFolderCache]);
    // Expose refresh function to parent component
  React.useEffect(() => {
    console.log('ExplorerSidebar: Setting up refresh function for parent');
    if (onRefreshReady && fullRefresh) {
      onRefreshReady(fullRefresh);
    }
  }, [onRefreshReady, fullRefresh]);
  
  return (
    <div className="explorer-sidebar">
      <div className="explorer-sidebar-header">
        <span className="explorer-sidebar-title">Root</span>
        <button onClick={fullRefresh} title="Refresh">🔄</button>
      </div>
      {loading ? <div>Loading...</div> : <FolderTree tree={tree} onSelect={onSelect} selected={selected} showNSFW={showNSFW} onCacheClearReady={setClearFolderCache} />}
    </div>
  );
}

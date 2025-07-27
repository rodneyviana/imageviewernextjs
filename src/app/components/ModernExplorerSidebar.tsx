'use client';

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

interface FileEntry {
  path: string;
  name: string;
  type: 'file' | 'folder';
  flagged: boolean;
}

export interface ModernExplorerSidebarRef {
  expandFolderPath?: (path: string) => void;
  updateFileFlag: (file: string, flag: boolean) => void;
}

interface ModernExplorerSidebarProps {
  selected: string | null;
  onSelect: (path: string) => void;
  onRefresh: () => void;
  onSidebarRefresh: (fn: () => void) => void;
  showFlagged: boolean;
  onToggleFlagged: () => void;
  visible: boolean;
  width: number; // Width controlled by parent
}

const ModernExplorerSidebar = forwardRef<ModernExplorerSidebarRef, ModernExplorerSidebarProps>(
  ({ selected, onSelect, onRefresh, onSidebarRefresh, showFlagged, onToggleFlagged, visible, width }, ref) => {
  const [tree, setTree] = useState<FileEntry[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderContents, setFolderContents] = useState<Record<string, FileEntry[]>>({});
  const [loading, setLoading] = useState(false);    const refreshSidebar = useCallback(async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/explorer');
        const data = await response.json();
        setTree(data.tree || []);
      } catch (error) {
        console.error('Failed to load explorer tree:', error);
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      refreshSidebar();
      onSidebarRefresh(refreshSidebar);
    }, [refreshSidebar, onSidebarRefresh]);

    const loadFolderContents = useCallback(async (folderPath: string) => {
      // Check if contents are already loaded
      setFolderContents(prevContents => {
        if (prevContents[folderPath]) {
          return prevContents;
        }
        
        // Load contents asynchronously
        (async () => {
          try {
            const response = await fetch(`/api/children?folder=${encodeURIComponent(folderPath)}`);
            const data = await response.json();
            const children = data.children || [];
            
            setFolderContents(prev => ({
              ...prev,
              [folderPath]: children
            }));
          } catch (error) {
            console.error('Error loading folder contents:', error);
          }
        })();
        
        return prevContents;
      });
    }, []);

    const toggleFolder = useCallback((folderPath: string) => {
      const newExpanded = new Set(expandedFolders);
      
      if (newExpanded.has(folderPath)) {
        newExpanded.delete(folderPath);
      } else {
        newExpanded.add(folderPath);
        loadFolderContents(folderPath);
      }
      
      setExpandedFolders(newExpanded);
    }, [expandedFolders, loadFolderContents]);

    const expandFolderPath = useCallback((path: string) => {
      const newExpanded = new Set(expandedFolders);
      newExpanded.add(path);
      setExpandedFolders(newExpanded);
      loadFolderContents(path);
    }, [expandedFolders, loadFolderContents]);

    const updateFileFlag = useCallback((file: string, flag: boolean) => {
      // Update tree
      setTree(prevTree => updateTreeFlag(prevTree, file, flag));
      
      // Update folder contents
      setFolderContents(prevContents => {
        const newContents = { ...prevContents };
        Object.keys(newContents).forEach(folderPath => {
          newContents[folderPath] = newContents[folderPath].map(item => 
            item.path === file ? { ...item, flagged: flag } : item
          );
        });
        return newContents;
      });
    }, []);

    const updateTreeFlag = (items: FileEntry[], file: string, flag: boolean): FileEntry[] => {
      return items.map(item => {
        if (item.path === file) {
          return { ...item, flagged: flag };
        }
        return item;
      });
    };

    useImperativeHandle(ref, () => ({
      expandFolderPath,
      updateFileFlag
    }));

    const getFileType = useCallback((fileName: string) => {
      const ext = fileName.toLowerCase().split('.').pop();
      if (!ext) return 'file';
      
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'heic', 'heif'];
      const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];
      
      if (imageExts.includes(ext)) return 'image';
      if (videoExts.includes(ext)) return 'video';
      return 'file';
    }, []);

    const getFileIconClass = useCallback((item: FileEntry) => {
      if (item.type === 'folder') {
        const baseClass = expandedFolders.has(item.path) ? 'fas fa-folder-open' : 'fas fa-folder';
        return `${baseClass} modern-folder-icon`;
      }
      
      // If item is flagged and we're showing flagged content, show lock icon
      if (item.flagged && showFlagged) {
        return 'fas fa-lock modern-file-icon flagged';
      }
      
      const fileType = getFileType(item.name);
      switch (fileType) {
        case 'image':
          return 'fas fa-image modern-file-icon image';
        case 'video':
          return 'fas fa-video modern-file-icon video';
        default:
          return 'fas fa-file modern-file-icon';
      }
    }, [expandedFolders, getFileType, showFlagged]);

    const getFileIcon = useCallback((item: FileEntry) => {
      const iconClass = getFileIconClass(item);
      
      return (
        <i 
          className={iconClass}
          style={{
            minWidth: '16px',
            width: '16px',
            textAlign: 'center',
            marginRight: '8px'
          }}
        />
      );
    }, [getFileIconClass]);

    const filterItems = useCallback((items: FileEntry[]) => {
      return items.filter(item => {
        if (!showFlagged && item.flagged) return false;
        return true;
      });
    }, [showFlagged]);

    const renderTreeItem = useCallback((item: FileEntry, level: number = 0) => {
      const isSelected = selected === item.path;
      const isExpanded = expandedFolders.has(item.path);
      const children = folderContents[item.path] || [];
      const filteredChildren = filterItems(children);

      return (
        <div key={item.path} className="tree-item">
          <div
            className={`tree-item-content ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
            onClick={() => {
              if (item.type === 'folder') {
                toggleFolder(item.path);
              } else {
                onSelect(item.path);
              }
            }}
          >
            {getFileIcon(item)}
            <span 
              className={`file-name ${isSelected ? 'selected' : ''}`}
              title={item.name}
            >
              {item.name}
            </span>
          </div>
          
          {item.type === 'folder' && isExpanded && filteredChildren.length > 0 && (
            <div className="tree-children">
              {filteredChildren.map(child => renderTreeItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }, [selected, expandedFolders, folderContents, filterItems, toggleFolder, onSelect, getFileIcon]);

    const filteredTree = filterItems(tree);

    // Resize logic removed - using fixed sidebar width

    return (
      <div 
        className={`sidebar ${visible ? 'visible' : ''}`}
        style={{ 
          '--sidebar-width': `${width}px`,
          width: `${width}px`,
          flexBasis: `${width}px`,
          minWidth: `${width}px`,
          maxWidth: `${width}px`,
          position: 'relative',
          overflow: 'hidden'
        } as React.CSSProperties}
      >
        <div className="sidebar-header">
          <h2>Folders & Files</h2>
          <div className="sidebar-controls">
            <button
              onClick={() => {
                onRefresh();
                if (onSidebarRefresh) {
                  // Get refresh function and call it
                  const refreshFn = () => {
                    // Refresh sidebar tree
                    refreshSidebar();
                  };
                  onSidebarRefresh(refreshFn);
                  refreshFn();
                }
              }}
              className="control-button"
              title="Refresh"
            >
              <i className="fas fa-sync-alt" />
            </button>
            <button
              onClick={onToggleFlagged}
              className={`control-button ${showFlagged ? 'active' : ''}`}
              title={showFlagged ? "Hide Flagged" : "Show Flagged"}
            >
              <i className="fas fa-flag" />
            </button>
          </div>
        </div>
        
        <div className="file-tree">
          {loading ? (
            <div className="loading-message">
              <i className="fas fa-spinner fa-spin" />
              <span>Loading...</span>
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="empty-message">
              <i className="fas fa-folder-open" />
              <span>No files found</span>
            </div>
          ) : (
            <div className="tree-content">
              {filteredTree.map(item => renderTreeItem(item))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

ModernExplorerSidebar.displayName = 'ModernExplorerSidebar';

export default ModernExplorerSidebar;

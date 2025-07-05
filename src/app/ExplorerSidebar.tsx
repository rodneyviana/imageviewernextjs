"use client";
import React from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any */

// Define state interface for FolderTree
interface FolderTreeState {
  expanded: Record<string, boolean>;
  folderChildren: Record<string, any[]>;
}

// Revert FolderTree to internal expanded state
 
class FolderTree extends React.Component<any, FolderTreeState> {
  state: FolderTreeState = { expanded: {}, folderChildren: {} };

  clearCache = () => {
    console.log('FolderTree: Clearing folderChildren cache');
    this.setState({ folderChildren: {} });
  };

  // Targeted update for file NSFW flag
  updateFileFlag = (filePath: string, nsfwFlagged: boolean) => {
    this.setState(prev => {
      const folderChildren = { ...prev.folderChildren };
      let updated = false;
      Object.keys(folderChildren).forEach(folder => {
        const children = folderChildren[folder];
        const idx = children.findIndex((c: any) => c.type === 'file' && c.path === filePath);
        if (idx !== -1) {
          folderChildren[folder] = [
            ...children.slice(0, idx),
            { ...children[idx], nsfwFlagged },
            ...children.slice(idx + 1)
          ];
          updated = true;
        }
      });
      if (updated) return { folderChildren };
      // Force re-render even if not found, to update icons if needed
      return { folderChildren: { ...folderChildren } };
    });
  };

  // Method to programmatically expand a folder path
  expandFolder = (folderPath: string) => {
    if (!this.state.expanded[folderPath]) {
      this.setState(prev => ({ 
        expanded: { ...prev.expanded, [folderPath]: true } 
      }));
    }
  };

  componentDidMount() {
    const { onCacheClearReady, onFileFlagReady, onExpandFolderReady } = this.props;
    if (onCacheClearReady) onCacheClearReady(this.clearCache);
    if (onFileFlagReady) onFileFlagReady(this.updateFileFlag);
    if (onExpandFolderReady) onExpandFolderReady(this.expandFolder);
  }

   
  componentDidUpdate(prevProps: any, prevState: FolderTreeState) {
    if (prevProps.showNSFW !== this.props.showNSFW) {
      this.clearCache();
    }
    // Load children on expansion
    Object.keys(this.state.expanded).forEach(path => {
      if (this.state.expanded[path] && !prevState.expanded[path]) {
        this.loadChildren(path);
      }
    });
  }

  // Toggle internal expanded state
  handleToggle = (path: string) => {
    this.setState(prev => ({ expanded: { ...prev.expanded, [path]: !prev.expanded[path] } }));
  };

  // Fetch and store children for a given folder path
  loadChildren = async (path: string) => {
    try {
      const res = await fetch(`/api/children?folder=${encodeURIComponent(path)}`);
      const data = await res.json();
      this.setState(prev => ({ folderChildren: { ...prev.folderChildren, [path]: data.children || [] } }));
    } catch (e) {
      console.error('Failed to load folder children:', e);
    }
  };

  getIndentClass(level: number) {
    return `folder-indent-level-${Math.min(level, 10)}`;
  }

   
  renderNode = (node: any, level = 0): React.ReactNode => {
    const { folderChildren, expanded } = this.state;
    const { onSelect, selected, showNSFW } = this.props;
    if (node.type === 'folder') {
      const isOpen = expanded[node.path];
      const children = folderChildren[node.path] || node.children || [];
      return (
        <div key={node.path} className={this.getIndentClass(level)}>
          <div
            className={selected === node.path ? 'folder-selected folder-row' : 'folder folder-row'}
            onClick={() => this.handleToggle(node.path)}
          >
            <span className="folder-icon">{isOpen ? '📂' : '📁'}</span>
            <span onClick={e => { e.stopPropagation(); onSelect(node.path); }}>{node.name}</span>
          </div>
          { }
          {isOpen && children.map((child: any) => this.renderNode(child, level + 1))}
        </div>
      );
    } else if (node.type === 'file') {
      if (!showNSFW && node.nsfwFlagged) return null;
      const icon = node.nsfwFlagged ? '🔒' : '🖼️';
      return (
        <div
          key={node.path}
          className={this.getIndentClass(level + 2) + ' ' +
            (selected === node.path ? 'file-selected' : 'file')}
          onClick={() => onSelect(node.path)}
          title={node.name}
        >
          {icon} {node.name}
        </div>
      );
    }
    return null;
  };

  render() {
    const { tree } = this.props;
    { }
    return <div className="explorer-tree-container">{tree.map((node: any) => this.renderNode(node, 0))}</div>;
  }
}

// Define state interface for ExplorerSidebar
interface ExplorerSidebarState {
   
  tree: any[];
  loading: boolean;
  clearFolderCache: (() => void) | null;
  expandFolder: ((folderPath: string) => void) | null;
}

// Convert ExplorerSidebar to class component with state annotation

export default class ExplorerSidebar extends React.Component<any, ExplorerSidebarState> {
  folderTreeRef = React.createRef<any>();
  state: ExplorerSidebarState = { tree: [], loading: true, clearFolderCache: null, expandFolder: null };

  refresh = async () => {
    this.setState({ loading: true });
    const res = await fetch('/api/explorer');
    const data = await res.json();
    this.setState({ tree: data.tree || [], loading: false });
  };

  // Refresh tree without clearing folder cache (preserves expanded state)
  fullRefresh = () => {
    this.refresh();
  };

  componentDidMount() {
    console.log('ExplorerSidebar: Component mounted, fetching tree');
    this.refresh();
    const { onRefreshReady } = this.props;
    if (onRefreshReady) onRefreshReady(this.fullRefresh);
  }

  setCacheClear = (fn: () => void) => {
    this.setState({ clearFolderCache: fn });
  };

  setExpandFolder = (fn: (folderPath: string) => void) => {
    this.setState({ expandFolder: fn });
  };

  // Method to programmatically expand a folder (to be called from parent)
  expandFolderPath = (folderPath: string) => {
    if (this.state.expandFolder) {
      this.state.expandFolder(folderPath);
    }
  };

  // Expose to parent: call FolderTree's updateFileFlag and update root tree state
  updateFileFlag = (filePath: string, nsfwFlagged: boolean) => {
    // Update FolderTree cache
    if (this.folderTreeRef.current && this.folderTreeRef.current.updateFileFlag) {
      this.folderTreeRef.current.updateFileFlag(filePath, nsfwFlagged);
    }
    // Update root tree state
    const updateTree = (nodes: any[]): any[] =>
      nodes.map(node => {
        if (node.type === 'file' && node.path === filePath) {
          return { ...node, nsfwFlagged };
        } else if (node.type === 'folder' && node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    this.setState(prev => ({ tree: updateTree(prev.tree) }));
  };

  render() {
    const { onSelect, selected, showNSFW, onToggleNSFW } = this.props;
    const { tree, loading } = this.state;

    return (
      <div className="explorer-sidebar">
        <div className="explorer-sidebar-header">
          <span className="explorer-sidebar-title">Root</span>
          <button onClick={this.fullRefresh} title="Refresh">🔄</button>
          <button
            onClick={() => onToggleNSFW()}
            title={showNSFW ? "Hide flagged images" : "Show flagged images"}
            className="ml-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            {showNSFW ? "Hide flagged" : "Show flagged"}
          </button>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <FolderTree
            ref={this.folderTreeRef}
            tree={tree}
            onSelect={onSelect}
            selected={selected}
            showNSFW={showNSFW}
            onCacheClearReady={this.setCacheClear}
            onFileFlagReady={this.updateFileFlag}
            onExpandFolderReady={this.setExpandFolder}
          />
        )}
      </div>
    );
  }
}

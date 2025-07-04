import { useState, useEffect, useCallback } from 'react';

export function useFolders() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tree, setTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/explorer');
    const data = await res.json();
    
    // API already returns sorted data, no need to sort again
    setTree(data.tree || []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { tree, loading, refresh };
}

export function useChildren(folder: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFile, setIsFile] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setIsFile(false);
    const res = await fetch(`/api/children?folder=${encodeURIComponent(folder)}`);
    const data = await res.json();
    setChildren(data.children || []);
    // If children is empty and folder is not empty, treat as file
    if (data.children && data.children.length === 0 && folder) {
      setIsFile(true);
    }
    setLoading(false);
  }, [folder]);

  useEffect(() => { if (folder) refresh(); }, [folder, refresh]);
  return { children, loading, refresh, isFile };
}

export function useMetadata(file: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/metadata?file=${encodeURIComponent(file)}`);
    const data = await res.json();
    setMetadata(data.metadata);
    setLoading(false);
  }, [file]);

  useEffect(() => { if (file) refresh(); }, [file, refresh]);
  return { metadata, loading, refresh };
}

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAllSnippets: () => ipcRenderer.invoke('get-all-snippets'),
  getSnippet: (id: string) => ipcRenderer.invoke('get-snippet', id),
  saveSnippet: (metadata: any, code: string) => ipcRenderer.invoke('save-snippet', metadata, code),
  exportSnippets: (ids: string[]) => ipcRenderer.invoke('export-snippets', ids),
  importSnippets: () => ipcRenderer.invoke('import-snippets'),
  getSnippetLogs: (id: string) => ipcRenderer.invoke('get-snippet-logs', id),
  executeSnippet: (id: string, params: Record<string, string>) => ipcRenderer.invoke('execute-snippet', id, params),
  onSnippetOutput: (callback: (data: { id: string, type: 'stdout' | 'stderr', content: string }) => void) => {
    const subscription = (_event: any, data: { id: string, type: 'stdout' | 'stderr', content: string }) => callback(data);
    ipcRenderer.on('snippet-output', subscription);
    return () => ipcRenderer.removeListener('snippet-output', subscription);
  }
});

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAllSnippets: () => ipcRenderer.invoke('get-all-snippets'),
  getSnippet: (id: string) => ipcRenderer.invoke('get-snippet', id),
  saveSnippet: (metadata: any, code: string) => ipcRenderer.invoke('save-snippet', metadata, code),
  exportSnippets: (ids: string[]) => ipcRenderer.invoke('export-snippets', ids),
  importSnippets: () => ipcRenderer.invoke('import-snippets'),
  executeSnippet: (id: string, params: Record<string, string>) => 
    ipcRenderer.invoke('execute-snippet', id, params),
});

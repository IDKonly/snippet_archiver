import { Snippet, SnippetMetadata, ExecutionLog } from '../common/types';

export interface IElectronAPI {
  getAllSnippets: () => Promise<SnippetMetadata[]>;
  getSnippet: (id: string) => Promise<Snippet | null>;
  saveSnippet: (metadata: SnippetMetadata, code: string) => Promise<{ success: boolean }>;
  exportSnippets: (ids: string[]) => Promise<{ success: boolean; count?: number }>;
  importSnippets: () => Promise<{ success: boolean; count?: number }>;
  getSnippetLogs: (id: string) => Promise<ExecutionLog[]>;
  executeSnippet: (id: string, params: Record<string, string>) => Promise<string>;
  onSnippetOutput: (
    callback: (data: { id: string; type: 'stdout' | 'stderr'; content: string }) => void
  ) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

import { Snippet, SnippetMetadata } from '../common/types';

export interface IElectronAPI {
  getAllSnippets: () => Promise<SnippetMetadata[]>;
  getSnippet: (id: string) => Promise<Snippet | null>;
  saveSnippet: (metadata: SnippetMetadata, code: string) => Promise<{ success: boolean }>;
  exportSnippets: (ids: string[]) => Promise<{ success: boolean; count?: number }>;
  importSnippets: () => Promise<{ success: boolean; count?: number }>;
  executeSnippet: (id: string, params: Record<string, string>) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

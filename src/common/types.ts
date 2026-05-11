export interface Parameter {
  name: string;
  defaultValue: string;
  description?: string;
}

export interface SnippetMetadata {
  id: string;
  title: string;
  description: string;
  tags: string[];
  type: 'python' | 'cmd' | 'html' | 'javascript' | 'react';
  mainFile: string;
  parameters: Parameter[];
}

export interface Snippet {
  metadata: SnippetMetadata;
  code: string;
}

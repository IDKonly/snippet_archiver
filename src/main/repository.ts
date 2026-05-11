import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Snippet, SnippetMetadata } from '../common/types';
import { logger } from './logger';

export class SnippetRepository {
  constructor(private archiveDir: string) {
    if (!existsSync(archiveDir)) {
      fs.mkdir(archiveDir, { recursive: true }).catch(err => {
        logger.error({ err }, 'Failed to create archive directory');
      });
    }
  }

  async getAllSnippets(): Promise<SnippetMetadata[]> {
    try {
      const entries = await fs.readdir(this.archiveDir, { withFileTypes: true });
      const snippetDirs = entries.filter(e => e.isDirectory());
      
      const snippets: SnippetMetadata[] = [];
      for (const dir of snippetDirs) {
        const metaPath = path.join(this.archiveDir, dir.name, 'meta.json');
        if (existsSync(metaPath)) {
          const metaContent = await fs.readFile(metaPath, 'utf-8');
          snippets.push(JSON.parse(metaContent));
        }
      }
      return snippets;
    } catch (err) {
      logger.error({ err }, 'Failed to read snippets');
      return [];
    }
  }

  async getSnippetById(id: string): Promise<Snippet | null> {
    const snippetDir = path.join(this.archiveDir, id);
    const metaPath = path.join(snippetDir, 'meta.json');
    
    if (!existsSync(metaPath)) return null;

    try {
      const metaContent = await fs.readFile(metaPath, 'utf-8');
      const metadata: SnippetMetadata = JSON.parse(metaContent);
      const codePath = path.join(snippetDir, metadata.mainFile);
      const code = await fs.readFile(codePath, 'utf-8');

      return { metadata, code };
    } catch (err) {
      logger.error({ err, id }, 'Failed to read snippet');
      return null;
    }
  }

  async saveSnippet(metadata: SnippetMetadata, code: string): Promise<void> {
    const snippetDir = path.join(this.archiveDir, metadata.id);
    
    try {
      if (!existsSync(snippetDir)) {
        await fs.mkdir(snippetDir, { recursive: true });
      }

      const metaPath = path.join(snippetDir, 'meta.json');
      await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2));

      const codePath = path.join(snippetDir, metadata.mainFile);
      await fs.writeFile(codePath, code);
      
      logger.info({ id: metadata.id }, 'Snippet saved');
    } catch (err) {
      logger.error({ err, id: metadata.id }, 'Failed to save snippet');
      throw err;
    }
  }
}

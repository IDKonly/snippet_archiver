import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Snippet, SnippetMetadata, ExecutionLog } from '../common/types';
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

  async getSnippetLogs(snippetId: string): Promise<ExecutionLog[]> {
    const logPath = path.join(this.archiveDir, snippetId, 'logs.json');
    if (!existsSync(logPath)) return [];
    try {
      const logsContent = await fs.readFile(logPath, 'utf-8');
      return JSON.parse(logsContent);
    } catch (err) {
      logger.error({ err, snippetId }, 'Failed to read snippet logs');
      return [];
    }
  }

  async saveSnippetLog(snippetId: string, params: Record<string, string>): Promise<void> {
    const snippetDir = path.join(this.archiveDir, snippetId);
    try {
      if (!existsSync(snippetDir)) {
        await fs.mkdir(snippetDir, { recursive: true });
      }
      const logPath = path.join(snippetDir, 'logs.json');
      const logs = await this.getSnippetLogs(snippetId);
      const newLog: ExecutionLog = {
        id: Math.random().toString(36).substring(2, 11),
        snippetId,
        timestamp: new Date().toISOString(),
        params
      };
      logs.unshift(newLog);
      const truncatedLogs = logs.slice(0, 50);
      await fs.writeFile(logPath, JSON.stringify(truncatedLogs, null, 2));
      logger.info({ id: snippetId }, 'Execution log saved');
    } catch (err) {
      logger.error({ err, snippetId }, 'Failed to save execution log');
      throw err;
    }
  }
}

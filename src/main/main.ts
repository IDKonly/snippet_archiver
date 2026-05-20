import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { resolve } from 'path';
import { startOtel } from './otel';
import { logger } from './logger';
import { SnippetRepository } from './repository';
import { SnippetExecutor } from './executor';
import { SnippetMetadata, Snippet } from '../common/types';
import fs from 'fs/promises';

// Start OpenTelemetry
startOtel();

const repository = new SnippetRepository(resolve(__dirname, '../../archive'));
const executor = new SnippetExecutor();

function setupIpc() {
  ipcMain.handle('get-all-snippets', async () => {
    return await repository.getAllSnippets();
  });

  ipcMain.handle('get-snippet', async (_, id: string) => {
    return await repository.getSnippetById(id);
  });

  ipcMain.handle('save-snippet', async (_, metadata: SnippetMetadata, code: string) => {
    await repository.saveSnippet(metadata, code);
    return { success: true };
  });

  ipcMain.handle('export-snippets', async (event, ids: string[]) => {
    const snippets: Snippet[] = [];
    for (const id of ids) {
      const snippet = await repository.getSnippetById(id);
      if (snippet) snippets.push(snippet);
    }

    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Snippets',
      defaultPath: 'snippets-export.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (filePath) {
      await fs.writeFile(filePath, JSON.stringify(snippets, null, 2), 'utf-8');
      return { success: true, count: snippets.length };
    }
    return { success: false };
  });

  ipcMain.handle('import-snippets', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Import Snippets',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
      const content = await fs.readFile(filePaths[0], 'utf-8');
      const snippets: Snippet[] = JSON.parse(content);
      
      let importCount = 0;
      for (const snippet of snippets) {
        await repository.saveSnippet(snippet.metadata, snippet.code);
        importCount++;
      }
      return { success: true, count: importCount };
    }
    return { success: false };
  });

  ipcMain.handle('execute-snippet', async (event, id: string, params: Record<string, string>) => {
    const snippet = await repository.getSnippetById(id);
    if (!snippet) throw new Error('Snippet not found');

    const processedCode = executor.replaceParameters(snippet.code, params, snippet.metadata.type);
    
    const onOutput = (type: 'stdout' | 'stderr', content: string) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        win.webContents.send('snippet-output', { id, type, content });
      }
    };

    if (snippet.metadata.type === 'python') {
      return await executor.executePython(processedCode, onOutput);
    } else if (snippet.metadata.type === 'cmd') {
      return await executor.executeCmd(processedCode, onOutput);
    } else if (snippet.metadata.type === 'javascript') {
      return await executor.executeJs(processedCode, onOutput);
    } else if (snippet.metadata.type === 'react') {
      await executor.executeReact(processedCode);
      return 'React Window opened';
    } else if (snippet.metadata.type === 'html') {
      await executor.executeHtml(processedCode);
      return 'HTML Window opened';
    }
    throw new Error('Unsupported snippet type');
  });
}

function createWindow() {
  const isDev = !app.isPackaged;
  const isHeadless = process.argv.includes('--headless');
  
  if (isHeadless) {
    logger.info('Running in headless mode');
    handleHeadlessExecution();
    return;
  }

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#94a3b8',
      height: 56
    },
    autoHideMenuBar: true,
    webPreferences: {
      preload: resolve(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.removeMenu();

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(resolve(__dirname, '../renderer/index.html'));
  }

  logger.info('Main window created');
}

async function handleHeadlessExecution() {
  const snippetId = process.argv.find(arg => arg.startsWith('--snippet-id='))?.split('=')[1];
  const paramsRaw = process.argv.find(arg => arg.startsWith('--params='))?.split('=')[1] || '{}';
  
  if (!snippetId) {
    console.error('Error: --snippet-id is required in headless mode');
    app.quit();
    return;
  }

  try {
    const params = JSON.parse(paramsRaw);
    const snippet = await repository.getSnippetById(snippetId);
    if (!snippet) throw new Error(`Snippet ${snippetId} not found`);

    console.log(`Executing snippet: ${snippetId} (${snippet.metadata.type})`);
    
    const processedCode = executor.replaceParameters(snippet.code, params);
    
    if (snippet.metadata.type === 'python') {
      const result = await executor.executePython(processedCode);
      console.log('RESULT:', result);
    } else if (snippet.metadata.type === 'cmd') {
      const result = await executor.executeCmd(processedCode);
      console.log('RESULT:', result);
    } else if (snippet.metadata.type === 'javascript') {
      const result = await executor.executeJs(processedCode);
      console.log('RESULT:', result);
    } else if (snippet.metadata.type === 'react') {
      await executor.executeReact(processedCode);
      console.log('RESULT: React Window opened in headless (Testing mode)');
    } else if (snippet.metadata.type === 'html') {
      await executor.executeHtml(processedCode);
      console.log('RESULT: HTML Window opened in headless');
    }
  } catch (err: any) {
    console.error('EXECUTION ERROR:', err.message);
  } finally {
    // Keep alive for a moment to let windows open if needed, or quit immediately for CLI tools
    setTimeout(() => app.quit(), 2000);
  }
}

app.whenReady().then(() => {
  setupIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

logger.info('Electron app starting');

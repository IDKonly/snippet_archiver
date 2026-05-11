import { spawn } from 'child_process';
import { BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { SnippetMetadata } from '../common/types';
import { logger } from './logger';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import * as iconv from 'iconv-lite';

const tracer = trace.getTracer('snippet-executor');

export class SnippetExecutor {
  private decode(data: Buffer): string {
    // Windows Korean environment usually uses CP949
    // Attempt to decode with CP949, if it fails or produces garbled text in some contexts, 
    // iconv-lite handles it gracefully.
    return iconv.decode(data, 'cp949');
  }

  replaceParameters(code: string, params: Record<string, string>): string {
    let result = code;
    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  async executePython(code: string): Promise<string> {
    return tracer.startActiveSpan('executePython', async (span): Promise<string> => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'snippet-'));
      const tempFile = path.join(tempDir, 'main.py');
      
      try {
        await fs.writeFile(tempFile, code);
        logger.info({ tempFile }, 'Executing python code');

        return new Promise((resolve, reject) => {
          const child = spawn('python', [tempFile]);
          let output = '';
          let error = '';

          child.stdout.on('data', (data: Buffer) => {
            output += this.decode(data);
          });

          child.stderr.on('data', (data: Buffer) => {
            error += this.decode(data);
          });

          child.on('close', (code) => {
            fs.rm(tempDir, { recursive: true, force: true }).catch(e => logger.error(e));
            if (code === 0) {
              span.setStatus({ code: SpanStatusCode.OK });
              resolve(output);
            } else {
              span.setStatus({ code: SpanStatusCode.ERROR, message: error });
              reject(new Error(error || `Exit code ${code}`));
            }
            span.end();
          });
        });
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
        span.end();
        throw err;
      }
    });
  }

  async executeCmd(command: string): Promise<string> {
    return tracer.startActiveSpan('executeCmd', async (span): Promise<string> => {
      logger.info({ command }, 'Executing CMD');

      return new Promise((resolve, reject) => {
        const child = spawn('cmd.exe', ['/c', command]);
        let output = '';
        let error = '';

        child.stdout.on('data', (data: Buffer) => {
          output += this.decode(data);
        });

        child.stderr.on('data', (data: Buffer) => {
          error += this.decode(data);
        });

        child.on('close', (code) => {
          if (code === 0) {
            span.setStatus({ code: SpanStatusCode.OK });
            resolve(output);
          } else {
            span.setStatus({ code: SpanStatusCode.ERROR, message: error });
            reject(new Error(error || `Exit code ${code}`));
          }
          span.end();
        });
      });
    });
  }

  async executeJs(code: string): Promise<string> {
    // Auto-detect if this is actually React code even if marked as JS
    if (code.includes('className=') || code.includes('useState') || code.includes('useEffect') || (code.includes('<') && code.includes('/>')) || code.includes('React.')) {
      logger.info('JSX/React detected in JS snippet, redirecting to React engine');
      await this.executeReact(code);
      return 'React Window opened (Auto-detected)';
    }

    return tracer.startActiveSpan('executeJs', async (span): Promise<string> => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'snippet-js-'));
      const tempFile = path.join(tempDir, 'main.js');
      
      try {
        await fs.writeFile(tempFile, code);
        logger.info({ tempFile }, 'Executing JS code');

        return new Promise((resolve, reject) => {
          const child = spawn('node', [tempFile]);
          let output = '';
          let error = '';

          child.stdout.on('data', (data: Buffer) => {
            output += this.decode(data);
          });

          child.stderr.on('data', (data: Buffer) => {
            error += this.decode(data);
          });

          child.on('close', (code) => {
            fs.rm(tempDir, { recursive: true, force: true }).catch(e => logger.error(e));
            if (code === 0) {
              span.setStatus({ code: SpanStatusCode.OK });
              resolve(output);
            } else {
              span.setStatus({ code: SpanStatusCode.ERROR, message: error });
              reject(new Error(error || `Exit code ${code}`));
            }
            span.end();
          });
        });
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
        span.end();
        throw err;
      }
    });
  }

  async executeHtml(code: string): Promise<void> {
    tracer.startActiveSpan('executeHtml', async (span) => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'snippet-html-'));
      const tempFile = path.join(tempDir, 'index.html');
      
      try {
        await fs.writeFile(tempFile, code);
        
        const win = new BrowserWindow({
          width: 800,
          height: 600,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          }
        });

        win.loadFile(tempFile);
        win.on('closed', () => {
          fs.rm(tempDir, { recursive: true, force: true }).catch(e => logger.error(e));
          span.end();
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
        span.end();
        throw err;
      }
    });
  }

  transformReactCode(code: string): { transformedImports: string, cleanedCode: string } {
    const lines = code.split('\n');
    const importLines: string[] = [];
    const restLines: string[] = [];
    
    let inMultilineImport = false;
    let currentImport = '';

    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ') || inMultilineImport) {
        currentImport += ' ' + trimmed;
        if (trimmed.includes('from ')) {
          importLines.push(currentImport.trim());
          currentImport = '';
          inMultilineImport = false;
        } else {
          inMultilineImport = true;
        }
      } else {
        restLines.push(line);
      }
    }

    const transformedImports = importLines.map(imp => {
      if (imp.includes('lucide-react')) {
        const match = imp.match(/{([^}]+)}/);
        if (match) return `const { ${match[1]} } = window.LucideReact;`;
        return 'const Lucide = window.LucideReact;';
      }
      if (imp.includes('from \'react\'') || imp.includes('from \"react\"')) {
        const match = imp.match(/{([^}]+)}/);
        if (match) return `const { ${match[1]} } = React;`;
        return '';
      }
      return `/* ${imp} */`;
    }).join('\n');

    const cleanedCode = restLines.join('\n')
      .replace(/export\s+default\s+/g, 'const App = ')
      .replace(/export\s+(const|let|var|function|class)\s+/g, '$1 ');

    return { transformedImports, cleanedCode };
  }

  async executeReact(code: string): Promise<void> {
    tracer.startActiveSpan('executeReact', async (span) => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'snippet-react-'));
      const tempFile = path.join(tempDir, 'index.html');
      
      const { transformedImports, cleanedCode } = this.transformReactCode(code);

      const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>React Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://unpkg.com/lucide-react@0.344.0/dist/umd/lucide-react.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; padding: 0; background: #f8fafc; font-family: sans-serif; }
        #root { height: 100vh; width: 100vw; overflow: auto; }
        .error-overlay { background: #fee2e2; color: #991b1b; padding: 2rem; border-radius: 0.5rem; margin: 2rem; border: 1px solid #f87171; }
    </style>
</head>
<body>
    <div id="root">
        <div style="display:flex; justify-content:center; align-items:center; height:100vh; color:#64748b;">
            Initializing React Environment...
        </div>
    </div>
    <script>
        window.onerror = function(msg, url, line, col, error) {
            document.getElementById('root').innerHTML = \`
                <div class="error-overlay">
                    <h1 style="font-size:1.5rem; font-weight:bold; margin-bottom:1rem;">Bootstrap Error</h1>
                    <p style="font-family:monospace; white-space:pre-wrap;">\${msg}</p>
                    <p style="font-size:0.8rem; margin-top:1rem; opacity:0.7;">Check DevTools console for details.</p>
                </div>
            \`;
            return false;
        };
    </script>
    <script type="text/babel">
        // --- Transformed Imports ---
        ${transformedImports}

        try {
            // --- User Code ---
            ${cleanedCode}
            
            const renderTarget = document.getElementById('root');
            const root = ReactDOM.createRoot(renderTarget);

            if (typeof App !== 'undefined') {
                root.render(<App />);
            } else {
                const componentName = Object.keys(window).find(key => 
                    typeof window[key] === 'function' && 
                    /^[A-Z]/.test(key) && 
                    !['React', 'ReactDOM', 'Babel', 'Lucide'].includes(key)
                );
                
                if (componentName) {
                    const Component = window[componentName];
                    root.render(<Component />);
                } else {
                    renderTarget.innerHTML = \`
                        <div class="error-overlay">
                            <h1 style="font-size:1.5rem; font-weight:bold;">Component Detection Failed</h1>
                            <p>No valid React component found to render. Please name your component 'App'.</p>
                        </div>
                    \`;
                }
            }
        } catch (e) {
            document.getElementById('root').innerHTML = \`
                <div class="error-overlay">
                    <h1 style="font-size:1.5rem; font-weight:bold; margin-bottom:1rem;">Runtime Error</h1>
                    <p style="font-family:monospace; white-space:pre-wrap;">\${e.stack || e.message}</p>
                </div>
            \`;
        }
    </script>
</body>
</html>
      `;

      try {
        await fs.writeFile(tempFile, htmlTemplate);
        
        const win = new BrowserWindow({
          width: 1000,
          height: 800,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          }
        });

        win.loadFile(tempFile);
        // During dev, open devtools to help user see console
        if (process.env.NODE_ENV === 'development') {
          win.webContents.openDevTools();
        }

        win.on('closed', () => {
          fs.rm(tempDir, { recursive: true, force: true }).catch(e => logger.error(e));
          span.end();
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
        span.end();
        throw err;
      }
    });
  }
}

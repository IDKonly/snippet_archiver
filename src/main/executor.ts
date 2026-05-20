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

  private escapeForCmd(val: string): string {
    // Escape characters that have special meaning in CMD
    // & | < > ^ ( ) % !
    // We also wrap in double quotes if it contains spaces or special characters,
    // but a simpler way is to escape them with ^.
    // However, for echo {param}, if we want it to be a single argument, quotes are better.
    // To be safe and simple, we'll escape the most dangerous ones.
    return val.replace(/([&|<>^])/g, '^$1');
  }

  replaceParameters(code: string, params: Record<string, string>, type?: string): string {
    let result = code;
    for (const [key, value] of Object.entries(params)) {
      let escapedValue = value;
      if (type === 'cmd') {
        escapedValue = this.escapeForCmd(value);
      } else if (type === 'python' || type === 'javascript' || type === 'react') {
        // For script languages, we escape for string literals (backslash escaping)
        escapedValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
      }
      
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, escapedValue);
    }
    return result;
  }

  async executePython(code: string, onOutput?: (type: 'stdout' | 'stderr', content: string) => void): Promise<string> {
    return tracer.startActiveSpan('executePython', async (span): Promise<string> => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'snippet-'));
      const tempFile = path.join(tempDir, 'main.py');
      
      try {
        await fs.writeFile(tempFile, code);
        logger.info({ tempFile }, 'Executing python code');

        return new Promise((resolve, reject) => {
          const child = spawn('python', [tempFile]);
          let fullOutput = '';
          let error = '';

          child.stdout.on('data', (data: Buffer) => {
            const decoded = this.decode(data);
            fullOutput += decoded;
            if (onOutput) onOutput('stdout', decoded);
          });

          child.stderr.on('data', (data: Buffer) => {
            const decoded = this.decode(data);
            error += decoded;
            if (onOutput) onOutput('stderr', decoded);
          });

          child.on('close', (code) => {
            fs.rm(tempDir, { recursive: true, force: true }).catch(e => logger.error(e));
            if (code === 0) {
              span.setStatus({ code: SpanStatusCode.OK });
              resolve(fullOutput);
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

  async executeCmd(command: string, onOutput?: (type: 'stdout' | 'stderr', content: string) => void): Promise<string> {
    return tracer.startActiveSpan('executeCmd', async (span): Promise<string> => {
      logger.info({ command }, 'Executing CMD');

      return new Promise((resolve, reject) => {
        const child = spawn('cmd.exe', ['/c', command]);
        let fullOutput = '';
        let error = '';

        child.stdout.on('data', (data: Buffer) => {
          const decoded = this.decode(data);
          fullOutput += decoded;
          if (onOutput) onOutput('stdout', decoded);
        });

        child.stderr.on('data', (data: Buffer) => {
          const decoded = this.decode(data);
          error += decoded;
          if (onOutput) onOutput('stderr', decoded);
        });

        child.on('close', (code) => {
          if (code === 0) {
            span.setStatus({ code: SpanStatusCode.OK });
            resolve(fullOutput);
          } else {
            span.setStatus({ code: SpanStatusCode.ERROR, message: error });
            reject(new Error(error || `Exit code ${code}`));
          }
          span.end();
        });
      });
    });
  }

  async executeJs(code: string, onOutput?: (type: 'stdout' | 'stderr', content: string) => void): Promise<string> {
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
          let fullOutput = '';
          let error = '';

          child.stdout.on('data', (data: Buffer) => {
            const decoded = this.decode(data);
            fullOutput += decoded;
            if (onOutput) onOutput('stdout', decoded);
          });

          child.stderr.on('data', (data: Buffer) => {
            const decoded = this.decode(data);
            error += decoded;
            if (onOutput) onOutput('stderr', decoded);
          });

          child.on('close', (code) => {
            fs.rm(tempDir, { recursive: true, force: true }).catch(e => logger.error(e));
            if (code === 0) {
              span.setStatus({ code: SpanStatusCode.OK });
              resolve(fullOutput);
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
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          }
        });
        win.removeMenu();

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

  findComponentName(code: string): string | null {
    // 1. Look for export default component name
    const exportDefaultMatch = code.match(/export\s+default\s+([A-Z][a-zA-Z0-9_]*)/);
    if (exportDefaultMatch) return exportDefaultMatch[1];

    // 2. Look for export default function/class name
    const exportDefaultDeclMatch = code.match(/export\s+default\s+(?:function|class)\s+([A-Z][a-zA-Z0-9_]*)/);
    if (exportDefaultDeclMatch) return exportDefaultDeclMatch[1];

    // 3. Look for function or class named App
    if (/\b(?:function|class|const|let|var)\s+App\b/.test(code)) return 'App';

    // 4. Look for any other function or class starting with capital letter
    const anyComponentMatch = code.match(/\b(?:function|class)\s+([A-Z][a-zA-Z0-9_]*)/);
    if (anyComponentMatch) return anyComponentMatch[1];

    // 5. Look for const/let component declarations starting with capital letter
    const constComponentMatch = code.match(/\b(?:const|let|var)\s+([A-Z][a-zA-Z0-9_]*)\s*=/);
    if (constComponentMatch) return constComponentMatch[1];

    return null;
  }

  transformReactCode(code: string): { transformedImports: string, cleanedCode: string, componentName: string | null } {
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

    const componentName = this.findComponentName(code);

    const cleanedCode = restLines.join('\n')
      .replace(/export\s+default\s+/g, 'const App = ')
      .replace(/export\s+(const|let|var|function|class)\s+/g, '$1 ');

    return { transformedImports, cleanedCode, componentName };
  }

  async executeReact(code: string): Promise<void> {
    tracer.startActiveSpan('executeReact', async (span) => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'snippet-react-'));
      const tempFile = path.join(tempDir, 'index.html');
      
      const { transformedImports, cleanedCode, componentName } = this.transformReactCode(code);

      const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>React Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script>
        window.react = window.React;
    </script>
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
            
            // Auto-expose detected component to window.App
            ${componentName ? `if (typeof ${componentName} !== 'undefined') { window.App = ${componentName}; }` : ''}
            if (typeof App !== 'undefined') { window.App = App; }

            const renderTarget = document.getElementById('root');
            const root = ReactDOM.createRoot(renderTarget);

            if (window.App) {
                root.render(React.createElement(window.App));
            } else {
                renderTarget.innerHTML = \`
                    <div class="error-overlay">
                        <h1 style="font-size:1.5rem; font-weight:bold;">Component Detection Failed</h1>
                        <p>No valid React component found to render. Please name your component 'App' or export it as default.</p>
                    </div>
                \`;
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
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          }
        });
        win.removeMenu();
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
}

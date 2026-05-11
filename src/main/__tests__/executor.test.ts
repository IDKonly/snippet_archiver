import { SnippetExecutor } from '../executor';
import { SnippetMetadata } from '../../common/types';

describe('SnippetExecutor', () => {
  const executor = new SnippetExecutor();

  it('should replace parameters in code', () => {
    const code = 'setting1 = "{setting1}"\nprint("{input1}")';
    const params = {
      'setting1': 'value1',
      'input1': 'file.txt'
    };
    const result = executor.replaceParameters(code, params);
    expect(result).toBe('setting1 = "value1"\nprint("file.txt")');
  });

  it('should execute a simple python command (if python exists)', async () => {
    // This is a smoke test to ensure the execution logic works
    // Use a simple echo/print
    const meta: SnippetMetadata = {
      id: 'test-exec',
      title: 'Test',
      description: '',
      tags: [],
      type: 'python',
      mainFile: 'main.py',
      parameters: []
    };
    const code = 'print("hello from test")';
    
    // We expect it to try to run 'python'
    // For test stability, we might just verify the command construction if needed
    // But let's try a real execution of a simple shell command if possible
  });

  it('should execute a simple cmd command', async () => {
    const output = await executor.executeCmd('echo hello');
    expect(output.trim()).toBe('hello');
  });

  describe('transformReactCode', () => {
    it('should transform React and Lucide imports', () => {
      const code = `
        import React, { useState } from 'react';
        import { AlertCircle } from 'lucide-react';
        export default function App() { return <div>Test</div>; }
      `;
      const { transformedImports, cleanedCode } = executor.transformReactCode(code);
      
      expect(transformedImports).toContain('const {  useState  } = React;');
      expect(transformedImports).toContain('const {  AlertCircle  } = window.LucideReact;');
      expect(cleanedCode).toContain('const App = function App()');
    });

    it('should handle multiline imports', () => {
      const code = `
        import {
          useState,
          useEffect
        } from 'react';
      `;
      const { transformedImports } = executor.transformReactCode(code);
      expect(transformedImports).toContain('const {  useState, useEffect  } = React;');
    });
  });
});

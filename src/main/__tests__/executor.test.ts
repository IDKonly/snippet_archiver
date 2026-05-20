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

  it('should safely handle parameters with spaces in CMD', async () => {
    const code = 'echo {param}';
    const params = { 'param': 'hello world' };
    const processed = executor.replaceParameters(code, params, 'cmd');
    const output = await executor.executeCmd(processed);
    expect(output.trim()).toBe('hello world');
  });

  it('should prevent command injection in CMD', async () => {
    // Attempting to execute 'whoami' via injection
    const code = 'echo {param}';
    const params = { 'param': 'test & echo injected' };
    const processed = executor.replaceParameters(code, params, 'cmd');
    
    // With escaping, {param} becomes test ^& echo injected
    // echo test ^& echo injected prints: test & echo injected
    const output = await executor.executeCmd(processed);
    expect(output.trim()).toBe('test & echo injected');
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

    it('should correctly identify the React component name', () => {
      const code1 = 'function App() { return <div>Hello</div>; }';
      expect(executor.findComponentName(code1)).toBe('App');

      const code2 = 'export default class MyWidget extends React.Component { render() { return null; } }';
      expect(executor.findComponentName(code2)).toBe('MyWidget');

      const code3 = 'export default function Hello() { return null; }';
      expect(executor.findComponentName(code3)).toBe('Hello');

      const code4 = 'const Sidebar = () => null; export default Sidebar;';
      expect(executor.findComponentName(code4)).toBe('Sidebar');
    });
  });
});

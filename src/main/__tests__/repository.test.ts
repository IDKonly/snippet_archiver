import { SnippetRepository } from '../repository';
import fs from 'fs';
import path from 'path';
import { SnippetMetadata } from '../../common/types';

describe('SnippetRepository', () => {
  const testArchiveDir = path.resolve(__dirname, 'test_archive');
  let repo: SnippetRepository;

  beforeAll(() => {
    if (!fs.existsSync(testArchiveDir)) {
      fs.mkdirSync(testArchiveDir);
    }
    repo = new SnippetRepository(testArchiveDir);
  });

  afterAll(() => {
    if (fs.existsSync(testArchiveDir)) {
      fs.rmSync(testArchiveDir, { recursive: true, force: true });
    }
  });

  it('should save and list snippets', async () => {
    const meta: SnippetMetadata = {
      id: 'test-1',
      title: 'Test Snippet',
      description: 'A test snippet',
      tags: ['test'],
      type: 'python',
      mainFile: 'main.py',
      parameters: []
    };
    const code = 'print("hello")';

    await repo.saveSnippet(meta, code);

    const snippets = await repo.getAllSnippets();
    expect(snippets.length).toBe(1);
    expect(snippets[0].title).toBe('Test Snippet');
  });

  it('should read a specific snippet', async () => {
    const snippet = await repo.getSnippetById('test-1');
    expect(snippet).toBeDefined();
    expect(snippet?.code).toBe('print("hello")');
    expect(snippet?.metadata.id).toBe('test-1');
  });

  it('should save and retrieve execution logs', async () => {
    const params = { foo: 'bar', hello: 'world' };
    await repo.saveSnippetLog('test-1', params);

    const logs = await repo.getSnippetLogs('test-1');
    expect(logs.length).toBe(1);
    expect(logs[0].snippetId).toBe('test-1');
    expect(logs[0].params).toEqual(params);
    expect(logs[0].timestamp).toBeDefined();
  });
});

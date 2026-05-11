import React, { useState, useEffect } from 'react';
import { Snippet, SnippetMetadata } from '../common/types';

const App: React.FC = () => {
  const [snippets, setSnippets] = useState<SnippetMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('Ready');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newSnippet, setNewSnippet] = useState<SnippetMetadata>({
    id: '',
    title: '',
    description: '',
    tags: [],
    type: 'python',
    mainFile: 'main.py',
    parameters: []
  });
  const [newCode, setNewCode] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    loadSnippets();
  }, []);

  const handleExport = async () => {
    if (selectedIds.size === 0) {
      alert('Please select snippets to export.');
      return;
    }
    const result = await window.electronAPI.exportSnippets(Array.from(selectedIds));
    if (result.success) {
      alert(`${result.count} snippets exported successfully.`);
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  const handleImport = async () => {
    const result = await window.electronAPI.importSnippets();
    if (result.success) {
      alert(`${result.count} snippets imported successfully.`);
      loadSnippets();
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSnippets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSnippets.map(s => s.id)));
    }
  };

  const toggleSnippetSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // 모달이 이미 열려있거나 포커스가 입력 필드에 있는 경우 중단
      if (showAddModal || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        return;
      }

      const text = e.clipboardData?.getData('text');
      if (text) {
        handleInjectedContent(text, 'pasted-code');
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [showAddModal]);

  const handleInjectedContent = (content: string, defaultName: string) => {
    let type: 'python' | 'cmd' | 'html' | 'javascript' | 'react' = 'python';
    let mainFile = 'main.py';
    let suggestedTitle = defaultName;

    // 간단한 휴리스틱으로 코드 타입 감지
    const trimmed = content.trim().toLowerCase();
    if (trimmed.includes('<html') || trimmed.includes('<!doctype') || trimmed.includes('<body')) {
      type = 'html';
      mainFile = 'index.html';
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) suggestedTitle = titleMatch[1].trim();
    } else if (trimmed.startsWith('@echo off') || trimmed.includes('set ') || trimmed.includes('echo ')) {
      type = 'cmd';
      mainFile = 'command.txt';
    } else if (trimmed.includes('console.log') || trimmed.includes('const ') || trimmed.includes('let ') || trimmed.includes('function ')) {
      type = 'javascript';
      mainFile = 'main.js';
      // If it contains JSX tags, it's likely a React component
      if (trimmed.includes('<') && trimmed.includes('/>') || trimmed.includes('className=') || trimmed.includes('useState') || trimmed.includes('useEffect')) {
        type = 'react';
        mainFile = 'index.html';
      }
    }

    setNewSnippet({
      id: slugify(suggestedTitle),
      title: suggestedTitle,
      description: `Imported via ${defaultName.includes('pasted') ? 'paste' : 'D&D'}`,
      tags: ['imported'],
      type,
      mainFile,
      parameters: []
    });
    setNewCode(content);
    setShowAddModal(true);
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-') // 한글 지원 포함
      .replace(/(^-|-$)/g, '');
  };

  const resetNewSnippetState = () => {
    setNewSnippet({
      id: '',
      title: '',
      description: '',
      tags: [],
      type: 'python',
      mainFile: 'main.py',
      parameters: []
    });
    setNewCode('');
    setIsEditMode(false);
  };

  const handleOpenAdd = () => {
    resetNewSnippetState();
    setShowAddModal(true);
  };

  const handleTitleChange = (title: string) => {
    const updates: Partial<SnippetMetadata> = { title };
    if (!isEditMode) {
      updates.id = slugify(title);
    }
    setNewSnippet({ ...newSnippet, ...updates });
  };

  const handleOpenEdit = () => {
    if (!selectedSnippet) return;
    setNewSnippet({ ...selectedSnippet.metadata });
    setNewCode(selectedSnippet.code);
    setIsEditMode(true);
    setShowAddModal(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        let type: 'python' | 'cmd' | 'html' | 'javascript' | 'react' = 'python';
        let mainFile = 'main.py';
        let suggestedTitle = file.name.replace(/\.[^/.]+$/, "");
        
        if (extension === 'html') {
          type = 'html';
          mainFile = 'index.html';
          // Extract <title> from HTML content
          const titleMatch = content.match(/<title>(.*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            suggestedTitle = titleMatch[1].trim();
          }
        } else if (extension === 'bat' || extension === 'cmd' || extension === 'txt') {
          type = 'cmd';
          mainFile = 'command.txt';
        } else if (extension === 'js') {
          type = 'javascript';
          mainFile = 'main.js';
        }

        setNewSnippet({
          id: file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, '-').toLowerCase(),
          title: suggestedTitle,
          description: `Imported from ${file.name}`,
          tags: ['imported'],
          type,
          mainFile,
          parameters: []
        });
        setNewCode(content);
        setShowAddModal(true);
      };
      
      reader.readAsText(file);
    }
  };

  const loadSnippets = async () => {
    try {
      const data = await window.electronAPI.getAllSnippets();
      setSnippets(data);
    } catch (err) {
      console.error('Failed to load snippets', err);
      setStatus('Error loading snippets');
    }
  };

  const handleSelectSnippet = async (id: string) => {
    try {
      const snippet = await window.electronAPI.getSnippet(id);
      setSelectedSnippet(snippet);
      if (snippet) {
        const initialParams: Record<string, string> = {};
        snippet.metadata.parameters.forEach(p => {
          initialParams[p.name] = p.defaultValue;
        });
        setParamValues(initialParams);
      }
      setOutput('');
      setStatus(`Selected: ${id}`);
    } catch (err) {
      console.error('Failed to load snippet', err);
      setStatus('Error loading snippet detail');
    }
  };

  const handleExecute = async () => {
    if (!selectedSnippet) return;
    setStatus('Executing...');
    setOutput('Running snippet...\n');
    try {
      const result = await window.electronAPI.executeSnippet(selectedSnippet.metadata.id, paramValues);
      setOutput(prev => prev + result);
      setStatus('Execution finished');
    } catch (err: any) {
      setOutput(prev => prev + 'Error:\n' + err.message);
      setStatus('Execution failed');
    }
  };

  const filteredSnippets = snippets.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDoubleClickSnippet = async (s: SnippetMetadata) => {
    if (s.type === 'html' && s.parameters.length === 0) {
      setStatus(`Executing ${s.id} immediately...`);
      try {
        await window.electronAPI.executeSnippet(s.id, {});
        setStatus('HTML Window opened (Direct)');
      } catch (err: any) {
        alert('Failed to execute: ' + err.message);
        setStatus('Execution failed');
      }
    }
  };

  const handleSaveSnippet = async () => {
    if (!newSnippet.id || !newSnippet.title || !newCode) {
      alert('ID, Title, and Code are required.');
      return;
    }
    try {
      console.log('Attempting to save snippet:', newSnippet);
      if (typeof window.electronAPI.saveSnippet !== 'function') {
        throw new Error('window.electronAPI.saveSnippet is not defined. Please restart the app.');
      }
      await window.electronAPI.saveSnippet(newSnippet, newCode);
      setShowAddModal(false);
      loadSnippets();
      setStatus('Snippet saved successfully');
    } catch (err: any) {
      alert('Failed to save snippet: ' + err.message);
    }
  };

  return (
    <div 
      id="app-container" 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        width: '100vw',
        overflow: 'hidden',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        position: 'relative'
      }}
    >
      {isDragging && (
        <div id="drag-overlay" style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(52, 152, 219, 0.3)',
          border: '4px dashed #3498db',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          pointerEvents: 'none'
        }}>
          <h2 style={{ color: '#2980b9', backgroundColor: 'white', padding: '1rem 2rem', borderRadius: '8px' }}>
            Drop file to add snippet
          </h2>
        </div>
      )}
      <header id="main-header" style={{ 
        height: '4rem', 
        backgroundColor: '#2c3e50', 
        color: 'white', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center', 
        padding: '0 1.5rem',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}>
        <h1 id="app-title" style={{ margin: 0, fontSize: '1.5rem' }}>Snippet Archiver</h1>
        <button 
          id="btn-add-snippet"
          onClick={handleOpenAdd}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          + Add Snippet
        </button>
      </header>
      
      {showAddModal && (
        <div id="modal-overlay" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div id="add-snippet-modal" style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2>{isEditMode ? 'Edit Snippet' : 'Add New Snippet'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                placeholder="ID (Auto-generated from Title)" 
                value={newSnippet.id} 
                onChange={e => setNewSnippet({...newSnippet, id: slugify(e.target.value)})} 
                disabled={isEditMode}
                style={{ padding: '0.5rem', backgroundColor: isEditMode ? '#f0f0f0' : 'white' }} 
              />
              <input 
                placeholder="Title" 
                value={newSnippet.title} 
                onChange={e => handleTitleChange(e.target.value)} 
                style={{ padding: '0.5rem' }} 
              />
              <textarea placeholder="Description" value={newSnippet.description} onChange={e => setNewSnippet({...newSnippet, description: e.target.value})} style={{ padding: '0.5rem' }} />
              <select value={newSnippet.type} onChange={e => setNewSnippet({...newSnippet, type: e.target.value as any, mainFile: e.target.value === 'python' ? 'main.py' : (e.target.value === 'html' ? 'index.html' : (e.target.value === 'javascript' ? 'main.js' : 'command.txt'))})} style={{ padding: '0.5rem' }}>
                <option value="python">Python</option>
                <option value="cmd">CMD</option>
                <option value="html">HTML</option>
                <option value="javascript">JavaScript (Node.js)</option>
              </select>
              <textarea 
                placeholder="Code content... (use {param} for parameters)" 
                value={newCode} 
                onChange={e => setNewCode(e.target.value)} 
                style={{ padding: '0.5rem', height: '200px', fontFamily: 'monospace' }} 
              />
              
              <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Parameter Definitions</h3>
                  <button 
                    onClick={() => setNewSnippet({
                      ...newSnippet, 
                      parameters: [...newSnippet.parameters, { name: '', defaultValue: '', description: '' }]
                    })}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                  >
                    + Add Parameter
                  </button>
                </div>
                {newSnippet.parameters.map((p, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input 
                      placeholder="Name" 
                      value={p.name} 
                      onChange={e => {
                        const updated = [...newSnippet.parameters];
                        updated[index].name = e.target.value;
                        setNewSnippet({ ...newSnippet, parameters: updated });
                      }}
                      style={{ flex: 1, padding: '0.3rem' }}
                    />
                    <input 
                      placeholder="Default Value" 
                      value={p.defaultValue} 
                      onChange={e => {
                        const updated = [...newSnippet.parameters];
                        updated[index].defaultValue = e.target.value;
                        setNewSnippet({ ...newSnippet, parameters: updated });
                      }}
                      style={{ flex: 1, padding: '0.3rem' }}
                    />
                    <button 
                      onClick={() => {
                        const updated = newSnippet.parameters.filter((_, i) => i !== index);
                        setNewSnippet({ ...newSnippet, parameters: updated });
                      }}
                      style={{ padding: '0.3rem', color: 'red' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={() => { setShowAddModal(false); resetNewSnippetState(); }} style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                <button onClick={handleSaveSnippet} style={{ padding: '0.5rem 1rem', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px' }}>
                  {isEditMode ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main id="main-content" style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden',
        backgroundColor: '#ecf0f1'
      }}>
        <aside id="sidebar" style={{ 
          width: '20rem', 
          backgroundColor: 'white',
          borderRight: '1px solid #bdc3c7', 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 id="sidebar-title" style={{ margin: 0, fontSize: '1.2rem' }}>Archive</h2>
              <button 
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
              >
                {isSelectionMode ? 'Cancel' : 'Manage'}
              </button>
            </div>
            
            {isSelectionMode ? (
              <div id="selection-controls" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={toggleSelectAll} style={{ flex: 1, fontSize: '0.8rem' }}>
                    {selectedIds.size === filteredSnippets.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button onClick={handleExport} disabled={selectedIds.size === 0} style={{ flex: 1, fontSize: '0.8rem', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px' }}>
                    Export ({selectedIds.size})
                  </button>
                </div>
                <button onClick={handleImport} style={{ fontSize: '0.8rem', backgroundColor: '#34495e', color: 'white', border: 'none', padding: '0.3rem', borderRadius: '4px' }}>
                  Import JSON
                </button>
              </div>
            ) : (
              <input 
                id="search-bar-input" 
                type="text" 
                placeholder="Search by title or tag..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  borderRadius: '4px', 
                  border: '1px solid #ccc',
                  boxSizing: 'border-box',
                  marginBottom: '1rem'
                }} 
              />
            )}
          </div>
          <ul id="snippet-list" style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0, 
            overflowY: 'auto',
            flex: 1
          }}>
            {filteredSnippets.length === 0 ? (
              <li id="snippet-item-placeholder" style={{ padding: '1rem', color: '#7f8c8d' }}>No snippets found</li>
            ) : (
              filteredSnippets.map(s => (
                <li 
                  key={s.id} 
                  id={`snippet-item-${s.id}`}
                  onClick={() => isSelectionMode ? toggleSnippetSelection(s.id) : handleSelectSnippet(s.id)}
                  onDoubleClick={() => !isSelectionMode && handleDoubleClickSnippet(s)}
                  style={{ 
                    padding: '1rem', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid #eee',
                    backgroundColor: selectedSnippet?.metadata.id === s.id && !isSelectionMode ? '#3498db' : (selectedIds.has(s.id) ? '#ebf5fb' : 'transparent'),
                    color: selectedSnippet?.metadata.id === s.id && !isSelectionMode ? 'white' : 'black',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSelectionMode && (
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(s.id)} 
                      onChange={() => {}} // Click on <li> handles this
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{s.title}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{s.type} | {s.tags.join(', ')}</div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </aside>
        
        <section id="content-viewer" style={{ 
          flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem', 
          overflow: 'hidden'
        }}>
          {selectedSnippet ? (
            <div id="snippet-detail-panel" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}>
              <div id="snippet-info-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 id="detail-title" style={{ margin: '0 0 0.5rem 0' }}>{selectedSnippet.metadata.title}</h2>
                  <p id="detail-description" style={{ color: '#7f8c8d', margin: 0 }}>{selectedSnippet.metadata.description}</p>
                </div>
                <button 
                  id="btn-edit-snippet"
                  onClick={handleOpenEdit}
                  style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: '#f39c12',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Edit
                </button>
              </div>

              <div id="panel-snippet-metadata-editor" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Parameters</h3>
                {selectedSnippet.metadata.parameters.length === 0 ? (
                  <p style={{ fontSize: '0.9rem', color: '#95a5a6' }}>No parameters for this snippet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                    {selectedSnippet.metadata.parameters.map(p => (
                      <React.Fragment key={p.name}>
                        <label style={{ fontSize: '0.9rem', alignSelf: 'center' }}>{p.name}:</label>
                        <input 
                          id={`param-input-${p.name}`}
                          type="text" 
                          value={paramValues[p.name] || ''} 
                          onChange={(e) => setParamValues({ ...paramValues, [p.name]: e.target.value })}
                          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>

              <div id="action-bar" style={{ marginBottom: '1.5rem' }}>
                <button 
                  id={`btn-execute-snippet-${selectedSnippet.metadata.id}`}
                  onClick={handleExecute}
                  style={{ 
                    padding: '0.7rem 1.5rem', 
                    backgroundColor: '#27ae60', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Execute Snippet
                </button>
              </div>

              <div id="execution-output-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Output</h3>
                <pre 
                  id="output-console" 
                  style={{ 
                    flex: 1, 
                    backgroundColor: '#2c3e50', 
                    color: '#ecf0f1', 
                    padding: '1rem', 
                    margin: 0, 
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '0.9rem'
                  }}
                >
                  {output}
                </pre>
              </div>
            </div>
          ) : (
            <div id="welcome-message" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#95a5a6'
            }}>
              <h3 style={{ fontSize: '1.5rem' }}>Welcome to Snippet Archiver</h3>
              <p>Select a snippet from the sidebar to view or execute.</p>
            </div>
          )}
        </section>
      </main>
      
      <footer id="main-footer" style={{ 
        height: '2rem', 
        backgroundColor: '#34495e', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem',
        fontSize: '0.8rem'
      }}>
        <span id="footer-status">Status: {status}</span>
      </footer>
    </div>
  );
};

export default App;

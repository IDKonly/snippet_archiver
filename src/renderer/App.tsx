import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Settings, 
  Play, 
  Edit, 
  Code, 
  Terminal, 
  Trash2, 
  Download, 
  Upload, 
  Check, 
  X,
  ChevronRight,
  Archive,
  Filter,
  MoreVertical,
  CheckSquare,
  Square,
  Copy
} from 'lucide-react';
import { Snippet, SnippetMetadata } from '../common/types';
import SnippetCard from './components/SnippetCard';
import ParameterForm from './components/ParameterForm';
import Console from './components/Console';

const App: React.FC = () => {
  const [snippets, setSnippets] = useState<SnippetMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('Ready');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);
  
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
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    loadSnippets();

    // Set up real-time output listener
    const unsubscribe = window.electronAPI.onSnippetOutput((data) => {
      setOutput(prev => prev + data.content);
    });

    return () => unsubscribe();
  }, []);

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
      setShowSource(false);
      setCopied(false);
    } catch (err) {
      console.error('Failed to load snippet', err);
      setStatus('Error loading snippet detail');
    }
  };

  const handleCopyCode = () => {
    if (selectedSnippet) {
      navigator.clipboard.writeText(selectedSnippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExecute = async () => {
    if (!selectedSnippet) return;
    setStatus('Executing...');
    setOutput(''); // Reset output on new execution
    try {
      const result = await window.electronAPI.executeSnippet(selectedSnippet.metadata.id, paramValues);
      // result is the full output, but we also get it via streaming.
      // To avoid duplication, we only clear at start and rely on streaming, 
      // or use result if streaming is not available. 
      // Current main.ts returns full result at end.
      setStatus('Execution finished');
    } catch (err: any) {
      setOutput(prev => prev + '\n[ERROR]\n' + err.message);
      setStatus('Execution failed');
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    const updates: Partial<SnippetMetadata> = { title };
    if (!isEditMode) {
      updates.id = slugify(title);
    }
    setNewSnippet({ ...newSnippet, ...updates });
  };

  const handleAddParameter = () => {
    setNewSnippet(prev => ({
      ...prev,
      parameters: [...prev.parameters, { name: '', defaultValue: '', description: '' }]
    }));
  };

  const handleRemoveParameter = (index: number) => {
    setNewSnippet(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  const handleNewSnippetParamChange = (index: number, field: 'name' | 'defaultValue' | 'description', value: string) => {
    setNewSnippet(prev => {
      const updatedParams = [...prev.parameters];
      updatedParams[index] = { ...updatedParams[index], [field]: value };
      return { ...prev, parameters: updatedParams };
    });
  };

  const handleSaveSnippet = async () => {
    if (!newSnippet.id || !newSnippet.title || !newCode) {
      alert('ID, Title, and Code are required.');
      return;
    }
    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const snippetToSave = {
      ...newSnippet,
      tags: parsedTags
    };

    try {
      await window.electronAPI.saveSnippet(snippetToSave, newCode);
      setShowAddModal(false);
      loadSnippets();
      setStatus('Snippet saved successfully');
    } catch (err: any) {
      alert('Failed to save snippet: ' + err.message);
    }
  };

  const filteredSnippets = useMemo(() => {
    if (!searchTerm.trim()) return snippets;

    const parts = searchTerm.toLowerCase().split(/\s+/).filter(p => p.length > 0);
    
    return snippets.filter(s => {
      return parts.every(part => {
        if (part.startsWith('tag:')) {
          const tagValue = part.slice(4);
          return s.tags.some(t => t.toLowerCase().includes(tagValue));
        }
        if (part.startsWith('type:')) {
          const typeValue = part.slice(5);
          return s.type.toLowerCase().includes(typeValue);
        }
        return (
          s.title.toLowerCase().includes(part) ||
          s.tags.some(t => t.toLowerCase().includes(part)) ||
          s.type.toLowerCase().includes(part) ||
          s.description.toLowerCase().includes(part)
        );
      });
    });
  }, [snippets, searchTerm]);

  const toggleSnippetSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleParamChange = (name: string, value: string) => {
    setParamValues(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div id="app-root" className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <header id="main-header" className="h-14 flex items-center justify-between px-4 bg-slate-900 border-b border-slate-800 shadow-lg z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
            <Archive size={20} className="text-white" />
          </div>
          <h1 id="app-title" className="text-lg font-bold tracking-tight text-white">Snippet Archiver</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            id="btn-add-snippet"
            onClick={() => {
              setNewSnippet({ id: '', title: '', description: '', tags: [], type: 'python', mainFile: 'main.py', parameters: [] });
              setNewCode('');
              setTagsInput('');
              setIsEditMode(false);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-900/20 active:scale-95 text-sm"
          >
            <Plus size={16} />
            <span>Add Snippet</span>
          </button>
          <button id="btn-settings" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main id="main-content" className="flex-1 flex overflow-hidden">
        <aside id="sidebar" className="w-72 flex flex-col bg-slate-900 border-r border-slate-800 shrink-0">
          <div className="p-4 flex flex-col gap-3">
            <div className="relative group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input 
                id="search-input"
                type="text" 
                placeholder="Search (e.g. tag:python title)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-500 text-slate-200"
              />
            </div>
            
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Archive</span>
              <button 
                id="btn-toggle-manage"
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isSelectionMode ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {isSelectionMode ? 'Cancel' : 'Manage'}
              </button>
            </div>
          </div>

          <div id="snippet-list-container" className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredSnippets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Filter size={32} className="text-slate-800 mb-2" />
                <p className="text-sm text-slate-500 font-medium">No snippets found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredSnippets.map(s => (
                  <SnippetCard 
                    key={s.id}
                    snippet={s}
                    isSelected={selectedSnippet?.metadata.id === s.id}
                    isSelectionMode={isSelectionMode}
                    isManaged={selectedIds.has(s.id)}
                    onClick={() => isSelectionMode ? toggleSnippetSelection(s.id) : handleSelectSnippet(s.id)}
                    onDoubleClick={() => {}} // Could add immediate execute here
                  />
                ))}
              </div>
            )}
          </div>

          {isSelectionMode && (
            <div id="selection-footer" className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
              <button 
                onClick={async () => {
                  const result = await window.electronAPI.exportSnippets(Array.from(selectedIds));
                  if (result.success) {
                    setIsSelectionMode(false);
                    setSelectedIds(new Set());
                  }
                }}
                disabled={selectedIds.size === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95"
              >
                <Download size={14} />
                <span>Export ({selectedIds.size})</span>
              </button>
            </div>
          )}
        </aside>

        <section id="content-viewer" className="flex-1 flex flex-col bg-slate-950 p-6 overflow-hidden">
          {selectedSnippet ? (
            <div id="detail-panel" className="flex-1 flex flex-col gap-6 overflow-hidden">
              <div className="flex items-start justify-between shrink-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 id="detail-title" className="text-2xl font-bold text-white truncate">{selectedSnippet.metadata.title}</h2>
                    <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold uppercase tracking-wider">{selectedSnippet.metadata.type}</span>
                  </div>
                  <p id="detail-description" className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{selectedSnippet.metadata.description || 'No description provided.'}</p>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button 
                    id="btn-edit" 
                    onClick={() => {
                      setNewSnippet({ ...selectedSnippet.metadata });
                      setNewCode(selectedSnippet.code);
                      setTagsInput(selectedSnippet.metadata.tags.join(', '));
                      setIsEditMode(true);
                      setShowAddModal(true);
                    }}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all active:scale-95" title="Edit Snippet"
                  >
                    <Edit size={20} />
                  </button>
                  <button id="btn-more" className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all active:scale-95" title="More Options">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              <ParameterForm 
                parameters={selectedSnippet.metadata.parameters}
                values={paramValues}
                onChange={handleParamChange}
              />

              <div className="flex items-center gap-4 shrink-0">
                <button 
                  id={`btn-execute-${selectedSnippet.metadata.id}`}
                  onClick={handleExecute}
                  disabled={status === 'Executing...'}
                  className="flex items-center gap-3 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/20 active:scale-95 group"
                >
                  <div className="p-1 bg-white/20 rounded-md group-hover:scale-110 transition-transform">
                    <Play size={18} fill="currentColor" />
                  </div>
                  <span>{status === 'Executing...' ? 'Running...' : 'Run Snippet'}</span>
                </button>
                <button 
                  onClick={() => setShowSource(!showSource)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 border ${
                    showSource 
                      ? 'bg-blue-600/10 text-blue-400 border-blue-500/30' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent'
                  }`}
                >
                  <Code size={18} />
                  <span>{showSource ? 'Hide Source' : 'View Source'}</span>
                </button>
              </div>

              {showSource && selectedSnippet && (
                <div id="source-viewer" className="flex-1 flex flex-col min-h-[200px] max-h-[350px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shrink-0">
                  <div className="h-10 flex items-center justify-between px-4 bg-slate-900/80 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                      <Code size={14} className="text-blue-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Source Code ({selectedSnippet.metadata.mainFile})
                      </span>
                    </div>
                    <button 
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-emerald-500" />
                          <span className="text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-800 bg-slate-950">
                    <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
                      {selectedSnippet.code}
                    </pre>
                  </div>
                </div>
              )}

              <Console 
                output={output}
                onClear={() => setOutput('')}
              />
            </div>
          ) : (
            <div id="welcome-panel" className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="p-6 bg-slate-900 rounded-3xl mb-6 shadow-2xl border border-slate-800">
                <Archive size={64} className="text-blue-600 opacity-80" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Welcome to Snippet Archiver</h3>
              <p className="text-slate-500 leading-relaxed mb-8 text-sm">Select a snippet from the sidebar to view details, configure parameters, and execute code in isolated environments.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-500">Python 3.x</div>
                <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-500">Node.js</div>
                <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-500">HTML5/JS</div>
                <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-500">React</div>
              </div>
            </div>
          )}
        </section>
      </main>
      
      <footer id="main-footer" className="h-8 flex items-center justify-between px-4 bg-slate-900 border-t border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-600 shrink-0">
        <div className="flex items-center gap-4">
          <span id="footer-status" className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${status === 'Ready' ? 'bg-emerald-500' : (status.includes('Error') || status.includes('failed') ? 'bg-red-500' : 'bg-blue-500 animate-pulse')}`}></span>
            {status}
          </span>
        </div>
        <div>v1.0.0</div>
      </footer>

      {showAddModal && (
        <div id="modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-6">
          <div id="add-snippet-modal" className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{isEditMode ? 'Edit Snippet' : 'Add New Snippet'}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase px-1">Snippet ID</label>
                  <input 
                    value={newSnippet.id} 
                    onChange={e => setNewSnippet({...newSnippet, id: slugify(e.target.value)})} 
                    disabled={isEditMode}
                    className="w-full bg-slate-800 border border-slate-700 disabled:opacity-50 disabled:bg-slate-900 rounded-xl px-4 py-2 text-sm outline-none text-slate-200"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase px-1">Title</label>
                  <input 
                    value={newSnippet.title} 
                    onChange={e => handleTitleChange(e.target.value)} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none text-slate-200"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase px-1">Type</label>
                <select 
                  value={newSnippet.type} 
                  onChange={e => setNewSnippet({...newSnippet, type: e.target.value as any, mainFile: e.target.value === 'python' ? 'main.py' : (e.target.value === 'html' ? 'index.html' : (e.target.value === 'javascript' ? 'main.js' : 'command.txt'))})} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none text-slate-200 appearance-none"
                >
                  <option value="python">Python</option>
                  <option value="cmd">CMD</option>
                  <option value="html">HTML</option>
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="react">React Component</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase px-1">Description</label>
                <input 
                  value={newSnippet.description} 
                  onChange={e => setNewSnippet({...newSnippet, description: e.target.value})} 
                  placeholder="A brief explanation of what the snippet does..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase px-1">Tags (comma-separated)</label>
                <input 
                  value={tagsInput} 
                  onChange={e => setTagsInput(e.target.value)} 
                  placeholder="python, utility, file-helper"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase px-1">Code Content</label>
                <textarea 
                  value={newCode} 
                  onChange={e => setNewCode(e.target.value)} 
                  className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono outline-none text-slate-300 scrollbar-thin scrollbar-thumb-slate-800"
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-800 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Execution Parameters</h3>
                  <button 
                    type="button"
                    onClick={handleAddParameter}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-blue-400 border border-slate-700 transition-colors"
                  >
                    <Plus size={12} />
                    <span>Add Parameter</span>
                  </button>
                </div>

                {newSnippet.parameters.length === 0 ? (
                  <p className="text-xs text-slate-500 italic px-1">No parameters defined. Code placeholders like {'{param_name}'} will not be mapped automatically.</p>
                ) : (
                  <div className="space-y-3">
                    {newSnippet.parameters.map((param, index) => (
                      <div key={index} className="flex gap-2 items-start bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                        <div className="grid grid-cols-3 gap-2 flex-1">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-600 uppercase px-1">Name</label>
                            <input 
                              type="text"
                              value={param.name}
                              placeholder="e.g. name"
                              onChange={e => handleNewSnippetParamChange(index, 'name', e.target.value)}
                              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none text-slate-200 focus:border-slate-700"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-600 uppercase px-1">Default Value</label>
                            <input 
                              type="text"
                              value={param.defaultValue}
                              placeholder="e.g. World"
                              onChange={e => handleNewSnippetParamChange(index, 'defaultValue', e.target.value)}
                              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none text-slate-200 focus:border-slate-700"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-600 uppercase px-1">Description (Optional)</label>
                            <input 
                              type="text"
                              value={param.description || ''}
                              placeholder="e.g. Name to greet"
                              onChange={e => handleNewSnippetParamChange(index, 'description', e.target.value)}
                              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none text-slate-200 focus:border-slate-700"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveParameter(index)}
                          className="mt-5 p-1.5 text-slate-500 hover:text-red-400 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 text-slate-400 hover:text-white font-bold transition-colors">Cancel</button>
              <button onClick={handleSaveSnippet} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95">
                {isEditMode ? 'Update' : 'Save Snippet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

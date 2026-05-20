import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

interface ConsoleProps {
  output: string;
  onClear: () => void;
}

const Console: React.FC<ConsoleProps> = ({ output, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div id="console-panel" className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="h-10 flex items-center justify-between px-4 bg-slate-800/50 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-blue-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Execution Console</span>
        </div>
        <button 
          onClick={onClear}
          className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors"
        >
          Clear
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 font-mono text-sm scrollbar-thin scrollbar-thumb-slate-800">
        <pre id="output-console" className="text-slate-300 whitespace-pre-wrap leading-relaxed">
          {output || <span className="text-slate-700 italic">Waiting for execution output...</span>}
        </pre>
      </div>
    </div>
  );
};

export default Console;

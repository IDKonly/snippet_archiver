import React from 'react';
import { Settings, Info } from 'lucide-react';
import { Parameter } from '../../common/types';

interface ParameterFormProps {
  parameters: Parameter[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

const ParameterForm: React.FC<ParameterFormProps> = ({ parameters, values, onChange }) => {
  if (parameters.length === 0) {
    return (
      <div id="parameters-panel-empty" className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-inner shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Settings size={16} className="text-slate-600" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Parameter Configuration</h3>
        </div>
        <div className="py-2 text-sm text-slate-600 italic flex items-center gap-2">
          <Info size={14} />
          No parameters required for this snippet.
        </div>
      </div>
    );
  }

  return (
    <div id="parameters-panel" className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-inner shrink-0">
      <div className="flex items-center gap-2 mb-4">
        <Settings size={16} className="text-blue-500" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Parameter Configuration</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {parameters.map(p => (
          <div key={p.name} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">{p.name}</label>
              {p.description && (
                <div className="group relative">
                  <Info size={12} className="text-slate-600 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700 z-20">
                    {p.description}
                  </div>
                </div>
              )}
            </div>
            <input 
              id={`param-input-${p.name}`}
              type="text" 
              value={values[p.name] || ''} 
              onChange={(e) => onChange(p.name, e.target.value)}
              placeholder={p.defaultValue}
              className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2 text-sm outline-none transition-all text-slate-200 placeholder:text-slate-600"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParameterForm;

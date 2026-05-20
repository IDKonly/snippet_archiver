import React from 'react';
import { ChevronRight, CheckSquare, Square } from 'lucide-react';
import { SnippetMetadata } from '../../common/types';

interface SnippetCardProps {
  snippet: SnippetMetadata;
  isSelected: boolean;
  isSelectionMode: boolean;
  isManaged: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

const SnippetCard: React.FC<SnippetCardProps> = ({ 
  snippet, 
  isSelected, 
  isSelectionMode, 
  isManaged,
  onClick,
  onDoubleClick
}) => {
  return (
    <div 
      id={`snippet-item-${snippet.id}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`
        group relative p-3 rounded-xl cursor-pointer transition-all border flex items-center gap-3
        ${isSelected && !isSelectionMode 
          ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/20' 
          : (isManaged ? 'bg-slate-800 border-blue-500/50' : 'bg-transparent border-transparent hover:bg-slate-800/50')}
      `}
    >
      {isSelectionMode && (
        <div className="shrink-0">
          {isManaged ? (
            <CheckSquare size={18} className="text-blue-400" />
          ) : (
            <Square size={18} className="text-slate-600" />
          )}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className={`font-semibold truncate text-sm ${isSelected && !isSelectionMode ? 'text-white' : 'text-slate-200'}`}>
          {snippet.title}
        </div>
        <div className={`text-[10px] flex items-center gap-2 mt-1 ${isSelected && !isSelectionMode ? 'text-blue-100' : 'text-slate-500'}`}>
          <span className="px-1.5 py-0.5 bg-slate-800 rounded uppercase font-bold tracking-tighter border border-slate-700 text-[9px]">{snippet.type}</span>
          <span className="truncate">{snippet.tags.join(', ')}</span>
        </div>
      </div>

      {!isSelectionMode && isSelected && (
        <ChevronRight size={16} className="text-blue-200 shrink-0" />
      )}
    </div>
  );
};

export default SnippetCard;

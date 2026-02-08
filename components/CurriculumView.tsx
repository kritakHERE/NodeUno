import React, { useState, useEffect } from 'react';
import { CurriculumItem, TopicPage, PendingTask } from '../types';
import { generateSHA8 } from '../utils';

interface CurriculumViewProps {
  curriculum: CurriculumItem[];
  onSelect: (name: string, parentId: string | null) => void;
  topicPages: Record<string, TopicPage>;
  pendingTasks: Record<string, PendingTask>;
  onExpand: (label: string, childrenLabels: string[]) => void;
  onExpandLevel1: () => void;
  onUpgrade: () => void;
}

const TreeItem: React.FC<{ 
  item: CurriculumItem; 
  onSelect: (name: string) => void; 
  topicPages: Record<string, TopicPage>;
  pendingTasks: Record<string, PendingTask>;
  onExpand: (label: string, childrenLabels: string[]) => void;
  depth: number;
}> = ({ item, onSelect, topicPages, pendingTasks, onExpand, depth }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [itemId, setItemId] = useState<string>('');
  const hasChildren = item.children && item.children.length > 0;
  
  useEffect(() => {
    let active = true;
    generateSHA8(item.label).then(id => {
      if (active) setItemId(id);
    });
    return () => { active = false; };
  }, [item.label]);

  const isSearched = !!topicPages[itemId];
  const isSearching = !!pendingTasks[itemId];
  const isExpanding = !!pendingTasks[`expand_${item.label}`];

  return (
    <div className="flex flex-col">
      <div 
        className={`flex items-center gap-4 py-3 px-4 rounded-2xl transition-all group ${isSearched ? 'bg-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5' : 'hover:bg-white/5'}`}
      >
        {/* Toggle Arrow - ONLY this handles open/close */}
        <div className="w-6 h-6 flex items-center justify-center shrink-0">
          {hasChildren && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
              className="w-full h-full flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
            >
              <i className={`fa-solid fa-chevron-right text-[10px] transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}></i>
            </button>
          )}
        </div>
        
        {/* Main Content Area - Handles selection navigation */}
        <div className="flex-1 flex items-center gap-4 cursor-pointer overflow-hidden" onClick={() => onSelect(item.label)}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${isSearched ? 'bg-blue-500 text-white' : 'bg-neutral-800 text-neutral-400 group-hover:bg-neutral-700'}`}>
            {item.level}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <span className={`font-bold transition-colors truncate ${isSearched ? 'text-blue-400 underline decoration-2 underline-offset-4' : 'text-neutral-200 group-hover:text-white'}`}>
                    {item.label}
                </span>
                {isSearched && <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-0.5">Unlocked</span>}
                {isSearching && (
                    <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">Generating Content...</span>
                    </div>
                )}
            </div>
        </div>
        
        {/* Infinite Expansion Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const childrenLabels = item.children?.map(c => c.label) || [];
            onExpand(item.label, childrenLabels);
            setIsOpen(true);
          }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${isExpanding ? 'bg-purple-500/20 text-purple-500' : 'bg-neutral-900 border border-white/5 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-purple-400 hover:border-purple-500/50'}`}
          title="Expand Curriculum (Infinity Mode)"
        >
          <i className={`fa-solid ${isExpanding ? 'fa-spinner animate-spin' : 'fa-plus'} text-[10px]`}></i>
        </button>
      </div>
      
      {hasChildren && isOpen && (
        <div className="ml-8 mt-2 pl-4 border-l-2 border-white/5 flex flex-col gap-2">
          {item.children!.map((child) => (
             <TreeItem key={child.id} item={child} onSelect={onSelect} topicPages={topicPages} pendingTasks={pendingTasks} onExpand={onExpand} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const CurriculumView: React.FC<CurriculumViewProps> = ({ curriculum, onSelect, topicPages, pendingTasks, onExpand, onExpandLevel1, onUpgrade }) => {
  const isExpandingRoot = !!pendingTasks['expand_level1'];
  const isUpgrading = !!pendingTasks['upgrade_curriculum'];

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4">
      <div className="mb-12 border-b border-white/5 pb-8 mt-4 flex items-center justify-between">
        <div>
           <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase">Your Learning Map</h2>
           <p className="text-neutral-500 font-medium uppercase">Follow the hierarchy to unlock specialized knowledge modules.</p>
        </div>
        <button 
            onClick={onUpgrade}
            disabled={isUpgrading}
            className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 text-xs font-bold uppercase tracking-widest transition-all"
        >
            {isUpgrading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>} Upgrade Curriculum
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {curriculum.map((item) => (
          <TreeItem 
            key={item.id} 
            item={item} 
            onSelect={(name) => onSelect(name, null)} 
            topicPages={topicPages}
            pendingTasks={pendingTasks}
            onExpand={onExpand}
            depth={0}
          />
        ))}

        <button 
          onClick={onExpandLevel1}
          disabled={isExpandingRoot}
          className="mt-6 w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-neutral-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-xs"
        >
          {isExpandingRoot ? (
            <><i className="fa-solid fa-spinner animate-spin"></i> Generating Modules...</>
          ) : (
            <><i className="fa-solid fa-plus-circle"></i> Add More Top-Level Modules</>
          )}
        </button>
      </div>

      <div className="mt-20 p-10 rounded-[2.5rem] glass border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <i className="fa-solid fa-bolt text-6xl text-purple-500"></i>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-3 uppercase">
            <i className="fa-solid fa-compass text-purple-400"></i>
            Strategic Trends
          </h3>
          <span className="text-[10px] bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full text-purple-400 font-black tracking-widest uppercase">AI Powered</span>
        </div>
        <p className="text-neutral-500 font-medium leading-relaxed max-w-xl uppercase">
          Integrating real-time market data to suggest which nodes in this curriculum are currently high-demand in the industry.
        </p>
      </div>
    </div>
  );
};

export default CurriculumView;
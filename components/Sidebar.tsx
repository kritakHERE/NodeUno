
import React, { useState } from 'react';
import { ModelProvider, ApiKeys, SkillLevel, AcademicLevel, AppScene } from '../types';
import { MODEL_OPTIONS, SKILL_LEVELS, ACADEMIC_LEVELS } from '../constants';

interface SidebarProps {
  currentScene: AppScene;
  onNavigate: (scene: AppScene) => void;
  
  provider: ModelProvider;
  setProvider: (p: ModelProvider) => void;
  
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  
  apiKeys: ApiKeys;
  setApiKeys: (keys: ApiKeys) => void;
  
  skillLevel: SkillLevel;
  setSkillLevel: (l: SkillLevel) => void;
  
  academicLevel: AcademicLevel;
  setAcademicLevel: (l: AcademicLevel) => void;
  
  useAcademic: boolean;
  setUseAcademic: (b: boolean) => void;
  
  dynamicLevel: boolean;
  setDynamicLevel: (b: boolean) => void;
  
  isPaused: boolean;
  togglePause: () => void;
  timeLeft: number;
  
  collapsed: boolean;
  setCollapsed: (b: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentScene, onNavigate,
  provider, setProvider,
  selectedModel, setSelectedModel,
  apiKeys, setApiKeys,
  skillLevel, setSkillLevel,
  academicLevel, setAcademicLevel,
  useAcademic, setUseAcademic,
  dynamicLevel, setDynamicLevel,
  isPaused, togglePause, timeLeft,
  collapsed, setCollapsed
}) => {
  const [showKeys, setShowKeys] = useState(false);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const NavBtn = ({ scene, icon, label }: { scene: AppScene, icon: string, label: string }) => (
    <button onClick={() => onNavigate(scene)} className={`w-full text-left p-3 rounded-xl transition-all flex items-center ${collapsed ? 'justify-center' : 'gap-3'} ${currentScene === scene || (scene === 'curriculum' && currentScene === 'topic') ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-white/5 text-neutral-400'}`} title={label}>
       <i className={`fa-solid ${icon} ${collapsed ? 'text-xl' : 'w-5'}`}></i>
       {!collapsed && <span className="text-sm font-bold">{label}</span>}
    </button>
  );

  return (
    <div className={`${collapsed ? 'w-20' : 'w-80'} h-full bg-neutral-900 border-r border-white/5 flex flex-col flex-shrink-0 transition-all duration-300`}>
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        {!collapsed && (
            <div>
                <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">MindMap</h1>
                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">Adaptive</p>
            </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className={`text-neutral-500 hover:text-white transition-colors ${collapsed ? 'w-full flex justify-center' : ''}`}>
            <i className="fa-solid fa-bars text-lg"></i>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6 no-scrollbar">
        
        {/* Navigation */}
        <section>
          {!collapsed && <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 px-2">Navigation</h3>}
          <div className="space-y-1">
            <NavBtn scene="hub" icon="fa-compass" label="Hub" />
            <NavBtn scene="curriculum" icon="fa-sitemap" label="Curriculum" />
            <NavBtn scene="graph" icon="fa-share-nodes" label="Graph View" />
            {/* Setup return */}
            <button onClick={() => onNavigate('setup')} className={`w-full text-left p-3 rounded-xl transition-all flex items-center ${collapsed ? 'justify-center' : 'gap-3'} hover:bg-white/5 text-neutral-400`}>
               <i className={`fa-solid fa-sliders ${collapsed ? 'text-xl' : 'w-5'}`}></i>
               {!collapsed && <span className="text-sm font-bold">Config</span>}
            </button>
          </div>
        </section>

        {!collapsed && (
          <>
            {/* AI Configuration */}
            <section className="animate-in fade-in slide-in-from-left-2">
              <div className="flex justify-between items-center mb-3 px-2">
                 <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Brain</h3>
                 <button onClick={() => setShowKeys(!showKeys)} className="text-[10px] text-blue-400 hover:text-white"><i className="fa-solid fa-key"></i></button>
              </div>
              
              <div className="space-y-3">
                 <div className="grid grid-cols-2 gap-2">
                    {['gemini', 'cerebras', 'groq', 'openai', 'openrouter'].map((p) => (
                        <button key={p} onClick={() => setProvider(p as ModelProvider)} className={`px-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${provider === p ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-neutral-500 hover:bg-white/5'}`}>
                            {p.slice(0, 8)}
                        </button>
                    ))}
                 </div>
                 
                 <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-xs font-medium text-white outline-none">
                     {MODEL_OPTIONS[provider]?.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                 </select>

                 {showKeys && (
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">{provider} Key</label>
                        <input 
                          type="password" 
                          value={apiKeys[provider] || ''} 
                          onChange={(e) => setApiKeys({...apiKeys, [provider]: e.target.value})} 
                          className="w-full bg-neutral-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                          placeholder="Paste key..."
                        />
                    </div>
                 )}
              </div>
            </section>

            {/* Level Configuration */}
            <section className="animate-in fade-in slide-in-from-left-2">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 px-2">Difficulty</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2" onClick={() => setUseAcademic(!useAcademic)}>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${useAcademic ? 'bg-purple-500' : 'bg-neutral-700'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${useAcademic ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className="text-xs font-bold text-neutral-400 select-none">Academic Terms</span>
                    </div>

                    <select 
                        value={useAcademic ? academicLevel : skillLevel} 
                        onChange={(e) => useAcademic ? setAcademicLevel(e.target.value as AcademicLevel) : setSkillLevel(e.target.value as SkillLevel)}
                        className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-xs font-medium text-white outline-none"
                    >
                        {(useAcademic ? ACADEMIC_LEVELS : SKILL_LEVELS).map(l => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                    
                    <div className="flex items-center gap-2 px-2 cursor-pointer" onClick={() => setDynamicLevel(!dynamicLevel)}>
                         <div className={`w-3 h-3 rounded-sm border ${dynamicLevel ? 'bg-green-500 border-green-500' : 'border-neutral-600'}`} />
                         <span className="text-xs font-medium text-neutral-400 select-none">Ask me every time</span>
                    </div>
                </div>
            </section>
          </>
        )}

      </div>

      {/* Footer / Session */}
      <div className="p-6 border-t border-white/5 bg-neutral-900/50">
         <div className={`flex items-center ${collapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
            {!collapsed && (
                <div>
                    <span className="block text-[10px] font-black uppercase text-neutral-500 tracking-widest">Timer</span>
                    <span className={`text-2xl font-mono font-bold ${isPaused ? 'text-neutral-500' : 'text-white'}`}>{formatTime(timeLeft)}</span>
                </div>
            )}
            <button onClick={togglePause} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPaused ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
                <i className={`fa-solid ${isPaused ? 'fa-play' : 'fa-pause'}`}></i>
            </button>
            {collapsed && <span className="text-[10px] font-mono text-neutral-500">{formatTime(timeLeft)}</span>}
         </div>
      </div>
    </div>
  );
};

export default Sidebar;

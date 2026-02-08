import React, { useState, useEffect } from 'react';
import { AppScene, AppState, CurriculumItem, TopicPage, Note, PendingTask, ModelProvider, SavedCurriculum, ApiKeys, SkillLevel, AcademicLevel } from './types';
import { generateCurriculum, generateTopicCore, generateEssentials, generateSignificance, generateContext, fetchTopicResources, getDefinition, expandCurriculum, expandLevel1Curriculum, generateConnection, generateSearchQueries } from './services/gemini';
import { formatTime, generateSHA8, extractTextFromFile } from './utils';
import { PHYSICAL_ACTIVITIES, MODEL_OPTIONS, SKILL_LEVELS, ACADEMIC_LEVELS } from './constants';

// Scenes & Components
import Sidebar from './components/Sidebar';
import SetupView from './components/SetupView';
import HubView from './components/HubView';
import CurriculumView from './components/CurriculumView';
import TopicDetailView from './components/TopicDetailView';
import GraphView from './components/GraphView';
import NotesOverlay from './components/NotesOverlay';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('mindmap_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...parsed,
            apiKeys: parsed.apiKeys || {},
            savedCurriculums: parsed.savedCurriculums || [], 
            currentScene: parsed.currentScene || 'setup', 
            modelProvider: parsed.modelProvider || 'groq',
            selectedModelId: parsed.selectedModelId || '',
            history: parsed.history || [],
            skillLevel: parsed.skillLevel || 'Intermediate',
            academicLevel: parsed.academicLevel || 'Undergraduate',
            useAcademicLevel: parsed.useAcademicLevel || false,
            dynamicSkillLevel: parsed.dynamicSkillLevel || false,
            focusMinutes: parsed.focusMinutes || 25,
            breakMinutes: parsed.breakMinutes || 5,
            timeLeft: parsed.timeLeft || 25 * 60,
            isSidebarCollapsed: parsed.isSidebarCollapsed || false
          };
        }
      }
    } catch (e) {
      console.error("Failed to parse state from localStorage", e);
    }
    
    return {
      currentScene: 'setup',
      modelProvider: 'groq',
      selectedModelId: 'llama-3.3-70b-versatile',
      apiKeys: {},
      learningGoal: '',
      skillLevel: 'Intermediate',
      academicLevel: 'Undergraduate',
      useAcademicLevel: false,
      dynamicSkillLevel: false,
      curriculum: [],
      savedCurriculums: [],
      topicPages: {},
      notes: [],
      selectedTopicId: null,
      history: [],
      pendingTasks: {},
      searchErrors: {},
      focusMinutes: 25,
      breakMinutes: 5,
      totalSessions: 1,
      currentSession: 1,
      isFocusMode: true,
      isPaused: true, 
      timeLeft: 25 * 60,
      isOverlayActive: false,
      isSidebarCollapsed: false
    };
  });

  const [showNotes, setShowNotes] = useState(false);
  const [activityTip, setActivityTip] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [pendingAction, setPendingAction] = useState<{
    type: 'deep_dive' | 'expand' | 'level1' | 'queries' | 'topic' | 'upgrade' | 'regenerate';
    payload: any;
    promptText?: string;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem('mindmap_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (state.isPaused || state.currentScene === 'setup') return;
    const interval = setInterval(() => {
      setState(prev => {
        if (prev.timeLeft <= 1) {
          if (prev.isFocusMode) {
            const tip = PHYSICAL_ACTIVITIES[Math.floor(Math.random() * PHYSICAL_ACTIVITIES.length)];
            setActivityTip(tip);
            return { ...prev, isFocusMode: false, timeLeft: prev.breakMinutes * 60, isOverlayActive: true };
          } else {
            if (prev.currentSession >= prev.totalSessions) return { ...prev, isPaused: true, isOverlayActive: false, timeLeft: 0 };
            return { ...prev, isFocusMode: true, currentSession: prev.currentSession + 1, timeLeft: prev.focusMinutes * 60, isOverlayActive: false };
          }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isPaused, state.isFocusMode, state.currentScene]);

  const handleStartSession = (f: number, b: number, s: number, p: ModelProvider, mId: string, keys: ApiKeys, skill: SkillLevel, academic: AcademicLevel, useAcademic: boolean, dynamic: boolean) => {
    setState(prev => ({ 
      ...prev, focusMinutes: f, breakMinutes: b, totalSessions: s, modelProvider: p, selectedModelId: mId, apiKeys: keys, skillLevel: skill, academicLevel: academic, useAcademicLevel: useAcademic, dynamicSkillLevel: dynamic, currentSession: 1, timeLeft: f * 60, isFocusMode: true, isPaused: false, currentScene: 'hub', history: []
    }));
  };

  const getEffectiveLevel = () => state.useAcademicLevel ? state.academicLevel : state.skillLevel;

  const handleSearchGoal = async (goal: string, description: string, file?: File) => {
    setIsLoading(true);
    try {
      let existingContent = undefined;
      if (file) existingContent = await extractTextFromFile(file);
      const curriculum = await generateCurriculum(goal, state.modelProvider, state.selectedModelId, state.apiKeys, getEffectiveLevel(), existingContent, description);
      
      const newSavedCurriculum: SavedCurriculum = {
        id: Math.random().toString(36).substring(2, 9), goal: goal, timestamp: Date.now(), items: curriculum, skillLevel: getEffectiveLevel() as SkillLevel
      };

      setState(prev => {
        const existingIdx = prev.savedCurriculums.findIndex(c => c.goal.toLowerCase() === goal.toLowerCase());
        let updatedSaved = [...prev.savedCurriculums];
        if (existingIdx >= 0) updatedSaved[existingIdx] = newSavedCurriculum;
        else updatedSaved = [newSavedCurriculum, ...prev.savedCurriculums];
        return { ...prev, learningGoal: goal, curriculum, savedCurriculums: updatedSaved, currentScene: 'curriculum', history: [] };
      });
    } catch (err: any) { alert(`Search failed: ${err.message}`); } finally { setIsLoading(false); }
  };

  const handleTopicSelect = (topicName: string, parentId: string | null = null, customInstructions?: string, originalSelectedText?: string) => {
    if (state.dynamicSkillLevel) {
       setPendingAction({ type: 'topic', payload: { name: topicName, parentId, customInstructions, originalSelectedText } });
    } else {
       handleTopicSelectInternal(topicName, parentId, getEffectiveLevel(), customInstructions, originalSelectedText);
    }
  };

  const handleTopicSelectInternal = async (topicName: string, parentId: string | null = null, level: string, customInstructions?: string, originalSelectedText?: string) => {
    const cleanName = topicName.trim().toLowerCase();
    const id = await generateSHA8(cleanName);
    const historyUpdate = state.currentScene === 'topic' && state.selectedTopicId ? [...state.history, state.selectedTopicId] : state.history;

    if (parentId && originalSelectedText && state.topicPages[parentId]) {
        setState(prev => {
            const parentPage = prev.topicPages[parentId];
            const link = `[${originalSelectedText}](${id})`;
            const newRaw = parentPage.rawMarkdown.replace(originalSelectedText, link);
            const newCore = parentPage.coreMarkdown?.replace(originalSelectedText, link);
            const newDeep = parentPage.deepDiveMarkdown?.replace(originalSelectedText, link);
            return {
                ...prev,
                topicPages: {
                    ...prev.topicPages,
                    [parentId]: { ...parentPage, rawMarkdown: newRaw, coreMarkdown: newCore, deepDiveMarkdown: newDeep }
                }
            };
        });
    }

    if (state.topicPages[id]) {
      setState(prev => ({ ...prev, selectedTopicId: id, currentScene: 'topic', history: historyUpdate }));
      return;
    }
    if (state.pendingTasks[id]) return;

    let parentContext = (parentId && state.topicPages[parentId]) ? `Parent: ${state.topicPages[parentId].title}. Context: ${state.topicPages[parentId].definition}` : `Main Goal: ${state.learningGoal}`;

    setState(prev => ({ ...prev, pendingTasks: { ...prev.pendingTasks, [id]: { id, name: topicName, type: 'topic' } }, searchErrors: { ...prev.searchErrors, [id]: '' }, selectedTopicId: id, currentScene: 'topic', history: historyUpdate }));

    try {
      const content = await generateTopicCore(topicName, parentContext, state.modelProvider, state.selectedModelId, state.apiKeys, level, customInstructions);
      if (!content) throw new Error("Connection failed");

      const newPage: TopicPage = {
        id, parentId, title: content.title || topicName, definition: content.definition, 
        rawMarkdown: content.markdown || `# ${topicName}`,
        coreMarkdown: content.markdown,
        keywords: [], timestamp: Date.now(), skillLevel: level as SkillLevel,
        youtubeVideos: [], images: [], trends: []
      };

      setState(prev => {
        const nextTasks = { ...prev.pendingTasks };
        delete nextTasks[id];
        return { ...prev, topicPages: { ...prev.topicPages, [id]: newPage }, pendingTasks: nextTasks };
      });
    } catch (e: any) {
      setState(prev => {
        const nextTasks = { ...prev.pendingTasks };
        delete nextTasks[id];
        return { ...prev, pendingTasks: nextTasks, searchErrors: { ...prev.searchErrors, [id]: e.message || "Failed" } };
      });
    }
  };

  const handleDeepDive = async (id: string) => {
      const page = state.topicPages[id];
      if (!page) return;
      const taskId = `detail_${id}`;
      setState(p => ({ ...p, pendingTasks: { ...p.pendingTasks, [taskId]: { id: taskId, name: 'Deep Diving', type: 'expand_content' } } }));
      let parentContext = page.parentId && state.topicPages[page.parentId] ? state.topicPages[page.parentId].title : '';
      const content = await generateTopicCore(page.title, parentContext, state.modelProvider, state.selectedModelId, state.apiKeys, getEffectiveLevel(), "Provide exhaustive detail.", true);
      setState(p => {
          const nt = { ...p.pendingTasks }; delete nt[taskId];
          if (!content) return { ...p, pendingTasks: nt };
          return { ...p, pendingTasks: nt, topicPages: { ...p.topicPages, [id]: { ...page, deepDiveMarkdown: content.markdown, isDetailed: true } } };
      });
  };

  const handleDefine = async (word: string) => {
     if(!state.selectedTopicId) return;
     const page = state.topicPages[state.selectedTopicId];
     setState(p => ({ ...p, topicPages: { ...p.topicPages, [state.selectedTopicId!]: { ...page, currentDefinition: { word, text: 'Searching...' } } } }));
     const def = await getDefinition(word, page.definition, state.modelProvider, state.selectedModelId, state.apiKeys, getEffectiveLevel());
     if (def) {
         setState(p => ({ ...p, topicPages: { ...p.topicPages, [state.selectedTopicId!]: { ...page, currentDefinition: { word: def.word, text: def.text, source: def.source } } } }));
     }
  };

  const handleLoadEssentials = async (id: string) => {
      const page = state.topicPages[id]; if (!page) return;
      const taskId = `load_essentials_${id}`;
      setState(p => ({ ...p, pendingTasks: { ...p.pendingTasks, [taskId]: { id: taskId, name: 'Essentials', type: 'load_essentials' } } }));
      const result = await generateEssentials(page.title, state.modelProvider, state.selectedModelId, state.apiKeys, getEffectiveLevel());
      setState(p => { const nt = { ...p.pendingTasks }; delete nt[taskId]; return { ...p, pendingTasks: nt, topicPages: { ...p.topicPages, [id]: { ...page, simpleExplanation: result } } }; });
  };

  const handleLoadSignificance = async (id: string) => {
      const page = state.topicPages[id]; if (!page) return;
      const taskId = `load_significance_${id}`;
      setState(p => ({ ...p, pendingTasks: { ...p.pendingTasks, [taskId]: { id: taskId, name: 'Significance', type: 'load_significance' } } }));
      const result = await generateSignificance(page.title, state.modelProvider, state.selectedModelId, state.apiKeys, getEffectiveLevel());
      setState(p => { const nt = { ...p.pendingTasks }; delete nt[taskId]; return { ...p, pendingTasks: nt, topicPages: { ...p.topicPages, [id]: { ...page, significance: result } } }; });
  };

  const handleLoadContext = async (id: string) => {
      const page = state.topicPages[id]; if (!page) return;
      const taskId = `load_context_${id}`;
      setState(p => ({ ...p, pendingTasks: { ...p.pendingTasks, [taskId]: { id: taskId, name: 'Context', type: 'load_context' } } }));
      const result = await generateContext(page.title, state.modelProvider, state.selectedModelId, state.apiKeys, getEffectiveLevel());
      setState(p => { const nt = { ...p.pendingTasks }; delete nt[taskId]; return { ...p, pendingTasks: nt, topicPages: { ...p.topicPages, [id]: { ...page, context: result } } }; });
  };

  const handleLoadYoutube = async (id: string) => {
      const page = state.topicPages[id]; if (!page) return;
      const taskId = `load_youtube_${id}`;
      setState(p => ({ ...p, pendingTasks: { ...p.pendingTasks, [taskId]: { id: taskId, name: 'YouTube', type: 'load_youtube' } } }));
      const result = await fetchTopicResources(page.title, 'youtube', [], getEffectiveLevel());
      setState(p => { const nt = { ...p.pendingTasks }; delete nt[taskId]; return { ...p, pendingTasks: nt, topicPages: { ...p.topicPages, [id]: { ...page, youtubeVideos: result } } }; });
  };

  const handleLoadImages = async (id: string) => {
      const page = state.topicPages[id]; if (!page) return;
      const taskId = `load_images_${id}`;
      setState(p => ({ ...p, pendingTasks: { ...p.pendingTasks, [taskId]: { id: taskId, name: 'Images', type: 'load_images' } } }));
      const result = await fetchTopicResources(page.title, 'images', [], getEffectiveLevel());
      setState(p => { const nt = { ...p.pendingTasks }; delete nt[taskId]; return { ...p, pendingTasks: nt, topicPages: { ...p.topicPages, [id]: { ...page, images: result } } }; });
  };

  const handleLoadQueries = async (id: string) => {
      const page = state.topicPages[id]; if (!page) return;
      const taskId = `more_queries_${id}`;
      setState(p => ({ ...p, pendingTasks: { ...p.pendingTasks, [taskId]: { id: taskId, name: 'Queries', type: 'more_queries' } } }));
      const result = await generateSearchQueries(page.title, state.modelProvider, state.selectedModelId, state.apiKeys, getEffectiveLevel());
      setState(p => { const nt = { ...p.pendingTasks }; delete nt[taskId]; return { ...p, pendingTasks: nt, topicPages: { ...p.topicPages, [id]: { ...page, searchQueries: [...(page.searchQueries || []), ...result] } } }; });
  };

  const handleGenerateConnection = async (labels: string[]) => {
      setIsConnecting(true);
      const result = await generateConnection(labels, state.modelProvider, state.selectedModelId, state.apiKeys, getEffectiveLevel());
      if (result) {
          alert(`Smart Connection Found:\n\nLink: ${result.label}\nReason: ${result.description}`);
      }
      setIsConnecting(false);
  };

  const handleRegenerateRequest = (type: string, id: string) => {
      setPendingAction({ type: 'regenerate', payload: { type, id }, promptText: '' });
  };

  const executeRegeneration = async (promptText: string) => {
      if (!pendingAction || pendingAction.type !== 'regenerate') return;
      const { type, id } = pendingAction.payload;
      const page = state.topicPages[id];
      setPendingAction(null);
      if (!page) return;
      const level = getEffectiveLevel();

      if (type === 'core' || type === 'deepDive') {
           const isDeep = type === 'deepDive';
           const taskId = `regen_${id}`;
           setState(p => ({ ...p, pendingTasks: { ...p.pendingTasks, [taskId]: { id: taskId, name: `Regenerating ${type}`, type: 'topic' } } }));
           let parentContext = page.parentId && state.topicPages[page.parentId] ? state.topicPages[page.parentId].title : '';
           const content = await generateTopicCore(page.title, parentContext, state.modelProvider, state.selectedModelId, state.apiKeys, level, promptText, isDeep);
           setState(p => { 
               const nt={...p.pendingTasks}; delete nt[taskId]; 
               if(!content) return { ...p, pendingTasks: nt };
               const update: any = { definition: content.definition };
               if (isDeep) update.deepDiveMarkdown = content.markdown;
               else { update.coreMarkdown = content.markdown; update.rawMarkdown = content.markdown; }
               return {...p, pendingTasks:nt, topicPages: {...p.topicPages, [id]: {...page, ...update}}}; 
           });
      }
  };

  const handleExpandCurriculum = (itemLabel: string, childrenLabels: string[]) => {
      const level = getEffectiveLevel();
      const taskId = `expand_${itemLabel}`;
      setState(prev => ({ ...prev, pendingTasks: { ...prev.pendingTasks, [taskId]: { id: taskId, name: `Expanding ${itemLabel}`, type: 'expand_curriculum' } } }));
      expandCurriculum(itemLabel, childrenLabels, state.modelProvider, state.selectedModelId, state.apiKeys, level).then(newSubtopics => {
        setState(prev => {
            const updateChildren = (items: CurriculumItem[]): CurriculumItem[] => items.map(item => {
                if (item.label === itemLabel) {
                    const newItems = newSubtopics.map((sub: any, idx: number) => ({ id: `${item.id}_exp_${Date.now()}_${idx}`, label: sub.label, level: `${item.level}.${(item.children?.length||0) + idx + 1}`, description: sub.description, children: [] }));
                    return { ...item, children: [...(item.children||[]), ...newItems] };
                }
                if (item.children) return { ...item, children: updateChildren(item.children) };
                return item;
            });
            const updated = updateChildren(prev.curriculum);
            const nt = { ...prev.pendingTasks }; delete nt[taskId];
            return { ...prev, curriculum: updated, pendingTasks: nt };
        });
      });
  };

  const handleExpandLevel1 = async () => {
     const taskId = 'expand_level1';
     setState(prev => ({ ...prev, pendingTasks: { ...prev.pendingTasks, [taskId]: { id: taskId, name: `Expanding Modules`, type: 'expand_curriculum' } } }));
     const newModules = await expandLevel1Curriculum(state.learningGoal, state.curriculum.map(c => c.label), state.modelProvider, state.selectedModelId, state.apiKeys, getEffectiveLevel());
     setState(prev => {
        const nextIdBase = prev.curriculum.length + 1;
        const newItems: CurriculumItem[] = newModules.map((m: any, i: number) => ({ id: `lvl1_${Date.now()}_${i}`, label: m.label, level: (nextIdBase + i).toString(), description: m.description, children: [] }));
        const nt = { ...prev.pendingTasks }; delete nt[taskId];
        return { ...prev, curriculum: [...prev.curriculum, ...newItems], pendingTasks: nt };
     });
  };

  const handleUpgradeCurriculum = () => {
      setPendingAction({ type: 'upgrade', payload: {} });
  };

  const handleUpgradeCurriculumInternal = async (level: string) => {
      const taskId = 'upgrade_curriculum';
      setState(p => ({ ...p, pendingTasks: { ...p.pendingTasks, [taskId]: { id: taskId, name: 'Upgrading', type: 'upgrade_curriculum' } } }));
      const newCurriculum = await generateCurriculum(state.learningGoal, state.modelProvider, state.selectedModelId, state.apiKeys, level, undefined, `Existing covered: ${state.curriculum.map(c => c.label).join(", ")}`);
      setState(prev => {
         const nt = { ...prev.pendingTasks }; delete nt[taskId];
         return { ...prev, curriculum: newCurriculum, skillLevel: state.useAcademicLevel ? state.skillLevel : level as SkillLevel, academicLevel: state.useAcademicLevel ? level as AcademicLevel : state.academicLevel, pendingTasks: nt };
      });
  };

  const handleDeleteCurriculum = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setState(prev => ({ ...prev, savedCurriculums: prev.savedCurriculums.filter(c => c.id !== id) }));
  };

  if (state.currentScene === 'setup') {
      return (
          <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-blue-500/30 overflow-y-auto">
             <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full" />
             </div>
             <div className="relative z-10">
                <SetupView onStart={handleStartSession} initialProvider={state.modelProvider} initialKeys={state.apiKeys} initialSkillLevel={state.skillLevel} initialAcademicLevel={state.academicLevel} initialUseAcademic={state.useAcademicLevel} initialDynamic={state.dynamicSkillLevel} />
             </div>
          </div>
      )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-neutral-100 selection:bg-blue-500/30">
      <Sidebar 
        currentScene={state.currentScene}
        onNavigate={(scene) => setState(p => ({ ...p, currentScene: scene }))}
        provider={state.modelProvider}
        setProvider={(p) => setState(prev => ({ ...prev, modelProvider: p }))}
        selectedModel={state.selectedModelId}
        setSelectedModel={(m) => setState(prev => ({ ...prev, selectedModelId: m }))}
        apiKeys={state.apiKeys}
        setApiKeys={(k) => setState(prev => ({ ...prev, apiKeys: k }))}
        skillLevel={state.skillLevel}
        setSkillLevel={(l) => setState(prev => ({ ...prev, skillLevel: l }))}
        academicLevel={state.academicLevel}
        setAcademicLevel={(l) => setState(prev => ({ ...prev, academicLevel: l }))}
        useAcademic={state.useAcademicLevel}
        setUseAcademic={(b) => setState(prev => ({ ...prev, useAcademicLevel: b }))}
        dynamicLevel={state.dynamicSkillLevel}
        setDynamicLevel={(b) => setState(prev => ({ ...prev, dynamicSkillLevel: b }))}
        isPaused={state.isPaused}
        togglePause={() => setState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
        timeLeft={state.timeLeft}
        collapsed={state.isSidebarCollapsed}
        setCollapsed={(b) => setState(prev => ({ ...prev, isSidebarCollapsed: b }))}
      />

      <main className="flex-1 relative h-full overflow-hidden flex flex-col transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full" />
        </div>

        {state.currentScene !== 'graph' && (
            <div className="absolute top-6 right-6 z-40 flex items-center gap-3">
                <button onClick={() => setShowNotes(true)} className="px-4 py-2 rounded-xl glass hover:bg-white/10 transition-all text-sm font-medium border border-white/5 shadow-lg">Notes</button>
                {Object.keys(state.pendingTasks).length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 glass"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /><span className="text-[10px] font-bold text-blue-500 uppercase">Thinking...</span></div>
                )}
            </div>
        )}

        <div className={`flex-1 overflow-y-auto no-scrollbar relative z-10 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
            {state.currentScene === 'hub' && <HubView onSearch={handleSearchGoal} savedCurriculums={state.savedCurriculums} onSelectCurriculum={(c) => setState(p => ({...p, learningGoal: c.goal, curriculum: c.items, currentScene: 'curriculum'}))} onDeleteCurriculum={handleDeleteCurriculum} />}
            {state.currentScene === 'curriculum' && <CurriculumView curriculum={state.curriculum} onSelect={handleTopicSelect} topicPages={state.topicPages} pendingTasks={state.pendingTasks} onExpand={handleExpandCurriculum} onExpandLevel1={handleExpandLevel1} onUpgrade={handleUpgradeCurriculum} />}
            {state.currentScene === 'topic' && state.selectedTopicId && <TopicDetailView 
                page={state.topicPages[state.selectedTopicId]} onBack={() => { const h=[...state.history]; const p=h.pop(); setState(s=>({...s, selectedTopicId:p||null, history:h, currentScene:p?'topic':'curriculum'})) }} 
                onSubSearch={handleTopicSelect} onDefine={handleDefine} topicPages={state.topicPages} pendingTasks={state.pendingTasks} errors={state.searchErrors} onRetry={() => {}} onCancel={() => {}} onTrendSearch={() => {}} onDelete={(id) => { const n={...state.topicPages}; delete n[id]; setState(s=>({...s, topicPages:n, currentScene:'curriculum'})) }} 
                onDeepDive={(id) => handleDeepDive(id)} 
                onLoadEssentials={handleLoadEssentials} onLoadSignificance={handleLoadSignificance} onLoadContext={handleLoadContext} onLoadYoutube={handleLoadYoutube} onLoadImages={handleLoadImages} onLoadQueries={handleLoadQueries}
                onRegenerate={handleRegenerateRequest}
            />}
            {state.currentScene === 'graph' && <GraphView pages={state.topicPages} curriculum={state.curriculum} rootLabel={state.learningGoal} onClose={() => setState(p => ({ ...p, currentScene: 'hub' }))} onNavigate={(id) => setState(p => ({ ...p, selectedTopicId: id, currentScene: 'topic' }))} onGenerateConnection={handleGenerateConnection} isConnecting={isConnecting} />}
        </div>
      </main>

      {pendingAction && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
              <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl">
                  {pendingAction.type === 'regenerate' ? (
                      <>
                        <h2 className="text-2xl font-black">Regenerate</h2>
                        <textarea value={pendingAction.promptText} onChange={(e) => setPendingAction({...pendingAction, promptText: e.target.value})} className="w-full h-32 bg-neutral-800 rounded-xl p-4 text-sm" placeholder="Any instructions?" />
                        <button onClick={() => executeRegeneration(pendingAction.promptText || '')} className="py-3 bg-blue-600 rounded-xl font-bold">Regenerate</button>
                      </>
                  ) : (
                      <>
                        <h2 className="text-2xl font-black text-center">Select Difficulty</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {(state.useAcademicLevel ? ACADEMIC_LEVELS : SKILL_LEVELS).map(level => (
                                <button key={level} onClick={() => { 
                                    if(pendingAction.type==='topic') handleTopicSelectInternal(pendingAction.payload.name, pendingAction.payload.parentId, level, pendingAction.payload.customInstructions, pendingAction.payload.originalSelectedText);
                                    if(pendingAction.type==='upgrade') handleUpgradeCurriculumInternal(level);
                                    setPendingAction(null); 
                                }} className="py-4 rounded-xl bg-white/5 font-bold">{level}</button>
                            ))}
                        </div>
                      </>
                  )}
                  <button onClick={() => setPendingAction(null)} className="text-xs font-bold uppercase text-neutral-500">Cancel</button>
              </div>
          </div>
      )}
      
      {showNotes && <NotesOverlay notes={state.notes} onSave={(n) => setState(p => ({ ...p, notes: n }))} onClose={() => setShowNotes(false)} />}
    </div>
  );
};

export default App;
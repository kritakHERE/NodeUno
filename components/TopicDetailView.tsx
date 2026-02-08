import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { TopicPage, ResourceLink, PendingTask } from '../types';

interface TopicDetailViewProps {
  page: TopicPage | undefined;
  onBack: () => void;
  onSubSearch: (name: string, parentId: string, customInstructions?: string, originalSelectedText?: string) => void;
  onDefine: (word: string) => void;
  topicPages: Record<string, TopicPage>;
  pendingTasks: Record<string, PendingTask>;
  errors: Record<string, string>;
  onRetry: (name: string) => void;
  onCancel: (id: string) => void;
  onTrendSearch: (id: string) => void;
  onDelete: (id: string) => void;
  onLoadYoutube: (id: string) => void;
  onLoadEssentials: (id: string) => void;
  onLoadSignificance: (id: string) => void;
  onLoadContext: (id: string) => void;
  onLoadImages: (id: string) => void;
  onLoadQueries: (id: string) => void;
  onDeepDive: (id: string) => void;
  onRegenerate: (type: string, id: string) => void;
}

const TopicDetailView: React.FC<TopicDetailViewProps> = (props) => {
  const { page, pendingTasks, onRegenerate } = props;
  const [selectedText, setSelectedText] = useState('');
  const [selectionRect, setSelectionRect] = useState<{ x: number, y: number } | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [customNodePrompt, setCustomNodePrompt] = useState('');
  const [showNodePrompt, setShowNodePrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<'core' | 'deepDive'>('core');
  
  const currentId = page?.id;
  const isPending = currentId && !!pendingTasks[currentId];
  const isEssentialsLoading = currentId ? !!pendingTasks[`load_essentials_${currentId}`] : false;
  const isSignificanceLoading = currentId ? !!pendingTasks[`load_significance_${currentId}`] : false;
  const isContextLoading = currentId ? !!pendingTasks[`load_context_${currentId}`] : false;
  const isQueriesLoading = currentId ? !!pendingTasks[`more_queries_${currentId}`] : false;
  const isDeepDivePending = currentId ? !!pendingTasks[`detail_${currentId}`] : false;

  const handleTextSelect = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 1) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect) {
        setSelectionRect({ x: rect.left + rect.width / 2, y: rect.top - 10 });
        setSelectedText(text);
      }
    } else {
      setSelectedText('');
      setSelectionRect(null);
    }
  };

  const handleCreateNode = () => {
    if(!selectedText) return;
    setShowNodePrompt(true);
  };

  const submitCreateNode = () => {
    props.onSubSearch(selectedText, page!.id, customNodePrompt, selectedText);
    setShowNodePrompt(false);
    setCustomNodePrompt('');
    setSelectedText('');
    setSelectionRect(null);
  }

  if (!page && isPending) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-6 p-12 glass border border-blue-500/20 rounded-[3rem]">
           <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
           <p className="text-neutral-500 font-medium uppercase">Generating Knowledge Node...</p>
        </div>
      </div>
    );
  }

  if (!page) return null;

  const activeContent = activeTab === 'deepDive' && page.deepDiveMarkdown 
      ? page.deepDiveMarkdown 
      : (page.coreMarkdown || page.rawMarkdown);

  return (
    <div className="max-w-4xl mx-auto pb-32">
      {expandedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-8" onClick={() => setExpandedImage(null)}>
          <img src={expandedImage} className="max-w-full max-h-full rounded-2xl shadow-2xl" />
        </div>
      )}
      
      {showNodePrompt && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-8 flex flex-col gap-4">
                <h3 className="text-xl font-bold uppercase">New Node: {selectedText}</h3>
                <textarea value={customNodePrompt} onChange={e => setCustomNodePrompt(e.target.value)} placeholder="Instructions..." className="w-full bg-neutral-800 rounded-xl p-3 text-sm outline-none h-24" />
                <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowNodePrompt(false)} className="px-4 py-2 text-xs font-bold text-neutral-500 uppercase">Cancel</button>
                    <button onClick={submitCreateNode} className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold uppercase">Create</button>
                </div>
            </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-10">
        <button onClick={props.onBack} className="flex items-center gap-2 text-neutral-500 hover:text-white font-bold uppercase text-xs"><i className="fa-solid fa-arrow-left"></i> Back</button>
        <div className="flex gap-4">
          <button onClick={() => props.onDelete(page.id)} className="w-10 h-10 rounded-xl glass border border-red-500/20 text-red-500 flex items-center justify-center"><i className="fa-solid fa-trash"></i></button>
        </div>
      </div>

      <div className="mb-12">
        <h1 className="text-6xl font-black mb-6 tracking-tighter leading-none uppercase">{page.title}</h1>
        
        <div className="flex items-center gap-2 mb-4 bg-white/5 w-fit p-1 rounded-xl border border-white/10">
            <button onClick={() => setActiveTab('core')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${activeTab === 'core' ? 'bg-blue-600 text-white' : 'text-neutral-500'}`}>Overview</button>
            <button onClick={() => { if (page.deepDiveMarkdown) setActiveTab('deepDive'); else props.onDeepDive(page.id); }} disabled={isDeepDivePending} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 ${activeTab === 'deepDive' ? 'bg-purple-600 text-white' : 'text-neutral-500'}`}>
                {isDeepDivePending && <i className="fa-solid fa-spinner animate-spin"></i>}
                Deep Dive {page.deepDiveMarkdown ? '(Ready)' : '(Generate)'}
            </button>
        </div>

        <div className="bg-neutral-900/40 p-12 rounded-[3rem] border border-white/5 relative min-h-[400px]" onMouseUp={handleTextSelect}>
            <div className="absolute top-6 right-6 z-10 flex gap-2">
                <button onClick={() => props.onRegenerate(activeTab, page.id)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-neutral-300 hover:text-white uppercase"><i className="fa-solid fa-arrows-rotate mr-2"></i> Regenerate</button>
            </div>
            <div className="prose prose-invert prose-lg max-w-none prose-p:text-neutral-300">
                <ReactMarkdown components={{ 
                    a: ({node, ...anchorProps}) => {
                        if (anchorProps.href && !anchorProps.href.startsWith('http')) {
                            return <span onClick={() => props.onSubSearch(anchorProps.href || '', page.id)} className="cursor-pointer text-blue-400 font-bold underline decoration-2 underline-offset-4 decoration-blue-500/50 hover:bg-blue-500/20 px-1 rounded transition-all">{anchorProps.children}</span>;
                        }
                        return <a {...anchorProps} target="_blank" className="text-blue-400 font-bold hover:underline" />;
                    }
                }}>{activeContent}</ReactMarkdown>
            </div>
             {selectionRect && selectedText && (
              <div className="fixed z-[60] glass border border-blue-500/50 rounded-2xl p-2 flex items-center gap-2 shadow-2xl" style={{ left: selectionRect.x, top: selectionRect.y, transform: 'translate(-50%, -100%)' }}>
                <button onClick={() => { props.onDefine(selectedText); setSelectedText(''); setSelectionRect(null); }} className="px-4 py-2 bg-neutral-800 rounded-xl text-xs font-bold uppercase">Define</button>
                <div className="w-[1px] h-4 bg-white/10" />
                <button onClick={handleCreateNode} className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold uppercase">Create Node</button>
              </div>
            )}
        </div>
        
        {page.currentDefinition && (
          <div className="mt-8 p-6 rounded-3xl glass border border-yellow-500/20 bg-yellow-500/5">
              <span className="text-[10px] font-black uppercase text-yellow-500">{page.currentDefinition.word}</span>
              <p className="text-lg text-neutral-200 font-medium italic mt-2">"{page.currentDefinition.text}"</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="p-10 rounded-[3rem] glass border border-white/5 flex flex-col min-h-[200px]">
          <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-black flex items-center gap-3 uppercase"><i className="fa-solid fa-graduation-cap text-blue-400"></i> Essentials</h3></div>
          {page.simpleExplanation ? <p className="text-neutral-400 font-medium italic leading-relaxed">"{page.simpleExplanation}"</p> : <button onClick={() => props.onLoadEssentials(page.id)} disabled={isEssentialsLoading} className="mt-auto py-3 rounded-xl border border-white/10 text-xs font-bold text-neutral-500 uppercase">Load Simplification</button>}
        </div>
        <div className="p-10 rounded-[3rem] glass border border-purple-500/10 flex flex-col min-h-[200px]">
          <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-black flex items-center gap-3 uppercase"><i className="fa-solid fa-rocket text-purple-400"></i> Significance</h3></div>
          {page.significance ? <p className="text-sm text-neutral-300 font-medium">{page.significance}</p> : <button onClick={() => props.onLoadSignificance(page.id)} disabled={isSignificanceLoading} className="mt-auto py-3 rounded-xl border border-white/10 text-xs font-bold text-neutral-500 uppercase">Load Significance</button>}
        </div>
      </div>

      <section className="mb-16">
        <h3 className="text-4xl font-black mb-10 uppercase">Deep Search Queries</h3>
        {(!page.searchQueries || page.searchQueries.length === 0) ? (
            <button onClick={() => props.onLoadQueries(page.id)} disabled={isQueriesLoading} className="w-full py-8 rounded-3xl border-2 border-dashed border-white/10 text-neutral-500 font-bold uppercase">Generate Queries</button>
        ) : (
            <div className="grid grid-cols-1 gap-3">
                {page.searchQueries.map((q, i) => (
                    <div key={i} className="p-6 rounded-2xl glass border border-white/5 flex flex-col md:flex-row items-center justify-between group gap-4">
                        <span className="font-bold text-lg text-neutral-300">"{q}"</span>
                        <div className="flex gap-2">
                            <a href={`https://www.google.com/search?q=${encodeURIComponent(q)}`} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 border border-white/5 text-xs font-bold text-neutral-500 hover:text-white hover:bg-blue-600 transition-all uppercase"><i className="fa-brands fa-google"></i> Google</a>
                            <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 border border-white/5 text-xs font-bold text-neutral-500 hover:text-white hover:bg-red-600 transition-all uppercase"><i className="fa-brands fa-youtube"></i> YouTube</a>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </section>
    </div>
  );
};

export default TopicDetailView;
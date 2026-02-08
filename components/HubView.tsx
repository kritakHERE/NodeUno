
import React, { useState, useRef } from 'react';
import { SavedCurriculum } from '../types';

interface HubViewProps {
  onSearch: (goal: string, description: string, file?: File) => void;
  savedCurriculums: SavedCurriculum[];
  onSelectCurriculum: (curriculum: SavedCurriculum) => void;
  onDeleteCurriculum: (id: string, e: React.MouseEvent) => void;
}

const HubView: React.FC<HubViewProps> = ({ onSearch, savedCurriculums, onSelectCurriculum, onDeleteCurriculum }) => {
  const [input, setInput] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onSearch(input.trim(), description.trim(), selectedFile || undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col items-center pt-20 pb-20">
      <div className="w-full text-center mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="inline-block p-4 mb-8 rounded-3xl glass border border-blue-500/20 animate-bounce">
          <i className="fa-solid fa-brain text-4xl text-blue-400"></i>
        </div>
        <h1 className="text-6xl font-black mb-4 tracking-tighter leading-none">
          What do you want <br/> to <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">master</span> today?
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl relative group mb-8 animate-in fade-in zoom-in duration-500 delay-100 flex flex-col gap-4">
        <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Quantum Computing, Italian Cuisine..."
              className="w-full bg-neutral-900 border-2 border-white/5 group-hover:border-blue-500/30 focus:border-blue-500 rounded-[2.5rem] px-10 py-8 text-2xl font-semibold outline-none transition-all shadow-2xl"
              autoFocus
            />
            <button 
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white transition-all shadow-xl active:scale-90"
            >
              <i className="fa-solid fa-arrow-right text-xl"></i>
            </button>
        </div>

        {/* Description / Wishes Section */}
        <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe specifically what you want (e.g., 'Focus on practical examples', 'Include history of X', 'I am a beginner')..."
            className="w-full bg-neutral-900/50 border-2 border-white/5 focus:border-blue-500/30 rounded-3xl px-8 py-4 text-sm font-medium outline-none transition-all resize-none h-24 placeholder:text-neutral-600"
        />

        {/* File Upload Section */}
        <div className="flex justify-center">
             <input 
               type="file" 
               accept=".txt,.pdf" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               className="hidden" 
             />
             {selectedFile ? (
               <div className="flex items-center gap-4 px-6 py-3 rounded-2xl glass border border-green-500/30 bg-green-500/10">
                  <div className="flex items-center gap-2 text-green-400">
                    <i className="fa-solid fa-file-circle-check text-xl"></i>
                    <div className="flex flex-col text-left">
                        <span className="text-xs font-bold uppercase tracking-widest">Plan Uploaded</span>
                        <span className="text-sm font-medium line-clamp-1 max-w-[200px]">{selectedFile.name}</span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="w-8 h-8 rounded-full hover:bg-red-500/20 text-neutral-500 hover:text-red-500 flex items-center justify-center transition-colors"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
               </div>
             ) : (
               <button 
                 type="button" 
                 onClick={() => fileInputRef.current?.click()}
                 className="flex items-center gap-2 px-5 py-2 rounded-xl border border-white/10 hover:border-blue-500/50 hover:bg-white/5 transition-all text-neutral-400 hover:text-blue-400"
               >
                 <i className="fa-solid fa-paperclip"></i>
                 <span className="text-xs font-bold uppercase tracking-widest">Attach Existing Plan (PDF/TXT)</span>
               </button>
             )}
        </div>
      </form>

      {savedCurriculums.length > 0 && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-neutral-400 px-4">
             <i className="fa-solid fa-layer-group"></i> Your Learning Paths
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCurriculums.map(saved => (
              <div 
                key={saved.id}
                onClick={() => onSelectCurriculum(saved)}
                className="group relative p-8 rounded-[2rem] glass border border-white/5 hover:border-blue-500/50 hover:bg-white/5 transition-all cursor-pointer shadow-lg hover:shadow-blue-500/10"
              >
                 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => onDeleteCurriculum(saved.id, e)}
                      className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-colors"
                    >
                      <i className="fa-solid fa-trash text-xs"></i>
                    </button>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-6 shadow-inner">
                    <span className="text-xl font-black text-white">{saved.goal.substring(0, 1).toUpperCase()}</span>
                 </div>
                 <h3 className="text-xl font-bold mb-2 line-clamp-1">{saved.goal}</h3>
                 <div className="flex items-center gap-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                   <span><i className="fa-solid fa-sitemap mr-1"></i> {saved.items.length} Modules</span>
                   <span><i className="fa-regular fa-clock mr-1"></i> {new Date(saved.timestamp).toLocaleDateString()}</span>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {savedCurriculums.length === 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-4 opacity-40">
          {['Advanced Rust', 'Music Theory', 'Stock Trading', 'Biohacking'].map(tag => (
            <button 
              key={tag} 
              onClick={() => setInput(tag)}
              className="px-6 py-2 rounded-full border border-white/10 hover:border-white/30 text-sm font-medium transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HubView;

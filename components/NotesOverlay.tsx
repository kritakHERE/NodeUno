
import React, { useState } from 'react';
import { Note } from '../types';

interface NotesOverlayProps {
  notes: Note[];
  onSave: (notes: Note[]) => void;
  onClose: () => void;
}

const NotesOverlay: React.FC<NotesOverlayProps> = ({ notes, onSave, onClose }) => {
  const [content, setContent] = useState('');

  const handleAdd = () => {
    if (!content.trim()) return;
    const hashtags = content.match(/#[a-z0-9]+/gi) || [];
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      content: content.trim(),
      hashtags,
      timestamp: Date.now()
    };
    onSave([newNote, ...notes]);
    setContent('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="w-full md:w-[400px] h-full glass border-l border-white/10 p-8 flex flex-col gap-6 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mt-12 md:mt-0">
          <h2 className="text-2xl font-black tracking-tight">Quick Notes</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors p-2">
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        <div className="relative">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your notes here... use #hashtags to organize"
            className="w-full h-32 bg-neutral-900/50 border border-white/5 rounded-2xl p-4 text-sm font-medium outline-none focus:border-blue-500/50 transition-all resize-none"
          />
          <button 
            onClick={handleAdd}
            className="absolute bottom-3 right-3 w-10 h-10 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center transition-all active:scale-90"
          >
            <i className="fa-solid fa-plus text-white"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4">
          {notes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-center px-4">
              <i className="fa-solid fa-note-sticky text-4xl mb-4 opacity-20"></i>
              <p className="text-sm font-medium">Your thoughts will appear here. Start noting things down!</p>
            </div>
          ) : (
            notes.map(note => (
              <div key={note.id} className="p-4 rounded-2xl glass border border-white/5 group relative">
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {note.content}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {note.hashtags.map(tag => (
                    <span key={tag} className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{tag}</span>
                  ))}
                </div>
                <button 
                  onClick={() => onSave(notes.filter(n => n.id !== note.id))}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-neutral-600 hover:text-red-500"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesOverlay;

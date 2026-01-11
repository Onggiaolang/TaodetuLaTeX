import React from 'react';
import { Exercise } from '../types';
import { CheckSquare, List, HelpCircle, Image as ImageIcon, Type } from 'lucide-react';

interface ExerciseListProps {
  exercises: Exercise[];
}

const ExerciseList: React.FC<ExerciseListProps> = ({ exercises }) => {
  if (exercises.length === 0) return null;

  const gradientTextClass = "bg-clip-text text-transparent bg-gradient-to-r from-[#fb923c] via-white to-[#22d3ee] animate-gradient";

  return (
    <div className="mt-12 space-y-8">
      <h3 className="text-2xl flex items-center gap-4">
        <div className="p-2 bg-[#fb923c]/20 rounded-lg border border-[#fb923c]/30">
          <List className="w-6 h-6 text-[#fb923c]" />
        </div>
        <span className={`font-black uppercase tracking-[0.2em] ${gradientTextClass}`}>
          Parsed Exercises ({exercises.length})
        </span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises.map((ex, idx) => (
          <div key={ex.id} className="bg-[#1e293b]/50 p-6 rounded-2xl border border-[#d4af37]/10 shadow-lg hover:shadow-[#fb923c]/10 hover:border-[#fb923c]/30 hover:shadow-2xl transition-all group backdrop-blur-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-gradient-to-br from-[#fb923c] to-[#d4af37] text-[#020617] text-xs font-black px-3 py-1.5 rounded-lg shadow-lg">
                Q{idx + 1}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-2 border shadow-sm
                ${ex.type === 'multiple_choice' ? 'bg-blue-950/40 text-blue-400 border-blue-500/30' : 
                  ex.type === 'true_false' ? 'bg-purple-950/40 text-purple-400 border-purple-500/30' :
                  ex.type === 'short_answer' ? 'bg-orange-950/40 text-orange-400 border-orange-500/30' : 'bg-slate-900 text-slate-500 border-slate-800'}
              `}>
                {ex.type === 'multiple_choice' && <List className="w-3 h-3" />}
                {ex.type === 'true_false' && <CheckSquare className="w-3 h-3" />}
                {ex.type === 'short_answer' && <Type className="w-3 h-3" />}
                {ex.type === 'unknown' && <HelpCircle className="w-3 h-3" />}
                {ex.type.replace('_', ' ')}
              </span>
            </div>
            
            <p className="text-[#c5a059] text-sm line-clamp-4 mb-6 font-bold leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity">
              {ex.question}
            </p>

            <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-white/5">
              {ex.tikz && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-950/30 text-amber-400 px-3 py-1 rounded-lg border border-amber-500/30 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> TikZ
                </span>
              )}
              {ex.solution && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-green-950/30 text-green-400 px-3 py-1 rounded-lg border border-green-500/30">
                  Solution
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseList;
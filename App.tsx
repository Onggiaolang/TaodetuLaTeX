import React, { useState, useCallback } from 'react';
import { LaTeXParser } from './services/parser';
import { compileTikz, downloadBlob } from './services/api';
import { DocxService } from './services/docxService';
import FileUpload from './components/FileUpload';
import ExerciseList from './components/ExerciseList';
import { Exercise, ProcessingState } from './types';
import { Download, FileText, Settings, Sparkles, AlertCircle, Loader2, User } from 'lucide-react';

const parser = new LaTeXParser();
const docxService = new DocxService();

// Constants for Image Scaling
const TIKZ_DENSITY = 300;
const WORD_DPI = 96;
const SCALE_FACTOR = WORD_DPI / TIKZ_DENSITY;

const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 400, height: 300 }); // Fallback
    img.src = `data:image/png;base64,${base64}`;
  });
};

function App() {
  const [latexContent, setLatexContent] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('VANHA');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({ 
    status: 'idle', 
    progress: 0, 
    message: '' 
  });

  const handleFileSelect = useCallback((content: string, fileName: string) => {
    setLatexContent(content);
    if (content) {
      setProcessing({ status: 'parsing', progress: 10, message: 'Parsing LaTeX structure...' });
      setTimeout(() => {
        try {
          const parsed = parser.extractExercises(content).map(ex => parser.parseExercise(ex));
          setExercises(parsed);
          setProcessing({ status: 'idle', progress: 0, message: '' });
        } catch (e) {
          setProcessing({ status: 'error', progress: 0, message: 'Failed to parse file.' });
        }
      }, 500);
    } else {
      setExercises([]);
    }
  }, []);

  const handleConvert = async () => {
    if (exercises.length === 0) return;

    setProcessing({ status: 'converting_images', progress: 0, message: 'Starting conversion...' });
    const images = new Map<string, { id: string; base64: string; width: number; height: number }>();
    
    const tikzItems: { id: string; key: string; source: string }[] = [];
    exercises.forEach(ex => {
      if (ex.tikz) tikzItems.push({ id: ex.id, key: `${ex.id}_question`, source: ex.tikz });
      if (ex.solutionTikz) tikzItems.push({ id: ex.id, key: `${ex.id}_solution`, source: ex.solutionTikz });
    });

    const total = tikzItems.length;

    try {
      for (let i = 0; i < total; i++) {
        const item = tikzItems[i];
        setProcessing({ 
          status: 'converting_images', 
          progress: Math.round(((i) / total) * 80), 
          message: `Rendering image ${i + 1} of ${total}...` 
        });

        const res = await compileTikz({
          source: item.source,
          format: 'png',
          density: TIKZ_DENSITY,
          transparent: true
        });

        if (res.ok && res.image_base64) {
          const dims = await getImageDimensions(res.image_base64);
          images.set(item.key, {
            id: item.id,
            base64: res.image_base64,
            width: Math.round(dims.width * SCALE_FACTOR),
            height: Math.round(dims.height * SCALE_FACTOR)
          });
        }
      }

      setProcessing({ status: 'generating_doc', progress: 90, message: 'Constructing Word document...' });
      const blob = await docxService.generateDocx(exercises, images, teacherName);
      downloadBlob(blob, `converted_exam_${new Date().toISOString().slice(0, 10)}.docx`);
      setProcessing({ status: 'completed', progress: 100, message: 'Done! Download started.' });
      setTimeout(() => setProcessing({ status: 'idle', progress: 0, message: '' }), 3000);
    } catch (error) {
      setProcessing({ status: 'error', progress: 0, message: 'An error occurred during conversion.' });
    }
  };

  const gradientTextClass = "bg-clip-text text-transparent bg-gradient-to-r from-[#fb923c] via-white to-[#22d3ee] animate-gradient";

  return (
    <div className="min-h-screen pb-20 bg-[#020617] text-[#d4af37]">
      {/* Header */}
      <div className="bg-[#0f172a] border-b border-[#d4af37]/20 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fb923c] via-white to-[#22d3ee]"></div>
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center">
          
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {['TIKZ ENGINE', 'SMART PARSER', 'WORD OUTPUT'].map((label, idx) => (
              <div key={label} className="flex items-center gap-2 bg-[#d4af37]/5 px-6 py-2.5 rounded-full border border-[#d4af37]/30 backdrop-blur-md shadow-lg">
                {idx === 0 && <Settings className="w-4 h-4 text-[#fb923c]" />}
                {idx === 1 && <FileText className="w-4 h-4 text-[#fb923c]" />}
                {idx === 2 && <Download className="w-4 h-4 text-[#fb923c]" />}
                <span className={`text-xs font-black uppercase tracking-[0.2em] ${gradientTextClass}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center p-4 bg-[#fb923c]/10 rounded-full border border-[#fb923c]/20 mb-8 backdrop-blur-sm">
            <Sparkles className="w-10 h-10 text-[#fb923c]" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none text-center flex flex-col md:block mb-4">
            <span className={gradientTextClass}>
              TẠO ĐỀ TỪ
            </span>
            <span className="text-white md:ml-4">LaTeX</span>
          </h1>

          <p className={`text-xl font-black max-w-2xl text-center uppercase tracking-tight ${gradientTextClass}`}>
            Professional conversion from Exam LaTeX to Word with native TikZ rendering.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 -mt-10">
        <div className="bg-[#0f172a] rounded-3xl shadow-2xl p-8 md:p-12 border border-[#d4af37]/20 backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            <div className="lg:col-span-2 space-y-8">
              <FileUpload onFileSelect={handleFileSelect} />
              
              <div className="space-y-4">
                 <label className={`text-sm font-black uppercase tracking-[0.2em] block pl-1 ${gradientTextClass}`}>
                   PASTE LATEX CONTENT:
                 </label>
                 <textarea
                   className="w-full h-56 p-6 border border-[#d4af37]/20 rounded-2xl focus:ring-2 focus:ring-[#fb923c] focus:border-transparent transition-all font-mono text-sm bg-[#020617]/80 text-[#d4af37] placeholder:text-slate-800 shadow-inner"
                   placeholder="\begin{ex} ... \end{ex}"
                   value={latexContent}
                   onChange={(e) => handleFileSelect(e.target.value, 'Manual Input')}
                 />
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-[#1e293b]/30 rounded-2xl p-8 border border-[#d4af37]/10 shadow-2xl">
                <h3 className="text-xl mb-8 flex items-center gap-3">
                  <Settings className="w-6 h-6 text-[#fb923c]" />
                  <span className={`font-black uppercase tracking-[0.2em] ${gradientTextClass}`}>SETTINGS</span>
                </h3>

                <div className="space-y-8 mb-10">
                  <div>
                    <label className={`text-xs font-black uppercase tracking-[0.2em] block mb-3 opacity-90 ${gradientTextClass}`}>
                      TEACHER NAME
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fb923c] group-focus-within:scale-110 transition-transform" />
                      <input 
                        type="text" 
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        className="w-full bg-[#020617] border border-[#d4af37]/20 rounded-xl py-4 pl-12 pr-4 text-white font-black text-sm focus:ring-2 focus:ring-[#fb923c] focus:outline-none transition-all tracking-wider shadow-lg"
                        placeholder="VANHA"
                      />
                    </div>
                  </div>
                </div>
                
                {exercises.length > 0 ? (
                   <button
                    onClick={handleConvert}
                    disabled={processing.status !== 'idle' && processing.status !== 'completed' && processing.status !== 'error'}
                    className={`
                      w-full py-6 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xl shadow-[0_10px_40px_-10px_rgba(251,146,60,0.4)] transition-all
                      ${processing.status === 'idle' || processing.status === 'completed' || processing.status === 'error'
                        ? 'bg-gradient-to-br from-[#fb923c] to-[#d4af37] hover:brightness-110 text-[#020617] transform hover:-translate-y-1' 
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
                    `}
                   >
                     {processing.status === 'idle' || processing.status === 'completed' || processing.status === 'error' ? (
                       <>
                        <Download className="w-6 h-6 stroke-[3px]" />
                        CONVERT
                       </>
                     ) : (
                       <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        PROCESSING
                       </>
                     )}
                   </button>
                ) : (
                  <div className="text-center py-12 text-slate-700 text-sm font-black uppercase tracking-widest border-2 border-dashed border-slate-800/50 rounded-2xl bg-[#020617]/20">
                    Waiting for input...
                  </div>
                )}

                {processing.status !== 'idle' && (
                  <div className="mt-10 space-y-4 animate-fade-in">
                    <div className={`flex justify-between text-xs font-black uppercase tracking-[0.2em] ${gradientTextClass}`}>
                      <span>{processing.message}</span>
                      <span>{processing.progress}%</span>
                    </div>
                    <div className="h-3 bg-[#020617] rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <div 
                        className={`h-full transition-all duration-700 shadow-[0_0_20px_rgba(251,146,60,0.6)] ${processing.status === 'error' ? 'bg-red-500' : 'bg-gradient-to-r from-[#fb923c] to-white'}`}
                        style={{ width: `${processing.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {exercises.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#020617] p-6 rounded-2xl border border-[#d4af37]/10 text-center group hover:border-[#fb923c]/50 transition-all shadow-xl">
                    <span className="block text-4xl font-black text-white group-hover:text-[#fb923c] transition-colors mb-1">{exercises.length}</span>
                    <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${gradientTextClass}`}>Questions</span>
                  </div>
                  <div className="bg-[#020617] p-6 rounded-2xl border border-[#d4af37]/10 text-center group hover:border-[#22d3ee]/50 transition-all shadow-xl">
                    <span className="block text-4xl font-black text-white group-hover:text-[#22d3ee] transition-colors mb-1">
                      {exercises.filter(e => e.tikz || e.solutionTikz).length}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${gradientTextClass}`}>TikZ Render</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <ExerciseList exercises={exercises} />
        </div>
      </main>
    </div>
  );
}

export default App;
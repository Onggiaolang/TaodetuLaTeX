import React, { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (content: string, fileName: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.tex') && !file.name.endsWith('.txt')) {
      alert('Please upload a .tex or .txt file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileName(file.name);
      onFileSelect(text, file.name);
    };
    reader.readAsText(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  const clearFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName(null);
    onFileSelect('', '');
  }, [onFileSelect]);

  const gradientTextClass = "bg-clip-text text-transparent bg-gradient-to-r from-[#fb923c] via-white to-[#22d3ee] animate-gradient";

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-500 min-h-[280px] flex flex-col items-center justify-center
        ${isDragging ? 'border-[#fb923c] bg-[#fb923c]/10 scale-[1.02]' : 'border-[#d4af37]/20 hover:border-[#fb923c]/50 hover:bg-[#1e293b]/40'}
        ${fileName ? 'bg-[#fb923c]/5 border-[#fb923c]/40' : 'bg-[#020617]/40'}
        shadow-2xl
      `}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input
        type="file"
        id="fileInput"
        className="hidden"
        accept=".tex,.txt"
        onChange={handleChange}
      />
      
      {fileName ? (
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <div className="p-5 bg-[#fb923c]/20 rounded-2xl border border-[#fb923c]/30 shadow-lg">
            <FileText className="w-16 h-16 text-[#fb923c]" />
          </div>
          <div className="text-center">
            <p className={`text-2xl font-black uppercase tracking-wider mb-2 ${gradientTextClass}`}>{fileName}</p>
            <p className="text-xs text-[#c5a059] font-black uppercase tracking-[0.3em] opacity-70">READY TO PARSE</p>
          </div>
          <button 
            onClick={clearFile}
            className="group flex items-center gap-2 px-6 py-2 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest"
          >
            <X className="w-4 h-4" />
            Clear File
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="mx-auto w-24 h-24 bg-[#fb923c]/10 rounded-full flex items-center justify-center border border-[#fb923c]/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
            <Upload className="w-12 h-12 text-[#fb923c] animate-bounce" />
          </div>
          <div>
            <h3 className={`text-3xl font-black uppercase tracking-[0.1em] mb-3 ${gradientTextClass}`}>
              Upload LaTeX File
            </h3>
            <p className="text-[#c5a059] text-sm font-black uppercase tracking-[0.15em] opacity-60">
              Drag & drop or click to browse (.tex, .txt)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
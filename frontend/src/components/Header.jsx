import React, { useState } from 'react';
import { 
  Sparkles, 
  Download, 
  Upload, 
  Settings, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  ChevronDown 
} from 'lucide-react';

export default function Header({
  atsScore,
  hfToken,
  hfModel,
  onOpenHFModal,
  onOpenImportModal,
  onLoadSample,
  onExport
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);

  const scoreVal = atsScore?.overall_score || 0;
  const shortModel = hfModel ? (hfModel.split('/')[1] || hfModel) : 'Mistral 7B';

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">ResumeForge</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                AI &bull; ATS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              FastAPI & Hugging Face GenAI Resume Engine
            </p>
          </div>
        </div>

        {/* Center / Model & Score Badges */}
        <div className="flex items-center gap-2.5">
          {/* ATS Score Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
            scoreVal >= 80 
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
              : scoreVal >= 60 
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
              : 'bg-red-500/15 text-red-400 border border-red-500/30'
          }`}>
            <span className="w-2 h-2 rounded-full animate-ping" style={{
              backgroundColor: scoreVal >= 80 ? '#34d399' : scoreVal >= 60 ? '#fbbf24' : '#f87171'
            }}></span>
            <span>{scoreVal}/100 ATS Score</span>
          </div>

          {/* Model Status Badge */}
          <button
            onClick={onOpenHFModal}
            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition ${
              hfToken 
                ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/20' 
                : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
            }`}
            title="Configure Hugging Face Token & Model"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hfToken ? `🤗 ${shortModel}` : '✨ GenAI (Smart Mode)'}
            </span>
            <Settings className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Samples Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSampleOpen(!sampleOpen)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center gap-1.5"
            >
              <span>Samples</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {sampleOpen && (
              <div 
                className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs"
                onMouseLeave={() => setSampleOpen(false)}
              >
                <button
                  onClick={() => { onLoadSample('software_engineer'); setSampleOpen(false); }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700/80 transition"
                >
                  💻 Senior Software Engineer
                </button>
                <button
                  onClick={() => { onLoadSample('ai_engineer'); setSampleOpen(false); }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700/80 transition"
                >
                  🤖 GenAI / ML Engineer
                </button>
              </div>
            )}
          </div>

          {/* Import Button */}
          <button
            onClick={onOpenImportModal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center gap-1.5"
            title="Upload and parse an existing PDF resume"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Import</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>
            {exportOpen && (
              <div 
                className="absolute right-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs"
                onMouseLeave={() => setExportOpen(false)}
              >
                <button
                  onClick={() => { onExport('pdf'); setExportOpen(false); }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700/80 transition flex items-center gap-2"
                >
                  <span className="text-red-400 font-bold">PDF</span> ATS-Friendly PDF
                </button>
                <button
                  onClick={() => { onExport('docx'); setExportOpen(false); }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700/80 transition flex items-center gap-2"
                >
                  <span className="text-blue-400 font-bold">DOCX</span> Word Document
                </button>
                <button
                  onClick={() => { onExport('txt'); setExportOpen(false); }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700/80 transition flex items-center gap-2"
                >
                  <span className="text-slate-400 font-bold">TXT</span> Plain ATS OCR Text
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

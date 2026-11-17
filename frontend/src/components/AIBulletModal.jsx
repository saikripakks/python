import React from 'react';
import { X, Sparkles, Check, RefreshCw } from 'lucide-react';

export default function AIBulletModal({
  isOpen,
  onClose,
  originalBullet,
  variations,
  isLoading,
  modelUsed,
  onApply
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                AI Bullet Enhancer (Google XYZ Formula)
              </h3>
              <p className="text-[11px] text-slate-400">
                Accomplished [X] as measured by [Y], by doing [Z]
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Original */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Original Bullet:
            </span>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "{originalBullet}"
            </p>
          </div>

          {/* Variations Container */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">
              AI Tailored Variations:
            </span>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-xs text-slate-400 animate-pulse">
                  Querying Hugging Face GenAI Model...
                </p>
              </div>
            ) : (
              variations.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/40 rounded-xl transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      v.type.includes('Metric')
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : v.type.includes('Leadership')
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                        : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    }`}>
                      {v.type}
                    </span>

                    <button
                      onClick={() => onApply(v.text)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-100 font-medium leading-relaxed">
                    {v.text}
                  </p>

                  <p className="text-[11px] text-slate-400 italic">
                    {v.explanation}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Engine: <b className="text-slate-200">{modelUsed || 'GenAI'}</b></span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

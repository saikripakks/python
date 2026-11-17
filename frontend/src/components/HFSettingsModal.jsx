import React, { useState } from 'react';
import { X, Sparkles, Key, Cpu, ShieldCheck } from 'lucide-react';

export default function HFSettingsModal({
  isOpen,
  onClose,
  hfToken,
  hfModel,
  onSave
}) {
  const [token, setToken] = useState(hfToken || '');
  const [model, setModel] = useState(hfModel || 'mistralai/Mistral-7B-Instruct-v0.3');
  const [customModel, setCustomModel] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const chosenModel = isCustom && customModel.trim() ? customModel.trim() : model;
    onSave(token.trim(), chosenModel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Hugging Face GenAI Settings
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure your Hugging Face API key & models
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

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Note about fallback */}
          <div className="p-3 bg-purple-950/40 border border-purple-800/50 rounded-xl text-xs text-purple-200 leading-relaxed">
            <span className="font-semibold block mb-0.5">✨ Intelligent Fallback Mode:</span>
            If you don't have a Hugging Face API token, ResumeForge will automatically run in local smart GenAI mode using our built-in ATS heuristics and Google XYZ enhancement engine.
          </div>

          {/* Token Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-yellow-400" />
              Hugging Face User Access Token (Optional)
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-yellow-400 outline-none transition"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Stored securely in your local browser storage. Get a free token at{' '}
              <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="text-yellow-400 underline">
                huggingface.co/settings/tokens
              </a>
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Inference Model
            </label>
            
            <select
              value={isCustom ? 'custom' : model}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustom(true);
                } else {
                  setIsCustom(false);
                  setModel(e.target.value);
                }
              }}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 outline-none transition"
            >
              <option value="mistralai/Mistral-7B-Instruct-v0.3">Mistral 7B Instruct v0.3 (Recommended)</option>
              <option value="meta-llama/Llama-3.2-3B-Instruct">Meta Llama 3.2 3B Instruct</option>
              <option value="Qwen/Qwen2.5-7B-Instruct">Qwen 2.5 7B Instruct</option>
              <option value="google/gemma-2-2b-it">Google Gemma 2 2B Instruct</option>
              <option value="custom">-- Custom Hugging Face Model ID --</option>
            </select>

            {isCustom && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g. deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"
                className="w-full mt-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 outline-none transition"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

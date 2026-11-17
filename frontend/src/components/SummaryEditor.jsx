import React, { useState } from 'react';
import { AlignLeft, Sparkles, RefreshCw } from 'lucide-react';

export default function SummaryEditor({
  summary,
  targetRole,
  skills,
  hfToken,
  hfModel,
  onChange,
  onNotify
}) {
  const [generating, setGenerating] = useState(false);

  const words = summary ? summary.trim().split(/\s+/).filter(Boolean).length : 0;
  const isOptimal = words >= 30 && words <= 90;

  const handleGenerateSummary = async () => {
    setGenerating(true);
    const flatSkills = [];
    (skills || []).forEach(sc => flatSkills.push(...(sc.skills || [])));

    try {
      const res = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: targetRole || 'Software Professional',
          years_exp: '4+',
          skills: flatSkills.slice(0, 8),
          current_summary: summary || '',
          hf_token: hfToken,
          model: hfModel
        })
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      onChange(data.summary);
      onNotify(`Summary generated via ${data.model_used}!`, 'success');
    } catch (err) {
      onNotify('Failed to generate summary with AI', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-indigo-400" />
            Professional Summary
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ATS engines parse your summary to extract your primary title, industry domain, and core value proposition.
          </p>
        </div>

        <button
          onClick={handleGenerateSummary}
          disabled={generating}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          {generating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{generating ? 'Generating...' : '✨ AI Generate'}</span>
        </button>
      </div>

      <div>
        <textarea
          rows={5}
          value={summary || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Results-driven Senior Software Engineer with 6+ years of experience building resilient distributed systems and real-time APIs using Python, FastAPI, and Kubernetes..."
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs leading-relaxed text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition resize-none"
        />

        <div className="flex items-center justify-between mt-2 text-[11px]">
          <span className={`font-medium ${isOptimal ? 'text-emerald-400' : 'text-amber-400'}`}>
            {words} words {isOptimal ? '✓ (Optimal ATS length: 30-90 words)' : '(Recommended: 30-90 words)'}
          </span>
          <span className="text-slate-500">
            Keep it punchy, metric-oriented, and tailored to your target job title.
          </span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { ShieldCheck, Check, AlertTriangle, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function ATSScoreCard({ atsScore }) {
  if (!atsScore) {
    return (
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-slate-800 rounded mb-4"></div>
      </div>
    );
  }

  const score = atsScore.overall_score || 0;
  const comp = atsScore.completeness_score || 0;
  const action = atsScore.action_verb_score || 0;
  const metrics = atsScore.metrics_score || 0;
  const format = atsScore.formatting_score || 0;

  const getScoreColor = (val, max = 100) => {
    const pct = (val / max) * 100;
    if (pct >= 80) return 'text-emerald-400 bg-emerald-500';
    if (pct >= 60) return 'text-amber-400 bg-amber-500';
    return 'text-red-400 bg-red-500';
  };

  return (
    <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            ATS Compatibility Engine
          </span>
          <h3 className="text-sm font-extrabold text-slate-100 mt-0.5">
            Live Resume Diagnostic
          </h3>
        </div>

        <div className="text-right">
          <div className={`text-3xl font-extrabold tracking-tight ${getScoreColor(score).split(' ')[0]}`}>
            {score}<span className="text-xs font-normal text-slate-400">/100</span>
          </div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase">
            {score >= 80 ? 'ATS Ready' : score >= 60 ? 'Needs Polish' : 'High Risk'}
          </div>
        </div>
      </div>

      {/* Sub Scores Grid */}
      <div className="space-y-3">
        {/* Completeness */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-slate-300">Section Completeness</span>
            <span className="text-slate-400">{comp}/25 pts</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getScoreColor(comp, 25).split(' ')[1]} transition-all duration-500`}
              style={{ width: `${(comp / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Verbs */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-slate-300">Action Verbs & Impact</span>
            <span className="text-slate-400">{action}/25 pts</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getScoreColor(action, 25).split(' ')[1]} transition-all duration-500`}
              style={{ width: `${(action / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* Quantifiable Metrics */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-slate-300">Quantified Results (%)</span>
            <span className="text-slate-400">{metrics}/25 pts</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getScoreColor(metrics, 25).split(' ')[1]} transition-all duration-500`}
              style={{ width: `${(metrics / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* Formatting & Skills */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-slate-300">Formatting & Skills Density</span>
            <span className="text-slate-400">{format}/25 pts</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getScoreColor(format, 25).split(' ')[1]} transition-all duration-500`}
              style={{ width: `${(format / 25) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recommendations Feed */}
      <div>
        <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          ATS Diagnostic Checklist:
        </h4>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {(atsScore.recommendations || []).map((rec, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                rec.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                rec.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                rec.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                'bg-blue-500/10 border-blue-500/30 text-blue-300'
              }`}
            >
              <div className="font-semibold flex items-center gap-1.5 mb-0.5">
                {rec.type === 'error' ? <AlertCircle className="w-3.5 h-3.5 text-red-400" /> :
                 rec.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> :
                 rec.type === 'success' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> :
                 <Info className="w-3.5 h-3.5 text-blue-400" />}
                <span>{rec.title}</span>
              </div>
              <p className="text-[11px] text-slate-300">{rec.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

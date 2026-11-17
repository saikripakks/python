import React, { useState } from 'react';
import { Target, Search, Sparkles, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

export default function JobMatcher({
  jobDescription,
  onJDChange,
  onScanJD,
  onTailorResume,
  jdResults,
  isScanning,
  isTailoring
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            Job Description Keyword Matcher & AI Tailor
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare your resume directly against any target job posting to uncover missing ATS keywords and tailor your application.
          </p>
        </div>
      </div>

      {/* Input Textarea */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300">
          Target Job Description / Posting:
        </label>
        <textarea
          rows={6}
          value={jobDescription || ''}
          onChange={(e) => onJDChange(e.target.value)}
          placeholder="Paste the full job description here (e.g. responsibilities, requirements, qualifications, tech stack)..."
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs leading-relaxed text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition resize-none"
        />

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onScanJD}
            disabled={isScanning || !jobDescription?.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            {isScanning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>{isScanning ? 'Scanning...' : 'Analyze Match'}</span>
          </button>

          {jdResults && (
            <button
              onClick={onTailorResume}
              disabled={isTailoring}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              {isTailoring ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isTailoring ? 'Tailoring Resume...' : '✨ 1-Click AI Tailor to Job'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Box */}
      {jdResults && (
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-extrabold ${
                jdResults.match_score >= 75 ? 'text-emerald-400' :
                jdResults.match_score >= 50 ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {jdResults.match_score}%
              </span>
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {jdResults.match_score >= 75 ? 'Strong ATS Alignment' :
                   jdResults.match_score >= 50 ? 'Moderate Match' : 'Low Keyword Overlap'}
                </div>
                <div className="text-[11px] text-slate-400">
                  Matched {jdResults.matched_keywords?.length || 0} keywords &bull; {jdResults.missing_keywords?.length || 0} missing
                </div>
              </div>
            </div>

            <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  jdResults.match_score >= 75 ? 'bg-emerald-500' :
                  jdResults.match_score >= 50 ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${jdResults.match_score}%` }}
              ></div>
            </div>
          </div>

          {/* Missing Keywords */}
          <div>
            <div className="text-xs font-semibold text-red-300 flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Missing Critical Keywords (High Priority for ATS):</span>
            </div>
            {jdResults.missing_keywords?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {jdResults.missing_keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-red-500/10 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium"
                  >
                    + {kw}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No missing keywords found! Fantastic job.</p>
            )}
          </div>

          {/* Matched Keywords */}
          <div>
            <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Found & Matched Keywords:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(jdResults.matched_keywords || []).map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium"
                >
                  ✓ {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

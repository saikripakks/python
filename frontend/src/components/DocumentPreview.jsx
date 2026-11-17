import React, { useState } from 'react';
import { Eye, FileCode2, Copy, Check } from 'lucide-react';

export default function DocumentPreview({ resume, rawText }) {
  const [viewMode, setViewMode] = useState('paper'); // 'paper' | 'xray'
  const [copied, setCopied] = useState(false);

  const p = resume?.personal_info || {};

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(rawText || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* View Switcher Controls */}
      <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('paper')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'paper'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>ATS Paper View</span>
          </button>

          <button
            onClick={() => setViewMode('xray')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'xray'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>ATS Robot X-Ray</span>
          </button>
        </div>

        {viewMode === 'xray' && (
          <button
            onClick={handleCopyRaw}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition flex items-center gap-1"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>
        )}
      </div>

      {/* Main Preview Container */}
      {viewMode === 'paper' ? (
        <div className="ats-paper rounded-xl overflow-hidden text-slate-900">
          {/* Header */}
          <div className="text-center pb-3 border-b border-slate-300">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {p.full_name ? p.full_name.toUpperCase() : 'YOUR FULL NAME'}
            </h1>
            {p.target_role && (
              <p className="text-xs text-slate-600 font-medium mt-0.5">{p.target_role}</p>
            )}
            <p className="text-[10px] text-slate-600 mt-1 space-x-1.5">
              {[p.email, p.phone, p.location, p.linkedin, p.github, p.portfolio]
                .filter(Boolean)
                .map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && ' • '}
                  </span>
                ))}
            </p>
          </div>

          {/* Professional Summary */}
          {resume?.summary && resume.summary.trim() && (
            <div className="mt-3">
              <div className="ats-section-title">Professional Summary</div>
              <p className="text-[10px] text-slate-800 leading-relaxed">
                {resume.summary}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {resume?.work_experience?.length > 0 && (
            <div className="mt-3">
              <div className="ats-section-title">Work Experience</div>
              <div className="space-y-2.5">
                {resume.work_experience.map((exp, idx) => (
                  <div key={idx}>
                    <div className="ats-item-header">
                      <div>
                        <b>{exp.role || 'Role'}</b>, {exp.company || 'Company'}
                        {exp.location ? ` | ${exp.location}` : ''}
                      </div>
                      <div className="font-semibold text-slate-600 text-[10px]">
                        {exp.start_date} – {exp.current ? 'Present' : exp.end_date}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      {(exp.bullets || []).map((b, bIdx) =>
                        b.trim() ? (
                          <div key={bIdx} className="ats-bullet">
                            {b}
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resume?.education?.length > 0 && (
            <div className="mt-3">
              <div className="ats-section-title">Education</div>
              <div className="space-y-2">
                {resume.education.map((edu, idx) => (
                  <div key={idx}>
                    <div className="ats-item-header">
                      <div>
                        <b>{edu.degree}</b> in {edu.field_of_study} – {edu.institution}
                        {edu.location ? ` | ${edu.location}` : ''}
                      </div>
                      <div className="font-semibold text-slate-600 text-[10px]">
                        {edu.graduation_date}
                      </div>
                    </div>
                    {(edu.gpa || edu.honors) && (
                      <div className="text-[9.5px] text-slate-600 italic">
                        {[edu.gpa ? `GPA: ${edu.gpa}` : '', edu.honors].filter(Boolean).join(' • ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {resume?.skills?.length > 0 && (
            <div className="mt-3">
              <div className="ats-section-title">Technical Skills</div>
              <div className="space-y-1">
                {resume.skills.map((sc, idx) => (
                  <div key={idx} className="text-[10px] text-slate-800">
                    <b>{sc.category}:</b> {(sc.skills || []).join(', ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resume?.projects?.length > 0 && (
            <div className="mt-3">
              <div className="ats-section-title">Projects</div>
              <div className="space-y-2">
                {resume.projects.map((proj, idx) => (
                  <div key={idx}>
                    <div className="ats-item-header">
                      <div>
                        <b>{proj.title}</b>
                        {proj.tech_stack?.length > 0 && (
                          <span className="font-normal italic text-slate-600">
                            {' '}({proj.tech_stack.join(', ')})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      {(proj.bullets || []).map((b, bIdx) =>
                        b.trim() ? (
                          <div key={bIdx} className="ats-bullet">
                            {b}
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {resume?.certifications?.length > 0 && (
            <div className="mt-3">
              <div className="ats-section-title">Certifications</div>
              <div className="space-y-1">
                {resume.certifications.map((cert, idx) => (
                  <div key={idx} className="ats-bullet">
                    <b>{cert.name}</b> – {cert.issuer} ({cert.date})
                    {cert.credential_id && ` [ID: ${cert.credential_id}]`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="ats-xray-view">
          {rawText || 'Generating ATS OCR text stream...'}
        </div>
      )}
    </div>
  );
}

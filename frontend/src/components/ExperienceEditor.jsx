import React from 'react';
import { Briefcase, Plus, Trash2, Sparkles, Calendar, MapPin, Building, Award } from 'lucide-react';

export default function ExperienceEditor({
  experience,
  onChange,
  onPolishBullet
}) {
  const addExperience = () => {
    const newEntry = {
      id: `exp-${Date.now()}`,
      company: '',
      role: '',
      location: '',
      start_date: '',
      end_date: '',
      current: true,
      bullets: ['Spearheaded strategic engineering initiative, accelerating delivery throughput by 35%.']
    };
    onChange([newEntry, ...experience]);
  };

  const removeExperience = (idx) => {
    const updated = [...experience];
    updated.splice(idx, 1);
    onChange(updated);
  };

  const updateField = (idx, field, value) => {
    const updated = [...experience];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const toggleCurrent = (idx, checked) => {
    const updated = [...experience];
    updated[idx] = { 
      ...updated[idx], 
      current: checked, 
      end_date: checked ? 'Present' : '' 
    };
    onChange(updated);
  };

  const addBullet = (expIdx) => {
    const updated = [...experience];
    updated[expIdx].bullets = [
      ...updated[expIdx].bullets, 
      'Engineered distributed caching layer, reducing API latency by 40%.'
    ];
    onChange(updated);
  };

  const removeBullet = (expIdx, bIdx) => {
    const updated = [...experience];
    const newBullets = [...updated[expIdx].bullets];
    newBullets.splice(bIdx, 1);
    updated[expIdx].bullets = newBullets;
    onChange(updated);
  };

  const updateBullet = (expIdx, bIdx, value) => {
    const updated = [...experience];
    const newBullets = [...updated[expIdx].bullets];
    newBullets[bIdx] = value;
    updated[expIdx].bullets = newBullets;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            Work Experience
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ATS engines evaluate job titles, company seniority, and action-verb metric density in bullet points.
          </p>
        </div>

        <button
          onClick={addExperience}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Experience</span>
        </button>
      </div>

      <div className="space-y-4">
        {experience.map((exp, expIdx) => (
          <div
            key={exp.id || expIdx}
            className="p-4 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-xl space-y-3 transition"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                Experience #{expIdx + 1}
              </span>
              <button
                onClick={() => removeExperience(expIdx)}
                className="text-xs text-red-400 hover:text-red-300 font-medium transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Company / Organization *</label>
                <input
                  type="text"
                  value={exp.company || ''}
                  onChange={(e) => updateField(expIdx, 'company', e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Job Title / Role *</label>
                <input
                  type="text"
                  value={exp.role || ''}
                  onChange={(e) => updateField(expIdx, 'role', e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Start Date *</label>
                <input
                  type="text"
                  value={exp.start_date || ''}
                  onChange={(e) => updateField(expIdx, 'start_date', e.target.value)}
                  placeholder="e.g. Mar 2022"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">End Date</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={exp.end_date || ''}
                    disabled={exp.current}
                    onChange={(e) => updateField(expIdx, 'end_date', e.target.value)}
                    placeholder="e.g. Present"
                    className={`w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none ${
                      exp.current ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  />
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 whitespace-nowrap cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!exp.current}
                      onChange={(e) => toggleCurrent(expIdx, e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    Present
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  value={exp.location || ''}
                  onChange={(e) => updateField(expIdx, 'location', e.target.value)}
                  placeholder="e.g. San Francisco, CA (or Remote)"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Bullets */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  Key Achievements & Responsibilities (XYZ Formula)
                </label>
                <button
                  onClick={() => addBullet(expIdx)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Bullet</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {(exp.bullets || []).map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2 group">
                    <span className="text-slate-500 mt-2 select-none">•</span>
                    <textarea
                      rows={2}
                      value={bullet}
                      onChange={(e) => updateBullet(expIdx, bIdx, e.target.value)}
                      placeholder="e.g. Spearheaded microservices migration, reducing latency by 45%..."
                      className="flex-1 bg-slate-800/80 border border-slate-700/80 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-100 outline-none resize-none transition leading-relaxed"
                    />
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => onPolishBullet(expIdx, bIdx, false)}
                        title="AI Polish: Transform into Google XYZ formula with metrics and power verbs"
                        className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-md text-xs font-medium transition flex items-center gap-1 shadow-sm whitespace-nowrap"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span className="hidden sm:inline">AI Polish</span>
                      </button>
                      <button
                        onClick={() => removeBullet(expIdx, bIdx)}
                        title="Delete bullet"
                        className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-md text-xs transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

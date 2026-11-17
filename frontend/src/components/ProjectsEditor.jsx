import React from 'react';
import { FolderGit2, Plus, Trash2, Sparkles, Link as LinkIcon, Code } from 'lucide-react';

export default function ProjectsEditor({
  projects,
  onChange,
  onPolishBullet
}) {
  const addProject = () => {
    const newProj = {
      id: `proj-${Date.now()}`,
      title: '',
      role: 'Lead Developer',
      tech_stack: ['Python', 'Docker'],
      link: '',
      bullets: ['Architected scalable module handling 10,000 asynchronous events per minute.']
    };
    onChange([...projects, newProj]);
  };

  const removeProject = (idx) => {
    const updated = [...projects];
    updated.splice(idx, 1);
    onChange(updated);
  };

  const updateField = (idx, field, value) => {
    const updated = [...projects];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const updateTechStack = (idx, value) => {
    const updated = [...projects];
    updated[idx].tech_stack = value.split(',').map(s => s.trim()).filter(Boolean);
    onChange(updated);
  };

  const addBullet = (pIdx) => {
    const updated = [...projects];
    updated[pIdx].bullets = [
      ...updated[pIdx].bullets, 
      'Automated CI/CD deployment pipeline, reducing testing turnaround by 45%.'
    ];
    onChange(updated);
  };

  const removeBullet = (pIdx, bIdx) => {
    const updated = [...projects];
    const newBullets = [...updated[pIdx].bullets];
    newBullets.splice(bIdx, 1);
    updated[pIdx].bullets = newBullets;
    onChange(updated);
  };

  const updateBullet = (pIdx, bIdx, value) => {
    const updated = [...projects];
    const newBullets = [...updated[pIdx].bullets];
    newBullets[bIdx] = value;
    updated[pIdx].bullets = newBullets;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-indigo-400" />
            Key Technical Projects
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Highlight open-source contributions, distributed applications, or portfolio deliverables.
          </p>
        </div>

        <button
          onClick={addProject}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Project</span>
        </button>
      </div>

      <div className="space-y-4">
        {projects.map((proj, pIdx) => (
          <div
            key={proj.id || pIdx}
            className="p-4 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-xl space-y-3 transition"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Project #{pIdx + 1}
              </span>
              <button
                onClick={() => removeProject(pIdx)}
                className="text-xs text-red-400 hover:text-red-300 font-medium transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Title *</label>
                <input
                  type="text"
                  value={proj.title || ''}
                  onChange={(e) => updateField(pIdx, 'title', e.target.value)}
                  placeholder="e.g. Distributed Task Orchestrator"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Technologies Used (comma-separated)</label>
                <input
                  type="text"
                  value={(proj.tech_stack || []).join(', ')}
                  onChange={(e) => updateTechStack(pIdx, e.target.value)}
                  placeholder="e.g. Python, FastAPI, Docker, Redis"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Repository / Live URL</label>
                <input
                  type="text"
                  value={proj.link || ''}
                  onChange={(e) => updateField(pIdx, 'link', e.target.value)}
                  placeholder="e.g. https://github.com/alexmorgan-dev/pulsequeue"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Bullets */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">Project Highlights & Metrics</label>
                <button
                  onClick={() => addBullet(pIdx)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Bullet</span>
                </button>
              </div>

              <div className="space-y-2">
                {(proj.bullets || []).map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2">
                    <span className="text-slate-500 mt-2 select-none">•</span>
                    <textarea
                      rows={2}
                      value={bullet}
                      onChange={(e) => updateBullet(pIdx, bIdx, e.target.value)}
                      placeholder="e.g. Optimized memory footprint by 22% during simulated traffic spikes..."
                      className="flex-1 bg-slate-800/80 border border-slate-700/80 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-100 outline-none resize-none transition"
                    />
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => onPolishBullet(pIdx, bIdx, true)}
                        title="AI Polish bullet"
                        className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-md text-xs font-medium transition flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span className="hidden sm:inline">AI Polish</span>
                      </button>
                      <button
                        onClick={() => removeBullet(pIdx, bIdx)}
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

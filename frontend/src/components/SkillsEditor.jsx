import React, { useState } from 'react';
import { Wrench, Plus, Trash2, X, Sparkles, RefreshCw } from 'lucide-react';

export default function SkillsEditor({
  skills,
  summary,
  experience,
  hfToken,
  hfModel,
  onChange,
  onNotify
}) {
  const [categorizing, setCategorizing] = useState(false);
  const [inputValues, setInputValues] = useState({});

  const addCategory = () => {
    const newCat = {
      category: 'New Technical Domain',
      skills: ['Sample Skill']
    };
    onChange([...skills, newCat]);
  };

  const removeCategory = (idx) => {
    const updated = [...skills];
    updated.splice(idx, 1);
    onChange(updated);
  };

  const updateCategoryName = (idx, name) => {
    const updated = [...skills];
    updated[idx].category = name;
    onChange(updated);
  };

  const addSkillToCategory = (catIdx, skillName) => {
    const clean = skillName.trim();
    if (!clean) return;
    const updated = [...skills];
    if (!updated[catIdx].skills.includes(clean)) {
      updated[catIdx].skills = [...updated[catIdx].skills, clean];
      onChange(updated);
    }
    setInputValues({ ...inputValues, [catIdx]: '' });
  };

  const removeSkillTag = (catIdx, skillIdx) => {
    const updated = [...skills];
    const newSkills = [...updated[catIdx].skills];
    newSkills.splice(skillIdx, 1);
    updated[catIdx].skills = newSkills;
    onChange(updated);
  };

  const handleKeyDown = (e, catIdx) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkillToCategory(catIdx, inputValues[catIdx] || '');
    }
  };

  const handleAutoCategorize = async () => {
    setCategorizing(true);
    let fullText = (summary || '') + ' ';
    (experience || []).forEach(e => {
      fullText += (e.role || '') + ' ' + (e.company || '') + ' ' + (e.bullets || []).join(' ') + ' ';
    });
    skills.forEach(c => {
      fullText += (c.skills || []).join(' ') + ' ';
    });

    try {
      const res = await fetch('/api/ai/extract-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullText,
          hf_token: hfToken,
          model: hfModel
        })
      });
      if (!res.ok) throw new Error('Skill extraction failed');
      const data = await res.json();
      if (data.categories && data.categories.length > 0) {
        onChange(data.categories);
        onNotify(`Skills auto-categorized into standard ATS groups!`, 'success');
      }
    } catch (err) {
      onNotify('Failed to auto-categorize skills', 'error');
    } finally {
      setCategorizing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-indigo-400" />
            Categorized Skills Inventory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Grouping skills into standard categories (Languages, Cloud, Databases) dramatically boosts ATS parser keyword matching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoCategorize}
            disabled={categorizing}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            {categorizing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{categorizing ? 'Extracting...' : '✨ AI Auto-Group'}</span>
          </button>

          <button
            onClick={addCategory}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {skills.map((sc, catIdx) => (
          <div
            key={catIdx}
            className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5 transition"
          >
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={sc.category || ''}
                onChange={(e) => updateCategoryName(catIdx, e.target.value)}
                placeholder="Category Name"
                className="bg-transparent text-xs font-bold text-indigo-400 border-b border-transparent hover:border-slate-700 focus:border-indigo-500 outline-none py-0.5 transition"
              />
              <button
                onClick={() => removeCategory(catIdx)}
                className="text-xs text-red-400 hover:text-red-300 transition"
              >
                Delete Category
              </button>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {(sc.skills || []).map((skill, sIdx) => (
                <span
                  key={sIdx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 rounded-lg transition"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSkillTag(catIdx, sIdx)}
                    className="text-slate-400 hover:text-red-400 ml-1 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={inputValues[catIdx] || ''}
                onChange={(e) => setInputValues({ ...inputValues, [catIdx]: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, catIdx)}
                placeholder="+ Add skill (hit Enter)"
                className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:border-indigo-500 outline-none w-36 transition"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

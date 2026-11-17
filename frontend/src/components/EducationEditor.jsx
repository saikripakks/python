import React from 'react';
import { GraduationCap, Plus, Trash2, Calendar, MapPin, Award } from 'lucide-react';

export default function EducationEditor({ education, onChange }) {
  const addEducation = () => {
    const newEntry = {
      id: `edu-${Date.now()}`,
      institution: '',
      degree: 'Bachelor of Science',
      field_of_study: 'Computer Science',
      location: '',
      graduation_date: '',
      gpa: '',
      honors: ''
    };
    onChange([...education, newEntry]);
  };

  const removeEducation = (idx) => {
    const updated = [...education];
    updated.splice(idx, 1);
    onChange(updated);
  };

  const updateField = (idx, field, value) => {
    const updated = [...education];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            Education & Degrees
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ATS scanners parse degree types, major specializations, and graduation credentials.
          </p>
        </div>

        <button
          onClick={addEducation}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Education</span>
        </button>
      </div>

      <div className="space-y-4">
        {education.map((edu, idx) => (
          <div
            key={edu.id || idx}
            className="p-4 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-xl space-y-3 transition"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Education #{idx + 1}
              </span>
              <button
                onClick={() => removeEducation(idx)}
                className="text-xs text-red-400 hover:text-red-300 font-medium transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Institution / University *</label>
                <input
                  type="text"
                  value={edu.institution || ''}
                  onChange={(e) => updateField(idx, 'institution', e.target.value)}
                  placeholder="e.g. University of California, Berkeley"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Degree *</label>
                <input
                  type="text"
                  value={edu.degree || ''}
                  onChange={(e) => updateField(idx, 'degree', e.target.value)}
                  placeholder="e.g. Bachelor of Science"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Field of Study / Major *</label>
                <input
                  type="text"
                  value={edu.field_of_study || ''}
                  onChange={(e) => updateField(idx, 'field_of_study', e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Graduation Year / Date *</label>
                <input
                  type="text"
                  value={edu.graduation_date || ''}
                  onChange={(e) => updateField(idx, 'graduation_date', e.target.value)}
                  placeholder="e.g. May 2021"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">GPA (Optional)</label>
                <input
                  type="text"
                  value={edu.gpa || ''}
                  onChange={(e) => updateField(idx, 'gpa', e.target.value)}
                  placeholder="e.g. 3.85 / 4.0"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Honors / Distinctions (Optional)</label>
                <input
                  type="text"
                  value={edu.honors || ''}
                  onChange={(e) => updateField(idx, 'honors', e.target.value)}
                  placeholder="e.g. Magna Cum Laude, Dean's List"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

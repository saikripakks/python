import React from 'react';
import { Award, Plus, Trash2 } from 'lucide-react';

export default function CertificationsEditor({ certifications, onChange }) {
  const addCert = () => {
    const newCert = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      date: '2023',
      credential_id: '',
      url: ''
    };
    onChange([...certifications, newCert]);
  };

  const removeCert = (idx) => {
    const updated = [...certifications];
    updated.splice(idx, 1);
    onChange(updated);
  };

  const updateField = (idx, field, value) => {
    const updated = [...certifications];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            Certifications & Industry Credentials
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cloud certifications (AWS, GCP, Azure, CKA) provide strong signals for ATS keyword filters.
          </p>
        </div>

        <button
          onClick={addCert}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Certification</span>
        </button>
      </div>

      <div className="space-y-3">
        {certifications.map((cert, idx) => (
          <div
            key={cert.id || idx}
            className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-400">Credential #{idx + 1}</span>
              <button
                onClick={() => removeCert(idx)}
                className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Certification Name *</label>
                <input
                  type="text"
                  value={cert.name || ''}
                  onChange={(e) => updateField(idx, 'name', e.target.value)}
                  placeholder="e.g. AWS Certified Solutions Architect"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Issuing Organization *</label>
                <input
                  type="text"
                  value={cert.issuer || ''}
                  onChange={(e) => updateField(idx, 'issuer', e.target.value)}
                  placeholder="e.g. Amazon Web Services"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date Acquired</label>
                <input
                  type="text"
                  value={cert.date || ''}
                  onChange={(e) => updateField(idx, 'date', e.target.value)}
                  placeholder="e.g. 2023"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

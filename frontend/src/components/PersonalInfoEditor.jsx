import React from 'react';
import { User, Mail, Phone, MapPin, Globe, Linkedin, Github, Briefcase } from 'lucide-react';

export default function PersonalInfoEditor({ personalInfo, onChange }) {
  const updateField = (field, value) => {
    onChange({ ...personalInfo, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            Contact & Header Information
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Applicant Tracking Systems expect clear, standard contact headers for candidate indexing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" /> Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={personalInfo.full_name || ''}
            onChange={(e) => updateField('full_name', e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            placeholder="e.g. Alexander Morgan"
          />
        </div>

        {/* Target Role */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Target Job Title
          </label>
          <input
            type="text"
            value={personalInfo.target_role || ''}
            onChange={(e) => updateField('target_role', e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            placeholder="e.g. Senior Full-Stack Engineer"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={personalInfo.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            placeholder="e.g. alex.morgan@gmail.com"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={personalInfo.phone || ''}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            placeholder="e.g. +1 (555) 234-5678"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location (City, State/Country)
          </label>
          <input
            type="text"
            value={personalInfo.location || ''}
            onChange={(e) => updateField('location', e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            placeholder="e.g. San Francisco, CA"
          />
        </div>

        {/* LinkedIn */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Linkedin className="w-3.5 h-3.5 text-slate-400" /> LinkedIn Profile URL
          </label>
          <input
            type="text"
            value={personalInfo.linkedin || ''}
            onChange={(e) => updateField('linkedin', e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            placeholder="e.g. https://linkedin.com/in/alexmorgan"
          />
        </div>

        {/* GitHub */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Github className="w-3.5 h-3.5 text-slate-400" /> GitHub Profile URL
          </label>
          <input
            type="text"
            value={personalInfo.github || ''}
            onChange={(e) => updateField('github', e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            placeholder="e.g. https://github.com/alexmorgan"
          />
        </div>

        {/* Portfolio */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" /> Portfolio Website
          </label>
          <input
            type="text"
            value={personalInfo.portfolio || ''}
            onChange={(e) => updateField('portfolio', e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            placeholder="e.g. https://alexmorgan.tech"
          />
        </div>
      </div>
    </div>
  );
}

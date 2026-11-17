import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import PersonalInfoEditor from './components/PersonalInfoEditor';
import SummaryEditor from './components/SummaryEditor';
import ExperienceEditor from './components/ExperienceEditor';
import EducationEditor from './components/EducationEditor';
import SkillsEditor from './components/SkillsEditor';
import ProjectsEditor from './components/ProjectsEditor';
import CertificationsEditor from './components/CertificationsEditor';
import JobMatcher from './components/JobMatcher';
import ATSScoreCard from './components/ATSScoreCard';
import DocumentPreview from './components/DocumentPreview';
import AIBulletModal from './components/AIBulletModal';
import HFSettingsModal from './components/HFSettingsModal';
import ImportPdfModal from './components/ImportPdfModal';

import { 
  User, 
  AlignLeft, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  FolderGit2, 
  Award, 
  Target 
} from 'lucide-react';

const TABS = [
  { id: 'contact', label: 'Contact', icon: User },
  { id: 'summary', label: 'Summary', icon: AlignLeft },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'certifications', label: 'Certs', icon: Award },
  { id: 'matcher', label: 'Job Matcher', icon: Target },
];

export default function App() {
  const [resume, setResume] = useState({
    personal_info: {
      full_name: '',
      target_role: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: ''
    },
    summary: '',
    work_experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: []
  });

  const [jobDescription, setJobDescription] = useState('');
  const [atsScore, setAtsScore] = useState(null);
  const [jdResults, setJdResults] = useState(null);
  const [isScanningJD, setIsScanningJD] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);

  const [currentTab, setCurrentTab] = useState('contact');
  const [hfToken, setHfToken] = useState(() => localStorage.getItem('hf_user_token') || '');
  const [hfModel, setHfModel] = useState(() => localStorage.getItem('hf_user_model') || 'mistralai/Mistral-7B-Instruct-v0.3');

  // Modals state
  const [isHFModalOpen, setIsHFModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [aiBulletModal, setAiBulletModal] = useState({
    isOpen: false,
    originalBullet: '',
    variations: [],
    isLoading: false,
    modelUsed: '',
    context: null // { expIndex, bulletIndex, isProject }
  });

  // Notification Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const debounceTimerRef = useRef(null);

  const showNotification = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 3200);
  };

  // Initial load
  useEffect(() => {
    const saved = localStorage.getItem('resumeforge_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.personal_info?.full_name) {
          setResume(parsed);
          return;
        }
      } catch (e) {
        console.warn('Failed parsing stored resume');
      }
    }
    // Load default sample
    loadSample('software_engineer');
  }, []);

  // Debounced ATS scoring whenever resume or jobDescription changes
  useEffect(() => {
    if (!resume?.personal_info?.full_name && resume?.work_experience?.length === 0) return;

    localStorage.setItem('resumeforge_data', JSON.stringify(resume));

    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchATSScore();
    }, 600);

    return () => clearTimeout(debounceTimerRef.current);
  }, [resume, jobDescription]);

  const fetchATSScore = async () => {
    try {
      const res = await fetch('/api/ats/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume,
          job_description: jobDescription
        })
      });
      if (!res.ok) throw new Error('Score fetch failed');
      const data = await res.json();
      setAtsScore(data);
    } catch (err) {
      console.error('Error fetching score:', err);
    }
  };

  const loadSample = async (roleKey) => {
    try {
      const res = await fetch(`/api/samples/${roleKey}`);
      if (!res.ok) throw new Error('Could not load sample');
      const data = await res.json();
      setResume(data);
      showNotification(`Loaded sample resume for ${roleKey.replace('_', ' ')}!`, 'success');
    } catch (err) {
      showNotification('Failed to load sample resume', 'error');
    }
  };

  const handleExport = async (format) => {
    showNotification(`Generating ATS-compliant ${format.toUpperCase()}...`, 'info');
    try {
      const res = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resume)
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = (resume.personal_info.full_name || 'Resume').replace(/\s+/g, '_');
      a.download = `${cleanName}_ATS.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showNotification(`${format.toUpperCase()} downloaded successfully!`, 'success');
    } catch (err) {
      showNotification(`Failed to export ${format.toUpperCase()}`, 'error');
    }
  };

  const handleImportComplete = (parsedData) => {
    setResume(prev => ({
      ...prev,
      personal_info: { ...prev.personal_info, ...(parsedData.personal_info || {}) },
      summary: parsedData.summary || prev.summary,
      work_experience: parsedData.work_experience?.length > 0 ? parsedData.work_experience : prev.work_experience,
      skills: parsedData.skills?.length > 0 ? parsedData.skills : prev.skills
    }));
    showNotification('Resume parsed and imported into editor!', 'success');
  };

  // Bullet Point AI Polish
  const handlePolishBullet = async (expIndex, bulletIndex, isProject = false) => {
    const list = isProject ? resume.projects[expIndex].bullets : resume.work_experience[expIndex].bullets;
    const bulletText = list[bulletIndex];
    if (!bulletText?.trim()) {
      showNotification('Please enter bullet point text first', 'warning');
      return;
    }

    setAiBulletModal({
      isOpen: true,
      originalBullet: bulletText,
      variations: [],
      isLoading: true,
      modelUsed: '',
      context: { expIndex, bulletIndex, isProject }
    });

    try {
      const res = await fetch('/api/ai/polish-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet: bulletText,
          target_role: resume.personal_info.target_role || '',
          hf_token: hfToken,
          model: hfModel
        })
      });
      if (!res.ok) throw new Error('AI Polish failed');
      const data = await res.json();
      setAiBulletModal(prev => ({
        ...prev,
        variations: data.variations || [],
        isLoading: false,
        modelUsed: data.model_used
      }));
    } catch (err) {
      showNotification('AI Bullet polishing failed. Please try again.', 'error');
      setAiBulletModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleApplyBulletVariation = (newText) => {
    const { expIndex, bulletIndex, isProject } = aiBulletModal.context || {};
    if (isProject) {
      const updatedProjects = [...resume.projects];
      updatedProjects[expIndex].bullets[bulletIndex] = newText;
      setResume({ ...resume, projects: updatedProjects });
    } else {
      const updatedExp = [...resume.work_experience];
      updatedExp[expIndex].bullets[bulletIndex] = newText;
      setResume({ ...resume, work_experience: updatedExp });
    }
    setAiBulletModal({ ...aiBulletModal, isOpen: false });
    showNotification('Bullet point updated with Google XYZ formula!', 'success');
  };

  // Job Matcher & AI Tailor
  const handleScanJD = async () => {
    if (!jobDescription.trim()) return;
    setIsScanningJD(true);
    try {
      const res = await fetch('/api/ats/match-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume,
          job_description: jobDescription
        })
      });
      if (!res.ok) throw new Error('Match failed');
      const data = await res.json();
      setJdResults(data);
      showNotification(`Job match calculated: ${data.match_score}%`, 'info');
    } catch (err) {
      showNotification('Failed to analyze job match', 'error');
    } finally {
      setIsScanningJD(false);
    }
  };

  const handleTailorResume = async () => {
    if (!jobDescription.trim()) return;
    setIsTailoring(true);
    try {
      const res = await fetch('/api/ai/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume,
          job_description: jobDescription,
          hf_token: hfToken,
          model: hfModel
        })
      });
      if (!res.ok) throw new Error('Tailor failed');
      const data = await res.json();

      let updatedResume = { ...resume };

      if (data.tailored_summary) {
        updatedResume.summary = data.tailored_summary;
      }

      if (data.suggested_bullets?.length > 0) {
        data.suggested_bullets.forEach(s => {
          const exp = updatedResume.work_experience.find(e => e.id === s.experience_id);
          if (exp && exp.bullets[s.bullet_index] !== undefined) {
            exp.bullets[s.bullet_index] = s.suggested;
          }
        });
      }

      if (data.recommended_keywords_to_add?.length > 0) {
        let cat = updatedResume.skills.find(c => c.category.toLowerCase().includes('tech') || c.category.toLowerCase().includes('core')) || updatedResume.skills[0];
        if (cat) {
          data.recommended_keywords_to_add.slice(0, 4).forEach(kw => {
            const clean = kw.charAt(0).toUpperCase() + kw.slice(1);
            if (!cat.skills.includes(clean)) cat.skills.push(clean);
          });
        }
      }

      setResume(updatedResume);
      showNotification(`Resume tailored successfully using ${data.model_used}!`, 'success');
      // Re-scan
      setTimeout(() => handleScanJD(), 800);
    } catch (err) {
      showNotification('Failed to tailor resume with AI', 'error');
    } finally {
      setIsTailoring(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Header
        atsScore={atsScore}
        hfToken={hfToken}
        hfModel={hfModel}
        onOpenHFModal={() => setIsHFModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onLoadSample={loadSample}
        onExport={handleExport}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor & Controls */}
        <section className="lg:col-span-7 space-y-4">
          {/* Navigation Tab Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl">
            {currentTab === 'contact' && (
              <PersonalInfoEditor
                personalInfo={resume.personal_info}
                onChange={(updated) => setResume({ ...resume, personal_info: updated })}
              />
            )}

            {currentTab === 'summary' && (
              <SummaryEditor
                summary={resume.summary}
                targetRole={resume.personal_info.target_role}
                skills={resume.skills}
                hfToken={hfToken}
                hfModel={hfModel}
                onChange={(val) => setResume({ ...resume, summary: val })}
                onNotify={showNotification}
              />
            )}

            {currentTab === 'experience' && (
              <ExperienceEditor
                experience={resume.work_experience}
                onChange={(updated) => setResume({ ...resume, work_experience: updated })}
                onPolishBullet={handlePolishBullet}
              />
            )}

            {currentTab === 'education' && (
              <EducationEditor
                education={resume.education}
                onChange={(updated) => setResume({ ...resume, education: updated })}
              />
            )}

            {currentTab === 'skills' && (
              <SkillsEditor
                skills={resume.skills}
                summary={resume.summary}
                experience={resume.work_experience}
                hfToken={hfToken}
                hfModel={hfModel}
                onChange={(updated) => setResume({ ...resume, skills: updated })}
                onNotify={showNotification}
              />
            )}

            {currentTab === 'projects' && (
              <ProjectsEditor
                projects={resume.projects}
                onChange={(updated) => setResume({ ...resume, projects: updated })}
                onPolishBullet={handlePolishBullet}
              />
            )}

            {currentTab === 'certifications' && (
              <CertificationsEditor
                certifications={resume.certifications}
                onChange={(updated) => setResume({ ...resume, certifications: updated })}
              />
            )}

            {currentTab === 'matcher' && (
              <JobMatcher
                jobDescription={jobDescription}
                onJDChange={setJobDescription}
                onScanJD={handleScanJD}
                onTailorResume={handleTailorResume}
                jdResults={jdResults}
                isScanning={isScanningJD}
                isTailoring={isTailoring}
              />
            )}
          </div>
        </section>

        {/* Right Column: Live ATS Preview & Diagnostic Engine */}
        <section className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          <ATSScoreCard atsScore={atsScore} />
          <DocumentPreview resume={resume} rawText={atsScore?.raw_ats_text} />
        </section>
      </main>

      {/* Modals */}
      <AIBulletModal
        isOpen={aiBulletModal.isOpen}
        onClose={() => setAiBulletModal({ ...aiBulletModal, isOpen: false })}
        originalBullet={aiBulletModal.originalBullet}
        variations={aiBulletModal.variations}
        isLoading={aiBulletModal.isLoading}
        modelUsed={aiBulletModal.modelUsed}
        onApply={handleApplyBulletVariation}
      />

      <HFSettingsModal
        isOpen={isHFModalOpen}
        onClose={() => setIsHFModalOpen(false)}
        hfToken={hfToken}
        hfModel={hfModel}
        onSave={(token, model) => {
          setHfToken(token);
          setHfModel(model);
          localStorage.setItem('hf_user_token', token);
          localStorage.setItem('hf_user_model', model);
          showNotification('Hugging Face settings saved!', 'success');
        }}
      />

      <ImportPdfModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold transition transform duration-300 z-50 flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' :
          toast.type === 'warning' ? 'bg-amber-600 text-white' :
          toast.type === 'error' ? 'bg-red-600 text-white' :
          'bg-slate-800 text-slate-100 border border-slate-700'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

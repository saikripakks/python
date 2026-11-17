// ResumeForge AI - Main Client Application Logic

const AppState = {
    resume: {
        personal_info: {
            full_name: "",
            target_role: "",
            email: "",
            phone: "",
            location: "",
            linkedin: "",
            github: "",
            portfolio: ""
        },
        summary: "",
        work_experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: []
    },
    jobDescription: "",
    atsScore: null,
    hfToken: localStorage.getItem("hf_user_token") || "",
    hfModel: localStorage.getItem("hf_user_model") || "mistralai/Mistral-7B-Instruct-v0.3",
    currentTab: "personal",
    previewMode: "paper", // "paper" or "xray"
    activeBulletContext: null // { expIndex, bulletIndex, isProject }
};

// Debounce timer for auto-evaluating ATS score
let scoreDebounceTimer = null;

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    loadSavedState();
    setupEventHandlers();
    updateModelBadge();

    // If no resume in storage, load default sample
    if (!AppState.resume.personal_info.full_name) {
        await loadSampleResume("software_engineer");
    } else {
        renderAllSections();
        triggerATSScore();
    }
}

function loadSavedState() {
    const saved = localStorage.getItem("resumeforge_data");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.personal_info) {
                AppState.resume = parsed;
            }
        } catch (e) {
            console.warn("Could not parse saved resume:", e);
        }
    }
}

function saveState() {
    localStorage.setItem("resumeforge_data", JSON.stringify(AppState.resume));
    renderLivePreview();
    debouncedTriggerATSScore();
}

function debouncedTriggerATSScore() {
    clearTimeout(scoreDebounceTimer);
    scoreDebounceTimer = setTimeout(() => {
        triggerATSScore();
    }, 600);
}

// =====================================================================
// API Communication
// =====================================================================

async function triggerATSScore() {
    try {
        const res = await fetch("/api/ats/score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                resume: AppState.resume,
                job_description: AppState.jobDescription
            })
        });
        if (!res.ok) throw new Error("Scoring failed");
        const data = await res.json();
        AppState.atsScore = data;
        renderScoreBoard(data);
        renderXRayView(data.raw_ats_text);
    } catch (err) {
        console.error("Error evaluating ATS score:", err);
    }
}

async function loadSampleResume(roleKey) {
    showNotification("Loading sample resume...", "info");
    try {
        const res = await fetch(`/api/samples/${roleKey}`);
        if (!res.ok) throw new Error("Could not load sample");
        const data = await res.json();
        AppState.resume = data;
        saveState();
        renderAllSections();
        showNotification("Loaded sample resume successfully!", "success");
    } catch (err) {
        showNotification("Failed to load sample resume", "error");
    }
}

// =====================================================================
// AI Services
// =====================================================================

async function polishBulletWithAI(expIndex, bulletIndex, isProject = false) {
    const list = isProject ? AppState.resume.projects[expIndex].bullets : AppState.resume.work_experience[expIndex].bullets;
    const bulletText = list[bulletIndex];
    if (!bulletText || !bulletText.trim()) {
        showNotification("Please enter bullet point text first", "warning");
        return;
    }

    AppState.activeBulletContext = { expIndex, bulletIndex, isProject };

    // Open Modal and show loading
    const modal = document.getElementById("aiBulletModal");
    const container = document.getElementById("aiBulletVariations");
    document.getElementById("modalOriginalBullet").innerText = bulletText;
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-10 space-y-3">
            <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm text-slate-400 animate-pulse">Consulting GenAI Model (${AppState.hfModel.split('/')[1] || 'Smart Engine'})...</p>
        </div>
    `;
    modal.classList.remove("hidden");

    try {
        const res = await fetch("/api/ai/polish-bullet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bullet: bulletText,
                target_role: AppState.resume.personal_info.target_role || "",
                hf_token: AppState.hfToken,
                model: AppState.hfModel
            })
        });
        if (!res.ok) throw new Error("AI Polish failed");
        const data = await res.json();

        // Render variations
        container.innerHTML = "";
        data.variations.forEach((v, idx) => {
            const card = document.createElement("div");
            card.className = "p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 rounded-xl transition duration-200";
            card.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        v.type.includes('Metric') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        v.type.includes('Leadership') ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                        'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    }">
                        ${v.type}
                    </span>
                    <button onclick="applyBulletVariation('${escapeHtml(v.text)}')" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition shadow-sm flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        Apply
                    </button>
                </div>
                <p class="text-sm text-slate-200 font-medium leading-relaxed">${v.text}</p>
                <p class="text-xs text-slate-400 mt-2 italic">${v.explanation}</p>
            `;
            container.appendChild(card);
        });

        document.getElementById("modalModelUsed").innerText = `Engine: ${data.model_used}`;
    } catch (err) {
        container.innerHTML = `<div class="p-4 bg-red-900/30 border border-red-700 text-red-200 text-sm rounded-lg">Error generating AI variations. Please try again.</div>`;
    }
}

function applyBulletVariation(newText) {
    if (!AppState.activeBulletContext) return;
    const { expIndex, bulletIndex, isProject } = AppState.activeBulletContext;

    if (isProject) {
        AppState.resume.projects[expIndex].bullets[bulletIndex] = newText;
        renderProjects();
    } else {
        AppState.resume.work_experience[expIndex].bullets[bulletIndex] = newText;
        renderExperience();
    }

    saveState();
    closeModal("aiBulletModal");
    showNotification("Bullet point updated with Google XYZ formula!", "success");
}

async function generateSummaryAI() {
    const role = AppState.resume.personal_info.target_role || "Software Professional";
    const skills = [];
    AppState.resume.skills.forEach(s => skills.push(...s.skills));

    const btn = document.getElementById("btnAiSummary");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="inline-block animate-spin mr-1">↻</span> Generating...`;
    btn.disabled = true;

    try {
        const res = await fetch("/api/ai/generate-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                target_role: role,
                years_exp: "4+",
                skills: skills.slice(0, 8),
                current_summary: AppState.resume.summary,
                hf_token: AppState.hfToken,
                model: AppState.hfModel
            })
        });
        if (!res.ok) throw new Error("AI Summary failed");
        const data = await res.json();
        AppState.resume.summary = data.summary;
        document.getElementById("inputSummary").value = data.summary;
        saveState();
        showNotification(`Summary generated via ${data.model_used}!`, "success");
    } catch (err) {
        showNotification("Failed to generate summary", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function autoCategorizeSkillsAI() {
    const rawSkills = [];
    AppState.resume.skills.forEach(sc => rawSkills.push(...sc.skills));
    
    // Also include text from summary and experience
    let sampleText = rawSkills.join(", ") + " " + AppState.resume.summary;
    AppState.resume.work_experience.forEach(e => {
        sampleText += " " + e.bullets.join(" ");
    });

    const btn = document.getElementById("btnAiSkills");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="inline-block animate-spin mr-1">↻</span> Categorizing...`;
    btn.disabled = true;

    try {
        const res = await fetch("/api/ai/extract-skills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: sampleText,
                hf_token: AppState.hfToken,
                model: AppState.hfModel
            })
        });
        if (!res.ok) throw new Error("Skill extraction failed");
        const data = await res.json();
        if (data.categories && data.categories.length > 0) {
            AppState.resume.skills = data.categories;
            renderSkills();
            saveState();
            showNotification(`Skills categorized successfully!`, "success");
        }
    } catch (err) {
        showNotification("Failed to auto-categorize skills", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function scanJobDescription() {
    const jd = document.getElementById("inputJobDescription").value.trim();
    if (!jd) {
        showNotification("Please paste a job description first", "warning");
        return;
    }
    AppState.jobDescription = jd;

    const btn = document.getElementById("btnScanJD");
    btn.innerHTML = `<span class="inline-block animate-spin mr-1">↻</span> Analyzing Match...`;
    btn.disabled = true;

    try {
        const res = await fetch("/api/ats/match-jd", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                resume: AppState.resume,
                job_description: jd
            })
        });
        if (!res.ok) throw new Error("JD Analysis failed");
        const data = await res.json();
        renderJDMatchResults(data);
        triggerATSScore();
        showNotification(`Job match analysis complete: ${data.match_score}%`, "info");
    } catch (err) {
        showNotification("Failed to analyze Job Description", "error");
    } finally {
        btn.innerHTML = `Analyze Job Match`;
        btn.disabled = false;
    }
}

async function tailorResumeToJobAI() {
    if (!AppState.jobDescription) {
        showNotification("Please paste and scan a Job Description first", "warning");
        return;
    }

    const btn = document.getElementById("btnAiTailor");
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<span class="inline-block animate-spin mr-1">↻</span> Tailoring Resume with AI...`;
    btn.disabled = true;

    try {
        const res = await fetch("/api/ai/tailor-resume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                resume: AppState.resume,
                job_description: AppState.jobDescription,
                hf_token: AppState.hfToken,
                model: AppState.hfModel
            })
        });
        if (!res.ok) throw new Error("Tailor failed");
        const data = await res.json();

        // Apply tailored summary
        if (data.tailored_summary) {
            AppState.resume.summary = data.tailored_summary;
            document.getElementById("inputSummary").value = data.tailored_summary;
        }

        // Apply suggested bullets
        if (data.suggested_bullets && data.suggested_bullets.length > 0) {
            data.suggested_bullets.forEach(s => {
                const exp = AppState.resume.work_experience.find(e => e.id === s.experience_id);
                if (exp && exp.bullets[s.bullet_index] !== undefined) {
                    exp.bullets[s.bullet_index] = s.suggested;
                }
            });
            renderExperience();
        }

        // Add recommended keywords to Skills if missing
        if (data.recommended_keywords_to_add && data.recommended_keywords_to_add.length > 0) {
            let targetCat = AppState.resume.skills.find(c => c.category.toLowerCase().includes("tech") || c.category.toLowerCase().includes("core"));
            if (!targetCat && AppState.resume.skills.length > 0) {
                targetCat = AppState.resume.skills[0];
            }
            if (targetCat) {
                data.recommended_keywords_to_add.slice(0, 4).forEach(kw => {
                    const cleanKw = kw.charAt(0).toUpperCase() + kw.slice(1);
                    if (!targetCat.skills.includes(cleanKw)) {
                        targetCat.skills.push(cleanKw);
                    }
                });
                renderSkills();
            }
        }

        saveState();
        triggerATSScore();
        showNotification(`Resume tailored successfully using ${data.model_used}! Match score boosted.`, "success");
    } catch (err) {
        showNotification("Failed to tailor resume", "error");
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}

// =====================================================================
// Exporters & Imports
// =====================================================================

async function downloadExport(format) {
    showNotification(`Generating ATS-compliant ${format.toUpperCase()}...`, "info");
    try {
        const res = await fetch(`/api/export/${format}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(AppState.resume)
        });
        if (!res.ok) throw new Error(`Export failed`);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const name = (AppState.resume.personal_info.full_name || "Resume").replace(/\s+/g, "_");
        a.download = `${name}_ATS.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showNotification(`${format.toUpperCase()} exported successfully!`, "success");
    } catch (err) {
        showNotification(`Failed to export ${format.toUpperCase()}`, "error");
    }
}

async function uploadPdfResume(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    showNotification("Parsing uploaded PDF with OCR engine...", "info");
    try {
        const res = await fetch("/api/resume/parse-pdf", {
            method: "POST",
            body: formData
        });
        if (!res.ok) throw new Error("PDF parsing failed");
        const data = await res.json();

        // Merge parsed data into AppState
        if (data.personal_info) AppState.resume.personal_info = { ...AppState.resume.personal_info, ...data.personal_info };
        if (data.summary) AppState.resume.summary = data.summary;
        if (data.work_experience && data.work_experience.length > 0) AppState.resume.work_experience = data.work_experience;
        if (data.skills && data.skills.length > 0) AppState.resume.skills = data.skills;

        saveState();
        renderAllSections();
        closeModal("importPdfModal");
        showNotification("Resume imported and parsed successfully!", "success");
    } catch (err) {
        showNotification("Failed to parse PDF resume", "error");
    }
}

// =====================================================================
// UI Rendering Functions
// =====================================================================

function renderAllSections() {
    renderPersonalInfo();
    renderSummary();
    renderExperience();
    renderEducation();
    renderSkills();
    renderProjects();
    renderCertifications();
    renderLivePreview();
}

function renderPersonalInfo() {
    const p = AppState.resume.personal_info;
    document.getElementById("inputFullName").value = p.full_name || "";
    document.getElementById("inputTargetRole").value = p.target_role || "";
    document.getElementById("inputEmail").value = p.email || "";
    document.getElementById("inputPhone").value = p.phone || "";
    document.getElementById("inputLocation").value = p.location || "";
    document.getElementById("inputLinkedin").value = p.linkedin || "";
    document.getElementById("inputGithub").value = p.github || "";
    document.getElementById("inputPortfolio").value = p.portfolio || "";
}

function renderSummary() {
    document.getElementById("inputSummary").value = AppState.resume.summary || "";
}

function renderExperience() {
    const container = document.getElementById("experienceList");
    container.innerHTML = "";

    AppState.resume.work_experience.forEach((exp, expIdx) => {
        const card = document.createElement("div");
        card.className = "p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3 mb-4";
        
        let bulletsHtml = "";
        exp.bullets.forEach((bullet, bIdx) => {
            bulletsHtml += `
                <div class="flex items-start gap-2 group">
                    <span class="text-slate-500 mt-2 select-none">•</span>
                    <textarea oninput="updateBullet(${expIdx}, ${bIdx}, this.value)" rows="2" class="flex-1 bg-slate-800/80 border border-slate-700/80 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-200 outline-none resize-none transition" placeholder="e.g. Spearheaded microservices migration, reducing latency by 45%...">${bullet}</textarea>
                    <div class="flex flex-col gap-1">
                        <button onclick="polishBulletWithAI(${expIdx}, ${bIdx}, false)" title="Enhance with Google XYZ formula via AI" class="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-md text-xs font-medium transition flex items-center gap-1 shadow-sm">
                            <span>✨</span> <span class="hidden sm:inline">AI Polish</span>
                        </button>
                        <button onclick="removeBullet(${expIdx}, ${bIdx})" title="Delete bullet" class="px-2 py-1 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-md text-xs transition">
                            ✕
                        </button>
                    </div>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <span class="text-xs font-semibold uppercase tracking-wider text-indigo-400">Experience #${expIdx + 1}</span>
                <button onclick="removeExperience(${expIdx})" class="text-xs text-red-400 hover:text-red-300 font-medium transition flex items-center gap-1">
                    Delete Entry
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Company / Organization</label>
                    <input type="text" value="${escapeHtml(exp.company || '')}" oninput="updateExpField(${expIdx}, 'company', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="e.g. Google, Acme Inc">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Job Title / Role</label>
                    <input type="text" value="${escapeHtml(exp.role || '')}" oninput="updateExpField(${expIdx}, 'role', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="e.g. Senior Software Engineer">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
                    <input type="text" value="${escapeHtml(exp.start_date || '')}" oninput="updateExpField(${expIdx}, 'start_date', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="e.g. Jan 2022">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">End Date</label>
                    <div class="flex items-center gap-2">
                        <input type="text" value="${escapeHtml(exp.end_date || '')}" oninput="updateExpField(${expIdx}, 'end_date', this.value)" ${exp.current ? 'disabled' : ''} class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none ${exp.current ? 'opacity-40' : ''}" placeholder="e.g. Present">
                        <label class="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap cursor-pointer">
                            <input type="checkbox" ${exp.current ? 'checked' : ''} onchange="toggleExpCurrent(${expIdx}, this.checked)" class="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0">
                            Present
                        </label>
                    </div>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-xs font-medium text-slate-400 mb-1">Location</label>
                    <input type="text" value="${escapeHtml(exp.location || '')}" oninput="updateExpField(${expIdx}, 'location', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="e.g. San Francisco, CA (or Remote)">
                </div>
            </div>
            <div>
                <div class="flex items-center justify-between mb-2">
                    <label class="block text-xs font-medium text-slate-400">Bullet Points (Action Verbs & Metrics)</label>
                    <button onclick="addBullet(${expIdx})" class="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition flex items-center gap-1">
                        + Add Bullet
                    </button>
                </div>
                <div class="space-y-2">
                    ${bulletsHtml}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderEducation() {
    const container = document.getElementById("educationList");
    container.innerHTML = "";

    AppState.resume.education.forEach((edu, idx) => {
        const card = document.createElement("div");
        card.className = "p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3 mb-4";
        card.innerHTML = `
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <span class="text-xs font-semibold uppercase tracking-wider text-indigo-400">Education #${idx + 1}</span>
                <button onclick="removeEducation(${idx})" class="text-xs text-red-400 hover:text-red-300 font-medium transition">
                    Delete
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Institution / University</label>
                    <input type="text" value="${escapeHtml(edu.institution || '')}" oninput="updateEduField(${idx}, 'institution', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="e.g. UC Berkeley">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Degree</label>
                    <input type="text" value="${escapeHtml(edu.degree || '')}" oninput="updateEduField(${idx}, 'degree', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="e.g. Bachelor of Science">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Field of Study</label>
                    <input type="text" value="${escapeHtml(edu.field_of_study || '')}" oninput="updateEduField(${idx}, 'field_of_study', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="e.g. Computer Science">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Graduation Date</label>
                    <input type="text" value="${escapeHtml(edu.graduation_date || '')}" oninput="updateEduField(${idx}, 'graduation_date', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="e.g. May 2021">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">GPA / Honors (Optional)</label>
                    <input type="text" value="${escapeHtml(edu.gpa || '')}" oninput="updateEduField(${idx}, 'gpa', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="e.g. 3.9 / 4.0">
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderSkills() {
    const container = document.getElementById("skillsList");
    container.innerHTML = "";

    AppState.resume.skills.forEach((sc, catIdx) => {
        const card = document.createElement("div");
        card.className = "p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 mb-3";

        let tagsHtml = "";
        sc.skills.forEach((skill, sIdx) => {
            tagsHtml += `
                <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 rounded-md transition">
                    ${escapeHtml(skill)}
                    <button onclick="removeSkillTag(${catIdx}, ${sIdx})" class="text-slate-400 hover:text-red-400 font-bold ml-1">×</button>
                </span>
            `;
        });

        card.innerHTML = `
            <div class="flex items-center justify-between">
                <input type="text" value="${escapeHtml(sc.category)}" oninput="updateSkillCategoryName(${catIdx}, this.value)" class="bg-transparent text-xs font-semibold text-indigo-400 border-b border-transparent hover:border-slate-700 focus:border-indigo-500 outline-none py-0.5">
                <button onclick="removeSkillCategory(${catIdx})" class="text-xs text-red-400 hover:text-red-300">Delete Category</button>
            </div>
            <div class="flex flex-wrap gap-1.5 items-center">
                ${tagsHtml}
                <div class="flex items-center gap-1">
                    <input type="text" id="newSkillInput_${catIdx}" onkeydown="handleSkillInputKey(event, ${catIdx})" placeholder="+ Add skill (hit Enter)" class="bg-slate-800 border border-slate-700 rounded-md px-2 py-0.5 text-xs text-slate-200 focus:border-indigo-500 outline-none w-36">
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderProjects() {
    const container = document.getElementById("projectsList");
    container.innerHTML = "";

    AppState.resume.projects.forEach((proj, pIdx) => {
        const card = document.createElement("div");
        card.className = "p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3 mb-4";
        
        let bulletsHtml = "";
        proj.bullets.forEach((bullet, bIdx) => {
            bulletsHtml += `
                <div class="flex items-start gap-2">
                    <span class="text-slate-500 mt-2 select-none">•</span>
                    <textarea oninput="updateProjBullet(${pIdx}, ${bIdx}, this.value)" rows="2" class="flex-1 bg-slate-800/80 border border-slate-700/80 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-200 outline-none resize-none transition">${bullet}</textarea>
                    <div class="flex flex-col gap-1">
                        <button onclick="polishBulletWithAI(${pIdx}, ${bIdx}, true)" class="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-md text-xs font-medium transition">
                            ✨ AI
                        </button>
                        <button onclick="removeProjBullet(${pIdx}, ${bIdx})" class="px-2 py-1 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-md text-xs transition">
                            ✕
                        </button>
                    </div>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <span class="text-xs font-semibold uppercase tracking-wider text-indigo-400">Project #${pIdx + 1}</span>
                <button onclick="removeProject(${pIdx})" class="text-xs text-red-400 hover:text-red-300 font-medium transition">
                    Delete
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Project Title</label>
                    <input type="text" value="${escapeHtml(proj.title || '')}" oninput="updateProjField(${pIdx}, 'title', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="e.g. Distributed Task Orchestrator">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-400 mb-1">Tech Stack (comma-separated)</label>
                    <input type="text" value="${escapeHtml((proj.tech_stack || []).join(', '))}" oninput="updateProjTechStack(${pIdx}, this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="e.g. Python, FastAPI, Docker">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-xs font-medium text-slate-400 mb-1">Project Link / GitHub URL</label>
                    <input type="text" value="${escapeHtml(proj.link || '')}" oninput="updateProjField(${pIdx}, 'link', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="e.g. https://github.com/user/project">
                </div>
            </div>
            <div>
                <div class="flex items-center justify-between mb-2">
                    <label class="block text-xs font-medium text-slate-400">Project Bullets</label>
                    <button onclick="addProjBullet(${pIdx})" class="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition">
                        + Add Bullet
                    </button>
                </div>
                <div class="space-y-2">
                    ${bulletsHtml}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderCertifications() {
    const container = document.getElementById("certificationsList");
    container.innerHTML = "";

    AppState.resume.certifications.forEach((cert, cIdx) => {
        const card = document.createElement("div");
        card.className = "p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 mb-3";
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-indigo-400">Cert #${cIdx + 1}</span>
                <button onclick="removeCertification(${cIdx})" class="text-xs text-red-400 hover:text-red-300">Delete</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                    <input type="text" value="${escapeHtml(cert.name || '')}" oninput="updateCertField(${cIdx}, 'name', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="Certification Name">
                </div>
                <div>
                    <input type="text" value="${escapeHtml(cert.issuer || '')}" oninput="updateCertField(${cIdx}, 'issuer', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="Issuer (e.g. AWS, Google)">
                </div>
                <div>
                    <input type="text" value="${escapeHtml(cert.date || '')}" oninput="updateCertField(${cIdx}, 'date', this.value)" class="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 outline-none" placeholder="Year / Date">
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// =====================================================================
// Live ATS Document Preview (Paper Simulator)
// =====================================================================

function renderLivePreview() {
    const p = AppState.resume.personal_info;

    // Header
    document.getElementById("prevName").innerText = p.full_name ? p.full_name.toUpperCase() : "YOUR NAME";
    document.getElementById("prevTargetRole").innerText = p.target_role || "";

    const contactParts = [];
    if (p.email) contactParts.push(p.email);
    if (p.phone) contactParts.push(p.phone);
    if (p.location) contactParts.push(p.location);
    if (p.linkedin) contactParts.push(p.linkedin);
    if (p.github) contactParts.push(p.github);
    if (p.portfolio) contactParts.push(p.portfolio);
    document.getElementById("prevContact").innerText = contactParts.join(" • ");

    // Summary
    const sumSec = document.getElementById("prevSummarySec");
    if (AppState.resume.summary && AppState.resume.summary.trim()) {
        sumSec.classList.remove("hidden");
        document.getElementById("prevSummary").innerText = AppState.resume.summary;
    } else {
        sumSec.classList.add("hidden");
    }

    // Experience
    const expSec = document.getElementById("prevExpSec");
    const expContainer = document.getElementById("prevExpList");
    if (AppState.resume.work_experience && AppState.resume.work_experience.length > 0) {
        expSec.classList.remove("hidden");
        expContainer.innerHTML = "";
        AppState.resume.work_experience.forEach(exp => {
            const dates = `${exp.start_date || ''} – ${exp.current ? 'Present' : (exp.end_date || '')}`;
            const locStr = exp.location ? ` | ${exp.location}` : '';
            const item = document.createElement("div");
            item.className = "mb-2.5";
            
            let bullets = "";
            (exp.bullets || []).forEach(b => {
                if (b.trim()) {
                    bullets += `<div class="ats-bullet">${escapeHtml(b)}</div>`;
                }
            });

            item.innerHTML = `
                <div class="ats-item-header">
                    <div><b>${escapeHtml(exp.role || 'Role')}</b>, ${escapeHtml(exp.company || 'Company')}${escapeHtml(locStr)}</div>
                    <div class="font-semibold text-slate-600">${escapeHtml(dates)}</div>
                </div>
                <div class="space-y-0.5">${bullets}</div>
            `;
            expContainer.appendChild(item);
        });
    } else {
        expSec.classList.add("hidden");
    }

    // Education
    const eduSec = document.getElementById("prevEduSec");
    const eduContainer = document.getElementById("prevEduList");
    if (AppState.resume.education && AppState.resume.education.length > 0) {
        eduSec.classList.remove("hidden");
        eduContainer.innerHTML = "";
        AppState.resume.education.forEach(edu => {
            const item = document.createElement("div");
            item.className = "mb-2";
            item.innerHTML = `
                <div class="ats-item-header">
                    <div><b>${escapeHtml(edu.degree || 'Degree')}</b> in ${escapeHtml(edu.field_of_study || '')} – ${escapeHtml(edu.institution || '')}</div>
                    <div class="font-semibold text-slate-600">${escapeHtml(edu.graduation_date || '')}</div>
                </div>
                ${edu.gpa ? `<div class="text-xs text-slate-500 italic">GPA: ${escapeHtml(edu.gpa)}</div>` : ''}
            `;
            eduContainer.appendChild(item);
        });
    } else {
        eduSec.classList.add("hidden");
    }

    // Skills
    const skillsSec = document.getElementById("prevSkillsSec");
    const skillsContainer = document.getElementById("prevSkillsList");
    if (AppState.resume.skills && AppState.resume.skills.length > 0) {
        skillsSec.classList.remove("hidden");
        skillsContainer.innerHTML = "";
        AppState.resume.skills.forEach(sc => {
            if (sc.skills && sc.skills.length > 0) {
                const row = document.createElement("div");
                row.className = "text-xs mb-1";
                row.innerHTML = `<b>${escapeHtml(sc.category)}:</b> ${escapeHtml(sc.skills.join(', '))}`;
                skillsContainer.appendChild(row);
            }
        });
    } else {
        skillsSec.classList.add("hidden");
    }

    // Projects
    const projSec = document.getElementById("prevProjSec");
    const projContainer = document.getElementById("prevProjList");
    if (AppState.resume.projects && AppState.resume.projects.length > 0) {
        projSec.classList.remove("hidden");
        projContainer.innerHTML = "";
        AppState.resume.projects.forEach(proj => {
            const item = document.createElement("div");
            item.className = "mb-2";
            let bullets = "";
            (proj.bullets || []).forEach(b => {
                if (b.trim()) bullets += `<div class="ats-bullet">${escapeHtml(b)}</div>`;
            });
            item.innerHTML = `
                <div class="ats-item-header">
                    <div><b>${escapeHtml(proj.title)}</b> <i class="text-slate-500 font-normal">(${escapeHtml((proj.tech_stack || []).join(', '))})</i></div>
                </div>
                ${bullets}
            `;
            projContainer.appendChild(item);
        });
    } else {
        projSec.classList.add("hidden");
    }

    // Certifications
    const certSec = document.getElementById("prevCertSec");
    const certContainer = document.getElementById("prevCertList");
    if (AppState.resume.certifications && AppState.resume.certifications.length > 0) {
        certSec.classList.remove("hidden");
        certContainer.innerHTML = "";
        AppState.resume.certifications.forEach(cert => {
            const item = document.createElement("div");
            item.className = "ats-bullet";
            item.innerHTML = `<b>${escapeHtml(cert.name)}</b> – ${escapeHtml(cert.issuer)} (${escapeHtml(cert.date)})`;
            certContainer.appendChild(item);
        });
    } else {
        certSec.classList.add("hidden");
    }
}

function renderXRayView(rawText) {
    const el = document.getElementById("atsXRayContent");
    if (el) {
        el.innerText = rawText || "Generating ATS Parser stream...";
    }
}

// =====================================================================
// Diagnostic Scoreboard
// =====================================================================

function renderScoreBoard(scoreData) {
    const scoreVal = scoreData.overall_score || 0;
    
    // Top Score Badge
    const badge = document.getElementById("headerAtsBadge");
    if (badge) {
        badge.innerText = `${scoreVal}/100 ATS Score`;
        badge.className = `px-3 py-1 rounded-full text-xs font-bold transition ${
            scoreVal >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            scoreVal >= 60 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            'bg-red-500/20 text-red-400 border border-red-500/30'
        }`;
    }

    // Main Score Gauge in Sidebar
    const overallEl = document.getElementById("scoreOverallValue");
    if (overallEl) {
        overallEl.innerText = scoreVal;
        overallEl.className = `text-4xl font-extrabold ${
            scoreVal >= 80 ? 'text-emerald-400' :
            scoreVal >= 60 ? 'text-amber-400' :
            'text-red-400'
        }`;
    }

    // Sub-bars
    setProgressBar("barCompleteness", scoreData.completeness_score, 25);
    setProgressBar("barActionVerbs", scoreData.action_verb_score, 25);
    setProgressBar("barMetrics", scoreData.metrics_score, 25);
    setProgressBar("barFormatting", scoreData.formatting_score, 25);

    // Recommendations list
    const recList = document.getElementById("recommendationsList");
    if (recList) {
        recList.innerHTML = "";
        (scoreData.recommendations || []).forEach(r => {
            const div = document.createElement("div");
            div.className = `p-3 rounded-xl border text-xs leading-relaxed ${
                r.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                r.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                r.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`;
            div.innerHTML = `
                <div class="font-semibold flex items-center gap-1.5 mb-1">
                    <span>${r.type === 'error' ? '⚠️' : r.type === 'warning' ? '⚡' : r.type === 'success' ? '✓' : '💡'}</span>
                    <span>${r.title}</span>
                </div>
                <p class="text-slate-300 text-xs">${r.message}</p>
            `;
            recList.appendChild(div);
        });
    }
}

function setProgressBar(elementId, value, maxVal) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const pct = Math.min(100, Math.round((value / maxVal) * 100));
    el.style.width = `${pct}%`;
    el.className = `h-2 rounded-full transition-all duration-500 ${
        pct >= 80 ? 'bg-emerald-500' :
        pct >= 60 ? 'bg-amber-500' :
        'bg-red-500'
    }`;
}

function renderJDMatchResults(data) {
    const container = document.getElementById("jdResultsContainer");
    container.classList.remove("hidden");

    document.getElementById("jdMatchScoreBadge").innerText = `${data.match_score}% Match`;
    
    // Matched Keywords
    const matchedBox = document.getElementById("jdMatchedKeywords");
    matchedBox.innerHTML = "";
    (data.matched_keywords || []).forEach(kw => {
        matchedBox.innerHTML += `<span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-xs font-medium">${kw}</span>`;
    });

    // Missing Keywords
    const missingBox = document.getElementById("jdMissingKeywords");
    missingBox.innerHTML = "";
    (data.missing_keywords || []).forEach(kw => {
        missingBox.innerHTML += `<span class="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded text-xs font-medium">${kw}</span>`;
    });
}

// =====================================================================
// State Mutation Handlers
// =====================================================================

function updatePersonalField(field, val) {
    AppState.resume.personal_info[field] = val;
    saveState();
}

function updateSummary(val) {
    AppState.resume.summary = val;
    saveState();
}

function addExperience() {
    AppState.resume.work_experience.unshift({
        id: "exp-" + Date.now(),
        company: "New Company",
        role: "Role Title",
        location: "City, Country",
        start_date: "2023",
        end_date: "Present",
        current: true,
        bullets: ["Spearheaded core initiative, increasing operational efficiency by 25%."]
    });
    renderExperience();
    saveState();
}

function removeExperience(idx) {
    AppState.resume.work_experience.splice(idx, 1);
    renderExperience();
    saveState();
}

function updateExpField(idx, field, val) {
    AppState.resume.work_experience[idx][field] = val;
    saveState();
}

function toggleExpCurrent(idx, isChecked) {
    AppState.resume.work_experience[idx].current = isChecked;
    if (isChecked) AppState.resume.work_experience[idx].end_date = "Present";
    renderExperience();
    saveState();
}

function addBullet(expIdx) {
    AppState.resume.work_experience[expIdx].bullets.push("Engineered high-performance module, optimizing latency by 30%.");
    renderExperience();
    saveState();
}

function removeBullet(expIdx, bIdx) {
    AppState.resume.work_experience[expIdx].bullets.splice(bIdx, 1);
    renderExperience();
    saveState();
}

function updateBullet(expIdx, bIdx, val) {
    AppState.resume.work_experience[expIdx].bullets[bIdx] = val;
    saveState();
}

function addEducation() {
    AppState.resume.education.push({
        id: "edu-" + Date.now(),
        institution: "University Name",
        degree: "Bachelor of Science",
        field_of_study: "Computer Science",
        location: "City, State",
        graduation_date: "2022",
        gpa: "",
        honors: ""
    });
    renderEducation();
    saveState();
}

function removeEducation(idx) {
    AppState.resume.education.splice(idx, 1);
    renderEducation();
    saveState();
}

function updateEduField(idx, field, val) {
    AppState.resume.education[idx][field] = val;
    saveState();
}

function addSkillCategory() {
    AppState.resume.skills.push({
        category: "New Skill Category",
        skills: ["Skill 1", "Skill 2"]
    });
    renderSkills();
    saveState();
}

function removeSkillCategory(idx) {
    AppState.resume.skills.splice(idx, 1);
    renderSkills();
    saveState();
}

function updateSkillCategoryName(idx, val) {
    AppState.resume.skills[idx].category = val;
    saveState();
}

function removeSkillTag(catIdx, sIdx) {
    AppState.resume.skills[catIdx].skills.splice(sIdx, 1);
    renderSkills();
    saveState();
}

function handleSkillInputKey(e, catIdx) {
    if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const input = document.getElementById(`newSkillInput_${catIdx}`);
        const val = input.value.trim().replace(/^,+|,+$/g, "");
        if (val) {
            AppState.resume.skills[catIdx].skills.push(val);
            input.value = "";
            renderSkills();
            saveState();
        }
    }
}

function addProject() {
    AppState.resume.projects.push({
        id: "proj-" + Date.now(),
        title: "New Project Title",
        tech_stack: ["Python", "Docker"],
        link: "https://github.com/...",
        bullets: ["Developed full-stack architecture processing 10,000 requests per minute."]
    });
    renderProjects();
    saveState();
}

function removeProject(idx) {
    AppState.resume.projects.splice(idx, 1);
    renderProjects();
    saveState();
}

function updateProjField(idx, field, val) {
    AppState.resume.projects[idx][field] = val;
    saveState();
}

function updateProjTechStack(idx, val) {
    AppState.resume.projects[idx].tech_stack = val.split(",").map(s => s.trim()).filter(Boolean);
    saveState();
}

function addProjBullet(pIdx) {
    AppState.resume.projects[pIdx].bullets.push("Automated pipeline deployment, cutting testing time by 50%.");
    renderProjects();
    saveState();
}

function removeProjBullet(pIdx, bIdx) {
    AppState.resume.projects[pIdx].bullets.splice(bIdx, 1);
    renderProjects();
    saveState();
}

function updateProjBullet(pIdx, bIdx, val) {
    AppState.resume.projects[pIdx].bullets[bIdx] = val;
    saveState();
}

function addCertification() {
    AppState.resume.certifications.push({
        id: "cert-" + Date.now(),
        name: "Certificate Name",
        issuer: "Issuing Organization",
        date: "2023",
        credential_id: "",
        url: ""
    });
    renderCertifications();
    saveState();
}

function removeCertification(idx) {
    AppState.resume.certifications.splice(idx, 1);
    renderCertifications();
    saveState();
}

function updateCertField(idx, field, val) {
    AppState.resume.certifications[idx][field] = val;
    saveState();
}

// =====================================================================
// Event Handlers & Modals
// =====================================================================

function setupEventHandlers() {
    // Navigation Tabs
    const tabButtons = document.querySelectorAll(".nav-tab-btn");
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            switchTab(targetTab);
        });
    });

    // Preview Mode Toggle (Paper vs X-Ray)
    document.getElementById("btnViewPaper").addEventListener("click", () => setPreviewMode("paper"));
    document.getElementById("btnViewXRay").addEventListener("click", () => setPreviewMode("xray"));

    // Hugging Face Settings Form
    document.getElementById("btnSaveHfConfig").addEventListener("click", () => {
        const tokenInput = document.getElementById("hfTokenInput").value.trim();
        const modelSelect = document.getElementById("hfModelSelect").value;
        AppState.hfToken = tokenInput;
        AppState.hfModel = modelSelect;
        localStorage.setItem("hf_user_token", tokenInput);
        localStorage.setItem("hf_user_model", modelSelect);
        updateModelBadge();
        closeModal("hfConfigModal");
        showNotification("Hugging Face preferences saved!", "success");
    });
}

function switchTab(tabId) {
    AppState.currentTab = tabId;
    document.querySelectorAll(".tab-content-panel").forEach(panel => {
        panel.classList.add("hidden");
    });
    const activePanel = document.getElementById(`tabPanel_${tabId}`);
    if (activePanel) activePanel.classList.remove("hidden");

    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
        if (btn.getAttribute("data-tab") === tabId) {
            btn.classList.add("bg-indigo-600", "text-white");
            btn.classList.remove("text-slate-400", "hover:text-slate-200", "hover:bg-slate-800");
        } else {
            btn.classList.remove("bg-indigo-600", "text-white");
            btn.classList.add("text-slate-400", "hover:text-slate-200", "hover:bg-slate-800");
        }
    });
}

function setPreviewMode(mode) {
    AppState.previewMode = mode;
    const paperView = document.getElementById("atsPaperContainer");
    const xrayView = document.getElementById("atsXRayContainer");
    const btnPaper = document.getElementById("btnViewPaper");
    const btnXRay = document.getElementById("btnViewXRay");

    if (mode === "paper") {
        paperView.classList.remove("hidden");
        xrayView.classList.add("hidden");
        btnPaper.classList.add("bg-indigo-600", "text-white");
        btnPaper.classList.remove("text-slate-400");
        btnXRay.classList.remove("bg-indigo-600", "text-white");
        btnXRay.classList.add("text-slate-400");
    } else {
        paperView.classList.add("hidden");
        xrayView.classList.remove("hidden");
        btnXRay.classList.add("bg-indigo-600", "text-white");
        btnXRay.classList.remove("text-slate-400");
        btnPaper.classList.remove("bg-indigo-600", "text-white");
        btnPaper.classList.add("text-slate-400");
        if (AppState.atsScore && AppState.atsScore.raw_ats_text) {
            renderXRayView(AppState.atsScore.raw_ats_text);
        }
    }
}

function updateModelBadge() {
    const badge = document.getElementById("headerModelBadge");
    if (!badge) return;
    const shortModel = AppState.hfModel.split("/")[1] || AppState.hfModel;
    if (AppState.hfToken) {
        badge.innerText = `🤗 HF: ${shortModel}`;
        badge.className = "px-3 py-1 bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-semibold cursor-pointer hover:bg-yellow-500/20 transition flex items-center gap-1.5";
    } else {
        badge.innerText = `✨ Smart GenAI (Local)`;
        badge.className = "px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full text-xs font-semibold cursor-pointer hover:bg-purple-500/20 transition flex items-center gap-1.5";
    }
    document.getElementById("hfTokenInput").value = AppState.hfToken || "";
    document.getElementById("hfModelSelect").value = AppState.hfModel;
}

function openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove("hidden");
}

function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add("hidden");
}

function showNotification(message, type = "info") {
    const toast = document.getElementById("toastNotification");
    if (!toast) return;
    toast.innerText = message;
    toast.className = `fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold transition transform duration-300 z-50 ${
        type === 'success' ? 'bg-emerald-600 text-white' :
        type === 'warning' ? 'bg-amber-600 text-white' :
        type === 'error' ? 'bg-red-600 text-white' :
        'bg-slate-800 text-slate-100 border border-slate-700'
    }`;
    toast.classList.remove("translate-y-24", "opacity-0");
    setTimeout(() => {
        toast.classList.add("translate-y-24", "opacity-0");
    }, 3200);
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

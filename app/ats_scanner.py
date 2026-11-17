import re
from typing import Dict, List, Tuple, Any, Set
from app.models import ResumeData, RecommendationItem

# Power Action Verbs by Category
ACTION_VERBS = {
    "leadership": [
        "spearheaded", "orchestrated", "championed", "directed", "steered",
        "headed", "mentored", "empowered", "supervised", "governed", "guided",
        "cultivated", "mobilized", "fostered", "commanded"
    ],
    "technical": [
        "architected", "engineered", "developed", "deployed", "implemented",
        "refactored", "automated", "optimized", "migrated", "configured",
        "containerized", "integrated", "benchmarked", "modernized", "modeled"
    ],
    "execution": [
        "delivered", "executed", "accelerated", "scaled", "established",
        "overhauled", "streamlined", "standardized", "launched", "boosted",
        "restructured", "revamped", "eliminated", "consolidated", "upgraded"
    ],
    "analytical": [
        "analyzed", "evaluated", "diagnosed", "audited", "forecasted",
        "quantified", "formulated", "researched", "validated", "monitored"
    ]
}

ALL_POWER_VERBS: Set[str] = set()
for verbs in ACTION_VERBS.values():
    ALL_POWER_VERBS.update(verbs)

# Additional recognized action verbs
ALL_POWER_VERBS.update([
    "achieved", "administered", "amplified", "built", "collaborated", "constructed",
    "created", "decreased", "designed", "doubled", "drove", "enhanced", "expanded",
    "expedited", "facilitated", "founded", "generated", "identified", "improved",
    "increased", "initiated", "innovated", "instituted", "introduced", "investigated",
    "led", "leveraged", "managed", "maximized", "minimized", "negotiated", "pioneered",
    "planned", "programmed", "promoted", "rebuilt", "redefined", "reduced", "resolved",
    "simplified", "strengthened", "structured", "surpassed", "transformed", "unified"
])

# Weak or Passive Phrases to Flag
WEAK_PHRASES = [
    "responsible for", "duties included", "worked on", "assisted with", "helped to",
    "involved in", "handled", "participated in", "served as", "did", "tasked with",
    "worked with", "helped", "assisted", "contributed to"
]

# Common Technical Keywords for JD Matching
COMMON_TECH_KEYWORDS = {
    "python", "javascript", "typescript", "java", "c++", "c#", "golang", "go", "rust", "ruby", "php", "swift", "kotlin",
    "react", "vue", "angular", "next.js", "node.js", "express", "django", "fastapi", "flask", "spring boot", "asp.net",
    "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "terraform", "ansible", "jenkins", "github actions", "gitlab",
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb", "snowflake", "bigquery",
    "rest", "graphql", "grpc", "microservices", "event-driven", "kafka", "rabbitmq", "celery",
    "machine learning", "deep learning", "nlp", "llm", "genai", "pytorch", "tensorflow", "hugging face", "scikit-learn",
    "git", "linux", "agile", "scrum", "jira", "unit testing", "tdd", "system design", "distributed systems"
}

METRIC_PATTERNS = [
    r'\b\d+(\.\d+)?%',                      # 25%, 3.5%
    r'\$\s*\d+[\d,]*(\.\d+)?[KkMmBb]?',     # $50,000, $2M, $100k
    r'\b\d+\s*[\+]\s*(users|clients|customers|engineers|members|developers|servers|queries|requests|transactions)\b',
    r'\b(increased|reduced|boosted|saved|decreased|accelerated|improved|scaled|cut|expanded)\b[^\.\;\n]{1,40}\b\d+',
    r'\b\d+x\b',                            # 10x, 2x
    r'\b\d+\s*(milliseconds|ms|seconds|minutes|hours|days|weeks|months|years)\b'
]

def scan_text_for_metrics(text: str) -> bool:
    """Check if text contains quantifiable metrics."""
    for pattern in METRIC_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False

def check_bullet_action_verb(bullet: str) -> Tuple[bool, str, str]:
    """
    Check if a bullet starts with a power action verb.
    Returns: (is_strong, detected_verb, issue_reason)
    """
    cleaned = bullet.strip().lstrip("-•* \t")
    if not cleaned:
        return False, "", "Empty bullet point"

    lower_bullet = cleaned.lower()

    # Check for weak phrases first
    for weak in WEAK_PHRASES:
        if lower_bullet.startswith(weak):
            return False, weak, f"Starts with passive phrase '{weak}'. Replace with a dynamic action verb."

    # Extract first word
    words = re.findall(r'[a-zA-Z\-]+', cleaned)
    if not words:
        return False, "", "No recognizable words found"

    first_word = words[0].lower()

    if first_word in ALL_POWER_VERBS:
        return True, first_word, "Strong action verb"
    
    # Check if first two words form a verb phrase
    if len(words) > 1:
        phrase = f"{words[0]} {words[1]}".lower()
        if phrase in ALL_POWER_VERBS:
            return True, phrase, "Strong action verb phrase"

    return False, first_word, f"'{first_word}' is not a recognized power action verb. Consider verbs like 'Spearheaded', 'Engineered', 'Orchestrated', 'Optimized'."

def generate_ats_raw_text(resume: ResumeData) -> str:
    """
    Simulate the plain text output that an Applicant Tracking System parser extracts.
    """
    lines = []
    p = resume.personal_info
    
    # Header
    if p.full_name:
        lines.append(p.full_name.upper())
    contact_parts = [part for part in [p.email, p.phone, p.location, p.linkedin, p.github, p.portfolio] if part]
    if contact_parts:
        lines.append(" | ".join(contact_parts))
    lines.append("")

    # Summary
    if resume.summary:
        lines.append("PROFESSIONAL SUMMARY")
        lines.append("-" * 30)
        lines.append(resume.summary.strip())
        lines.append("")

    # Work Experience
    if resume.work_experience:
        lines.append("WORK EXPERIENCE")
        lines.append("-" * 30)
        for exp in resume.work_experience:
            dates = f"{exp.start_date} - {'Present' if exp.current else exp.end_date}".strip()
            loc = f" ({exp.location})" if exp.location else ""
            lines.append(f"{exp.role} | {exp.company}{loc} | {dates}")
            for b in exp.bullets:
                if b.strip():
                    lines.append(f"• {b.strip()}")
            lines.append("")

    # Education
    if resume.education:
        lines.append("EDUCATION")
        lines.append("-" * 30)
        for edu in resume.education:
            loc = f" ({edu.location})" if edu.location else ""
            lines.append(f"{edu.degree} in {edu.field_of_study} | {edu.institution}{loc} | {edu.graduation_date}")
            if edu.gpa or edu.honors:
                extra = []
                if edu.gpa: extra.append(f"GPA: {edu.gpa}")
                if edu.honors: extra.append(edu.honors)
                lines.append("  " + " | ".join(extra))
            lines.append("")

    # Skills
    if resume.skills:
        lines.append("SKILLS")
        lines.append("-" * 30)
        for sc in resume.skills:
            if sc.skills:
                lines.append(f"{sc.category}: {', '.join(sc.skills)}")
        lines.append("")

    # Projects
    if resume.projects:
        lines.append("PROJECTS")
        lines.append("-" * 30)
        for proj in resume.projects:
            tech = f" (Tech Stack: {', '.join(proj.tech_stack)})" if proj.tech_stack else ""
            lines.append(f"{proj.title}{tech}")
            if proj.link:
                lines.append(f"URL: {proj.link}")
            for b in proj.bullets:
                if b.strip():
                    lines.append(f"• {b.strip()}")
            lines.append("")

    # Certifications
    if resume.certifications:
        lines.append("CERTIFICATIONS")
        lines.append("-" * 30)
        for cert in resume.certifications:
            lines.append(f"{cert.name} - {cert.issuer} ({cert.date})")
        lines.append("")

    return "\n".join(lines)

def extract_keywords_from_text(text: str) -> Set[str]:
    """Extract standard and domain keywords from arbitrary text."""
    found = set()
    lowered = text.lower()

    # Search for known tech keywords
    for kw in COMMON_TECH_KEYWORDS:
        # Regex boundary check
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, lowered):
            found.add(kw)

    # Search for capitalized multi-word phrases or acronyms
    acronyms = re.findall(r'\b[A-Z]{2,6}\b', text)
    for ac in acronyms:
        if ac not in {"THE", "AND", "FOR", "WITH", "THAT", "THIS"}:
            found.add(ac.lower())

    return found

def match_job_description(resume_text: str, jd_text: str) -> Tuple[int, List[str], List[str]]:
    """
    Match resume text against job description text.
    Returns: (match_score_pct, matched_keywords, missing_keywords)
    """
    if not jd_text.strip():
        return 100, [], []

    jd_keywords = extract_keywords_from_text(jd_text)
    if not jd_keywords:
        # Fallback to frequent words in JD
        words = re.findall(r'\b[a-zA-Z]{4,20}\b', jd_text.lower())
        stopwords = {
            "with", "have", "this", "that", "from", "they", "will", "would", "there",
            "their", "what", "about", "which", "when", "make", "like", "time", "just",
            "know", "take", "people", "into", "year", "your", "good", "some", "could",
            "them", "other", "than", "then", "look", "only", "come", "over", "think",
            "also", "back", "after", "work", "first", "well", "even", "want", "because",
            "must", "should", "team", "years", "experience", "role", "candidate", "responsibilities"
        }
        word_freq = {}
        for w in words:
            if w not in stopwords:
                word_freq[w] = word_freq.get(w, 0) + 1
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        jd_keywords = set([w for w, count in sorted_words[:25]])

    resume_keywords = extract_keywords_from_text(resume_text)
    lowered_resume = resume_text.lower()

    matched = []
    missing = []

    for kw in sorted(jd_keywords):
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, lowered_resume):
            matched.append(kw)
        else:
            missing.append(kw)

    total = len(jd_keywords)
    score = int((len(matched) / total) * 100) if total > 0 else 100
    return score, matched, missing

def evaluate_resume_ats(resume: ResumeData, job_description: str = "") -> Dict[str, Any]:
    """
    Comprehensive ATS evaluation algorithm.
    Returns a full diagnostic report with scores, recommendations, and feedback.
    """
    recommendations: List[RecommendationItem] = []
    bullet_feedback: List[Dict[str, Any]] = []

    # 1. Contact & Completeness Score (Max 25 pts)
    comp_score = 0
    p = resume.personal_info
    
    if p.full_name.strip():
        comp_score += 4
    else:
        recommendations.append(RecommendationItem(
            type="error", section="Contact Info",
            title="Full Name Missing",
            message="ATS parsers index resumes by candidate name at the top."
        ))

    if re.search(r'[\w\.-]+@[\w\.-]+\.\w+', p.email):
        comp_score += 4
    else:
        recommendations.append(RecommendationItem(
            type="error", section="Contact Info",
            title="Valid Email Missing",
            message="Ensure a professional email (e.g., name@gmail.com) is present."
        ))

    if re.search(r'\d{3,}', p.phone):
        comp_score += 4
    else:
        recommendations.append(RecommendationItem(
            type="warning", section="Contact Info",
            title="Phone Number Missing",
            message="Recruiters often contact candidates via phone for initial screenings."
        ))

    if p.location.strip():
        comp_score += 3
    else:
        recommendations.append(RecommendationItem(
            type="warning", section="Contact Info",
            title="Location Missing",
            message="Add city and state/country to pass location-filtered ATS queries."
        ))

    if p.linkedin and ("linkedin.com" in p.linkedin.lower() or "in/" in p.linkedin.lower()):
        comp_score += 2
    else:
        recommendations.append(RecommendationItem(
            type="tip", section="Contact Info",
            title="LinkedIn Profile Missing",
            message="Adding your LinkedIn profile increases recruiter response rates by 71%."
        ))

    # Summary Check
    if resume.summary.strip():
        word_count = len(resume.summary.split())
        if 25 <= word_count <= 100:
            comp_score += 4
        elif word_count < 25:
            comp_score += 2
            recommendations.append(RecommendationItem(
                type="warning", section="Summary",
                title="Summary Too Short",
                message="Aim for 3-4 impactful sentences (30-80 words) highlighting your core competencies."
            ))
        else:
            comp_score += 3
            recommendations.append(RecommendationItem(
                type="tip", section="Summary",
                title="Summary Length",
                message="Keep summary concise (under 100 words) so ATS parsers highlight key skills immediately."
            ))
    else:
        recommendations.append(RecommendationItem(
            type="warning", section="Summary",
            title="Professional Summary Missing",
            message="A targeted 3-sentence summary helps ATS match your core profile."
        ))

    # Experience & Education existence
    if resume.work_experience and len(resume.work_experience) > 0:
        comp_score += 2
    else:
        recommendations.append(RecommendationItem(
            type="error", section="Experience",
            title="No Work Experience Listed",
            message="Work experience is the primary section weighted by ATS algorithms."
        ))

    if resume.education and len(resume.education) > 0:
        comp_score += 2
    else:
        recommendations.append(RecommendationItem(
            type="warning", section="Education",
            title="No Education Listed",
            message="ATS scanners filter candidate degree credentials against job prerequisites."
        ))

    # 2. Action Verbs Score (Max 25 pts)
    all_bullets = []
    for exp in resume.work_experience:
        for idx, b in enumerate(exp.bullets):
            if b.strip():
                all_bullets.append((exp.company, exp.role, idx, b))
    for proj in resume.projects:
        for idx, b in enumerate(proj.bullets):
            if b.strip():
                all_bullets.append((proj.title, "Project", idx, b))

    power_verb_count = 0
    weak_phrase_count = 0

    for company, role, idx, bullet in all_bullets:
        is_strong, verb, reason = check_bullet_action_verb(bullet)
        has_metric = scan_text_for_metrics(bullet)
        
        fb_item = {
            "source": f"{role} at {company}",
            "bullet": bullet,
            "is_strong_verb": is_strong,
            "detected_verb": verb,
            "verb_reason": reason,
            "has_metric": has_metric
        }
        bullet_feedback.append(fb_item)

        if is_strong:
            power_verb_count += 1
        if any(weak in bullet.lower() for weak in WEAK_PHRASES):
            weak_phrase_count += 1

    total_bullets = len(all_bullets)
    if total_bullets > 0:
        action_verb_ratio = power_verb_count / total_bullets
        action_score = int(action_verb_ratio * 25)
        if weak_phrase_count > 0:
            action_score = max(0, action_score - (weak_phrase_count * 2))
            recommendations.append(RecommendationItem(
                type="warning", section="Action Verbs",
                title=f"{weak_phrase_count} Passive Phrases Detected",
                message="Replace phrases like 'responsible for' or 'worked on' with power verbs (e.g. 'Engineered', 'Spearheaded')."
            ))
        if action_verb_ratio < 0.6:
            recommendations.append(RecommendationItem(
                type="warning", section="Action Verbs",
                title="Boost Power Verbs",
                message=f"Only {power_verb_count} of {total_bullets} bullets start with recognized action verbs. Aim for 80%+."
            ))
        else:
            recommendations.append(RecommendationItem(
                type="success", section="Action Verbs",
                title="Strong Action Verbs",
                message=f"{power_verb_count} bullets use strong, proactive action verbs!"
            ))
    else:
        action_score = 10

    # 3. Quantifiable Results & Metrics Score (Max 25 pts)
    metrics_count = sum(1 for item in bullet_feedback if item["has_metric"])
    if total_bullets > 0:
        metric_ratio = metrics_count / total_bullets
        # In a top resume, 50-70% of bullets should have measurable metrics
        metric_score = min(25, int((metric_ratio / 0.5) * 25))
        if metric_ratio < 0.4:
            recommendations.append(RecommendationItem(
                type="warning", section="Impact & Metrics",
                title="Low Quantified Impact",
                message=f"Only {metrics_count} of {total_bullets} bullets contain metrics. Use Google's XYZ formula: 'Accomplished [X] measured by [Y] by doing [Z]'."
            ))
        else:
            recommendations.append(RecommendationItem(
                type="success", section="Impact & Metrics",
                title="Great Metric Density",
                message=f"{metrics_count} bullets feature quantified results (%, $, or numbers)."
            ))
    else:
        metric_score = 5

    # 4. Formatting, Skills & ATS Best Practices (Max 25 pts)
    format_score = 0
    # Skills check
    total_skills = sum(len(cat.skills) for cat in resume.skills)
    if total_skills >= 8:
        format_score += 10
        recommendations.append(RecommendationItem(
            type="success", section="Skills",
            title="Comprehensive Skills Inventory",
            message=f"{total_skills} categorized skills found. Excellent for keyword matching."
        ))
    elif total_skills >= 4:
        format_score += 6
        recommendations.append(RecommendationItem(
            type="tip", section="Skills",
            title="Expand Skills Section",
            message="List 8-15 core technical and industry skills grouped by category."
        ))
    else:
        format_score += 2
        recommendations.append(RecommendationItem(
            type="error", section="Skills",
            title="Skills Section Sparse",
            message="ATS algorithms heavily index the Skills section to calculate match scores."
        ))

    # Bullet length check (avoid super long run-ons or 2-word fragments)
    bad_length_count = 0
    for company, role, idx, bullet in all_bullets:
        wc = len(bullet.split())
        if wc < 6 or wc > 55:
            bad_length_count += 1
    
    if bad_length_count == 0 and total_bullets > 0:
        format_score += 10
    elif bad_length_count <= 2:
        format_score += 7
    else:
        format_score += 4
        recommendations.append(RecommendationItem(
            type="tip", section="Formatting",
            title="Bullet Length Consistency",
            message=f"{bad_length_count} bullets are either too short (<6 words) or too long (>55 words). Optimal ATS bullet length is 15-40 words."
        ))

    # Single column layout compliance check
    format_score += 5  # Our templates strictly guarantee single column ATS friendliness!

    # Calculate overall ATS baseline score
    raw_ats_text = generate_ats_raw_text(resume)
    overall_score = comp_score + action_score + metric_score + format_score
    overall_score = max(10, min(100, overall_score))

    # 5. Job Description Match (if provided)
    matched_kws = []
    missing_kws = []
    jd_match_score = None

    if job_description.strip():
        jd_match_score, matched_kws, missing_kws = match_job_description(raw_ats_text, job_description)
        if jd_match_score >= 75:
            recommendations.append(RecommendationItem(
                type="success", section="Job Match",
                title=f"High Alignment with Job Description ({jd_match_score}%)",
                message=f"Resume matches {len(matched_kws)} essential keywords from the job description."
            ))
        elif jd_match_score >= 50:
            recommendations.append(RecommendationItem(
                type="warning", section="Job Match",
                title=f"Moderate Match ({jd_match_score}%)",
                message=f"Consider incorporating missing keywords such as: {', '.join(missing_kws[:6])}."
            ))
        else:
            recommendations.append(RecommendationItem(
                type="error", section="Job Match",
                title=f"Low Match ({jd_match_score}%)",
                message=f"Resume is missing several critical keywords: {', '.join(missing_kws[:8])}. Use 1-Click AI Tailor to adapt your resume."
            ))

    return {
        "overall_score": overall_score,
        "completeness_score": min(25, comp_score),
        "action_verb_score": min(25, action_score),
        "metrics_score": min(25, metric_score),
        "formatting_score": min(25, format_score),
        "jd_match_score": jd_match_score,
        "recommendations": recommendations,
        "matched_keywords": matched_kws,
        "missing_keywords": missing_kws,
        "raw_ats_text": raw_ats_text,
        "bullet_feedback": bullet_feedback
    }

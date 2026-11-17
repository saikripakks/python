import os
import re
import json
import logging
from typing import List, Dict, Any, Optional
from huggingface_hub import InferenceClient

from app.config import HF_TOKEN as DEFAULT_HF_TOKEN, DEFAULT_HF_MODEL
from app.models import (
    ResumeData, BulletVariation, PolishBulletResponse,
    GenerateSummaryResponse, ExtractSkillsResponse,
    SkillCategory, TailorResumeResponse, TailoredBulletSuggestion
)
from app.ats_scanner import (
    ALL_POWER_VERBS, WEAK_PHRASES, match_job_description,
    generate_ats_raw_text, scan_text_for_metrics
)

logger = logging.getLogger("ResumeForgeAI")

def get_inference_client(user_token: Optional[str] = None) -> Optional[InferenceClient]:
    """Get Hugging Face InferenceClient if a token is available."""
    token = user_token.strip() if user_token and user_token.strip() else DEFAULT_HF_TOKEN.strip()
    if not token:
        return None
    try:
        return InferenceClient(token=token, timeout=25.0)
    except Exception as e:
        logger.warning(f"Could not initialize HF InferenceClient: {e}")
        return None

# =====================================================================
# Intelligent Local GenAI Engine (Smart Offline / Fallback Generators)
# =====================================================================

LOCAL_ACTION_REPLACEMENTS = {
    "helped": "spearheaded",
    "worked on": "engineered",
    "responsible for": "orchestrated",
    "assisted with": "accelerated",
    "handled": "streamlined",
    "participated in": "championed",
    "managed": "scaled",
    "made": "architected",
    "did": "executed",
    "wrote": "developed",
    "fixed": "resolved",
    "tested": "automated testing for"
}

def _local_polish_bullet(bullet: str, target_role: str = "") -> List[BulletVariation]:
    """Algorithmic enhancement of a bullet into 3 Google XYZ variations."""
    cleaned = bullet.strip().lstrip("-•* \t")
    if not cleaned:
        return [
            BulletVariation(
                type="Metric-Driven",
                text="Engineered resilient workflow, driving 35% performance improvement across core processes.",
                explanation="Applied standard Google XYZ metric formula"
            )
        ]

    # Find first action verb or weak phrase to replace
    lower = cleaned.lower()
    strong_prefix = "Engineered"
    body = cleaned

    for weak, strong in LOCAL_ACTION_REPLACEMENTS.items():
        if lower.startswith(weak):
            strong_prefix = strong.capitalize()
            body = cleaned[len(weak):].strip().lstrip("to ").lstrip("with ").lstrip("for ")
            break
    else:
        words = cleaned.split()
        if words:
            first_w = words[0]
            if first_w.lower() in ALL_POWER_VERBS:
                strong_prefix = first_w.capitalize()
                body = " ".join(words[1:])
            else:
                strong_prefix = "Architected"

    # Clean body
    if body and not body[0].islower() and not body.startswith("a ") and not body.startswith("the "):
        body = body[0].lower() + body[1:]

    # Metric-Driven Variation
    var_metric = f"{strong_prefix} {body}, accelerating operational throughput by 42% and reducing processing latency by 3.5 hours weekly."
    
    # Leadership & Scope Variation
    var_leader = f"Spearheaded end-to-end initiative to {body}, collaborating cross-functionally across 4 engineering pods to deliver on-time production rollout."
    
    # Technical Depth Variation
    var_tech = f"Orchestrated scalable architecture to {body}, implementing automated CI/CD pipelines, comprehensive unit testing, and telemetry monitoring."

    return [
        BulletVariation(
            type="Metric-Driven",
            text=var_metric,
            explanation="Applies Google's XYZ formula with quantifiable efficiency gains and reduced processing times."
        ),
        BulletVariation(
            type="Leadership & Scope",
            text=var_leader,
            explanation="Highlights proactive leadership, cross-functional ownership, and production delivery."
        ),
        BulletVariation(
            type="Technical Depth",
            text=var_tech,
            explanation="Emphasizes system scalability, modern automation, and testing rigor."
        )
    ]

def _local_generate_summary(target_role: str, years_exp: str, skills: List[str], current: str = "") -> str:
    """Generate professional summary using ATS-optimized heuristic templates."""
    role = target_role.strip() if target_role.strip() else "Software & Technology Professional"
    exp = years_exp.strip() if years_exp.strip() else "4+"
    top_skills = ", ".join(skills[:5]) if skills else "cloud architecture, distributed systems, and agile delivery"

    return (
        f"Results-oriented {role} with {exp} years of proven expertise in architecting high-availability solutions, "
        f"optimizing enterprise software workflows, and leveraging {top_skills}. "
        f"Demonstrated track record of delivering scalable products that elevate system performance by 30%+ "
        f"while spearheading cross-functional engineering excellence."
    )

def _local_extract_skills(text: str) -> List[SkillCategory]:
    """Extract and intelligently group skills from free text."""
    lowered = text.lower()
    
    categories_def = {
        "Languages & Frameworks": [
            "python", "javascript", "typescript", "java", "c++", "c#", "golang", "go", "rust",
            "ruby", "php", "swift", "kotlin", "react", "vue", "angular", "next.js", "node.js",
            "express", "django", "fastapi", "flask", "spring boot"
        ],
        "Cloud & Infrastructure": [
            "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
            "ci/cd", "jenkins", "github actions", "gitlab", "linux", "nginx"
        ],
        "Databases & Storage": [
            "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "cassandra",
            "dynamodb", "snowflake", "bigquery", "sql"
        ],
        "Architecture & Methodologies": [
            "microservices", "rest api", "graphql", "grpc", "event-driven", "kafka",
            "system design", "agile", "scrum", "tdd", "unit testing"
        ],
        "AI & Data Science": [
            "machine learning", "deep learning", "nlp", "llm", "genai", "pytorch",
            "tensorflow", "hugging face", "scikit-learn", "data engineering", "pandas"
        ]
    }

    result = []
    for cat_name, skill_list in categories_def.items():
        matched = []
        for s in skill_list:
            if re.search(r'\b' + re.escape(s) + r'\b', lowered):
                matched.append(s.title() if len(s) > 3 and not s.isupper() else s.upper() if len(s) <= 3 else s.title())
        if matched:
            result.append(SkillCategory(category=cat_name, skills=matched))

    if not result:
        result.append(SkillCategory(category="Technical Skills", skills=["Python", "FastAPI", "Docker", "Git", "REST APIs", "SQL"]))

    return result

# =====================================================================
# Hugging Face GenAI API Callers
# =====================================================================

def call_hf_chat(
    client: InferenceClient,
    model: str,
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 512,
    temperature: float = 0.3
) -> str:
    """Execute a chat completion on Hugging Face Inference API."""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"Chat completion failed on {model}, attempting text_generation: {e}")
        # Fallback to direct prompt generation
        full_prompt = f"<s>[INST] <<SYS>>\n{system_prompt}\n<</SYS>>\n\n{user_prompt} [/INST]"
        out = client.text_generation(
            prompt=full_prompt,
            model=model,
            max_new_tokens=max_tokens,
            temperature=temperature
        )
        return out.strip()


# =====================================================================
# Service Functions
# =====================================================================

def polish_bullet_point(
    bullet: str,
    target_role: Optional[str] = "",
    hf_token: Optional[str] = None,
    model: Optional[str] = None
) -> PolishBulletResponse:
    """Enhance a bullet point using GenAI (HF or smart fallback)."""
    selected_model = model or DEFAULT_HF_MODEL
    client = get_inference_client(hf_token)

    if not client:
        variations = _local_polish_bullet(bullet, target_role or "")
        return PolishBulletResponse(
            original=bullet,
            variations=variations,
            model_used="ResumeForge Smart Engine (Offline/Local)"
        )

    system_prompt = (
        "You are an executive ATS resume coach and recruiter at a top technology firm. "
        "Your mission is to transform raw resume bullet points into high-impact Google XYZ statements: "
        "'Accomplished [X] as measured by [Y], by doing [Z]'. "
        "Always use past-tense power action verbs (e.g., Spearheaded, Engineered, Orchestrated, Optimized). "
        "Include realistic quantifiable metrics (percentages, latency, throughput, dollars, or headcount). "
        "Return ONLY a valid JSON array of 3 objects with keys: 'type' ('Metric-Driven', 'Leadership & Scope', 'Technical Depth'), "
        "'text' (the polished bullet), and 'explanation' (1 short sentence explaining why it is ATS-effective). Do not include markdown codeblocks."
    )

    user_prompt = f"Role: {target_role or 'Professional'}\nBullet to polish: \"{bullet}\""

    try:
        raw_res = call_hf_chat(client, selected_model, system_prompt, user_prompt, max_tokens=600)
        # Parse JSON
        cleaned_res = re.sub(r'```json\s*', '', raw_res)
        cleaned_res = re.sub(r'```\s*', '', cleaned_res).strip()
        data = json.loads(cleaned_res)
        variations = [
            BulletVariation(
                type=item.get("type", "Enhanced"),
                text=item.get("text", bullet),
                explanation=item.get("explanation", "ATS optimized")
            )
            for item in data
        ]
        return PolishBulletResponse(
            original=bullet,
            variations=variations,
            model_used=f"Hugging Face: {selected_model}"
        )
    except Exception as e:
        logger.warning(f"HF Generation failed, falling back to local engine: {e}")
        variations = _local_polish_bullet(bullet, target_role or "")
        return PolishBulletResponse(
            original=bullet,
            variations=variations,
            model_used=f"ResumeForge Smart Engine (Fallback: {str(e)[:40]}...)"
        )


def generate_professional_summary(
    target_role: str,
    years_exp: str,
    skills: List[str],
    current_summary: Optional[str] = "",
    hf_token: Optional[str] = None,
    model: Optional[str] = None
) -> GenerateSummaryResponse:
    """Generate an ATS-friendly professional summary."""
    selected_model = model or DEFAULT_HF_MODEL
    client = get_inference_client(hf_token)

    if not client:
        summary = _local_generate_summary(target_role, years_exp, skills, current_summary or "")
        return GenerateSummaryResponse(
            summary=summary,
            model_used="ResumeForge Smart Engine (Offline/Local)"
        )

    system_prompt = (
        "You are an ATS resume optimization specialist. Write a concise, powerful 3-sentence professional summary "
        "tailored for Applicant Tracking Systems. Highlight years of experience, target title, core technical stack, "
        "and quantified business impact. Avoid generic clichés. Return ONLY the text of the summary."
    )

    user_prompt = (
        f"Target Role: {target_role}\n"
        f"Years Experience: {years_exp}\n"
        f"Key Skills: {', '.join(skills)}\n"
        f"Current Summary Draft (if any): {current_summary or 'None'}"
    )

    try:
        summary = call_hf_chat(client, selected_model, system_prompt, user_prompt, max_tokens=250)
        summary = summary.strip().strip('"')
        return GenerateSummaryResponse(
            summary=summary,
            model_used=f"Hugging Face: {selected_model}"
        )
    except Exception as e:
        logger.warning(f"HF Summary generation failed, using local fallback: {e}")
        summary = _local_generate_summary(target_role, years_exp, skills, current_summary or "")
        return GenerateSummaryResponse(
            summary=summary,
            model_used=f"ResumeForge Smart Engine (Fallback: {str(e)[:40]}...)"
        )


def extract_skills_from_text(
    text: str,
    hf_token: Optional[str] = None,
    model: Optional[str] = None
) -> ExtractSkillsResponse:
    """Extract and categorize skills using GenAI."""
    selected_model = model or DEFAULT_HF_MODEL
    client = get_inference_client(hf_token)

    if not client:
        cats = _local_extract_skills(text)
        return ExtractSkillsResponse(
            categories=cats,
            model_used="ResumeForge Smart Engine (Offline/Local)"
        )

    system_prompt = (
        "Extract all technical, domain, and soft skills from the provided text. "
        "Group them into clean categories (e.g. 'Languages & Frameworks', 'Cloud & DevOps', 'Databases', 'Tools', 'Soft Skills'). "
        "Return ONLY a JSON array of objects with keys 'category' (string) and 'skills' (array of strings). Do not include markdown ticks."
    )

    try:
        raw_res = call_hf_chat(client, selected_model, system_prompt, text, max_tokens=500)
        cleaned_res = re.sub(r'```json\s*', '', raw_res)
        cleaned_res = re.sub(r'```\s*', '', cleaned_res).strip()
        data = json.loads(cleaned_res)
        categories = [
            SkillCategory(
                category=item.get("category", "General"),
                skills=item.get("skills", [])
            )
            for item in data
        ]
        return ExtractSkillsResponse(
            categories=categories,
            model_used=f"Hugging Face: {selected_model}"
        )
    except Exception as e:
        logger.warning(f"HF Skill extraction failed, using local fallback: {e}")
        cats = _local_extract_skills(text)
        return ExtractSkillsResponse(
            categories=cats,
            model_used=f"ResumeForge Smart Engine (Fallback: {str(e)[:40]}...)"
        )


def tailor_resume_to_jd(
    resume: ResumeData,
    job_description: str,
    hf_token: Optional[str] = None,
    model: Optional[str] = None
) -> TailorResumeResponse:
    """
    AI-powered resume tailoring:
    Analyzes JD keyword gap, rewrites summary, enhances bullets, and suggests additions.
    """
    selected_model = model or DEFAULT_HF_MODEL
    raw_text = generate_ats_raw_text(resume)
    match_score, matched_kws, missing_kws = match_job_description(raw_text, job_description)

    top_missing = missing_kws[:8]
    client = get_inference_client(hf_token)

    # 1. Tailored Summary
    target_role = resume.personal_info.target_role or "Software Professional"
    all_skills = []
    for sc in resume.skills:
        all_skills.extend(sc.skills)

    if client:
        system_prompt = (
            "You are a master ATS optimization recruiter. Given a candidate's current resume summary and a target job description, "
            "rewrite the summary so that it organically integrates critical missing keywords from the JD without keyword stuffing. "
            "Keep it under 80 words. Return ONLY the rewritten summary text."
        )
        user_prompt = (
            f"Target Role: {target_role}\n"
            f"Missing JD Keywords to incorporate naturally: {', '.join(top_missing)}\n"
            f"Current Summary: {resume.summary or 'Experienced professional.'}\n"
            f"Job Description excerpt: {job_description[:800]}"
        )
        try:
            tailored_summary = call_hf_chat(client, selected_model, system_prompt, user_prompt, max_tokens=250)
            tailored_summary = tailored_summary.strip().strip('"')
            model_label = f"Hugging Face: {selected_model}"
        except Exception as e:
            logger.warning(f"HF Tailor summary failed, using smart local engine: {e}")
            tailored_summary = _local_generate_summary(target_role, "4+", all_skills + top_missing[:3])
            model_label = "ResumeForge Smart Engine (Local)"
    else:
        tailored_summary = _local_generate_summary(target_role, "4+", all_skills + top_missing[:3])
        model_label = "ResumeForge Smart Engine (Offline/Local)"

    # 2. Suggested Bullet Enhancements
    suggested_bullets: List[TailoredBulletSuggestion] = []
    if resume.work_experience:
        first_exp = resume.work_experience[0]
        if first_exp.bullets and top_missing:
            kw_to_add = top_missing[0]
            orig_b = first_exp.bullets[0]
            suggested_b = f"{orig_b.rstrip('.')} utilizing {kw_to_add.title()} to optimize system throughput by 30%."
            suggested_bullets.append(
                TailoredBulletSuggestion(
                    experience_id=first_exp.id,
                    bullet_index=0,
                    original=orig_b,
                    suggested=suggested_b,
                    reason=f"Integrates missing target skill '{kw_to_add.title()}' with quantifiable metric."
                )
            )

    return TailorResumeResponse(
        tailored_summary=tailored_summary,
        suggested_bullets=suggested_bullets,
        recommended_keywords_to_add=top_missing,
        match_score=match_score,
        model_used=model_label
    )

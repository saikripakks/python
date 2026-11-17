from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PersonalInfo(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: Optional[str] = ""
    github: Optional[str] = ""
    portfolio: Optional[str] = ""
    target_role: Optional[str] = ""

class WorkExperience(BaseModel):
    id: str = ""
    company: str = ""
    role: str = ""
    location: Optional[str] = ""
    start_date: str = ""
    end_date: str = ""
    current: bool = False
    bullets: List[str] = Field(default_factory=list)

class Education(BaseModel):
    id: str = ""
    institution: str = ""
    degree: str = ""
    field_of_study: str = ""
    location: Optional[str] = ""
    graduation_date: str = ""
    gpa: Optional[str] = ""
    honors: Optional[str] = ""

class Project(BaseModel):
    id: str = ""
    title: str = ""
    role: Optional[str] = ""
    tech_stack: List[str] = Field(default_factory=list)
    link: Optional[str] = ""
    bullets: List[str] = Field(default_factory=list)

class SkillCategory(BaseModel):
    category: str = "Technical Skills"
    skills: List[str] = Field(default_factory=list)

class Certification(BaseModel):
    id: str = ""
    name: str = ""
    issuer: str = ""
    date: str = ""
    credential_id: Optional[str] = ""
    url: Optional[str] = ""

class ResumeData(BaseModel):
    personal_info: PersonalInfo = Field(default_factory=PersonalInfo)
    summary: str = ""
    work_experience: List[WorkExperience] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)
    skills: List[SkillCategory] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    certifications: List[Certification] = Field(default_factory=list)

# AI Request & Response Models
class PolishBulletRequest(BaseModel):
    bullet: str
    target_role: Optional[str] = ""
    hf_token: Optional[str] = None
    model: Optional[str] = None

class BulletVariation(BaseModel):
    type: str
    text: str
    explanation: str

class PolishBulletResponse(BaseModel):
    original: str
    variations: List[BulletVariation]
    model_used: str

class GenerateSummaryRequest(BaseModel):
    target_role: str
    years_exp: str = "3+"
    skills: List[str] = Field(default_factory=list)
    current_summary: Optional[str] = ""
    hf_token: Optional[str] = None
    model: Optional[str] = None

class GenerateSummaryResponse(BaseModel):
    summary: str
    model_used: str

class ExtractSkillsRequest(BaseModel):
    text: str
    hf_token: Optional[str] = None
    model: Optional[str] = None

class ExtractSkillsResponse(BaseModel):
    categories: List[SkillCategory]
    model_used: str

class TailorResumeRequest(BaseModel):
    resume: ResumeData
    job_description: str
    hf_token: Optional[str] = None
    model: Optional[str] = None

class TailoredBulletSuggestion(BaseModel):
    experience_id: str
    bullet_index: int
    original: str
    suggested: str
    reason: str

class TailorResumeResponse(BaseModel):
    tailored_summary: str
    suggested_bullets: List[TailoredBulletSuggestion]
    recommended_keywords_to_add: List[str]
    match_score: int
    model_used: str

class ScoreResumeRequest(BaseModel):
    resume: ResumeData
    job_description: Optional[str] = ""

class RecommendationItem(BaseModel):
    type: str  # "error", "warning", "success", "tip"
    section: str
    title: str
    message: str

class ScoreResumeResponse(BaseModel):
    overall_score: int
    completeness_score: int
    action_verb_score: int
    metrics_score: int
    formatting_score: int
    jd_match_score: Optional[int] = None
    recommendations: List[RecommendationItem]
    matched_keywords: List[str] = Field(default_factory=list)
    missing_keywords: List[str] = Field(default_factory=list)
    raw_ats_text: str
    bullet_feedback: List[Dict[str, Any]] = Field(default_factory=list)

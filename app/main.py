import os
from pathlib import Path
from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse, Response, PlainTextResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates

from app.config import HF_TOKEN, DEFAULT_HF_MODEL, SUPPORTED_MODELS
from app.models import (
    ResumeData, PolishBulletRequest, PolishBulletResponse,
    GenerateSummaryRequest, GenerateSummaryResponse,
    ExtractSkillsRequest, ExtractSkillsResponse,
    TailorResumeRequest, TailorResumeResponse,
    ScoreResumeRequest, ScoreResumeResponse
)
from app.ats_scanner import evaluate_resume_ats, generate_ats_raw_text, match_job_description
from app.ai_service import (
    polish_bullet_point, generate_professional_summary,
    extract_skills_from_text, tailor_resume_to_jd
)
from app.exporters.pdf_exporter import generate_ats_pdf
from app.exporters.docx_exporter import generate_ats_docx
from app.pdf_parser import parse_uploaded_pdf
from samples.sample_resumes import SAMPLE_RESUMES

BASE_DIR = Path(__file__).resolve().parent
REACT_DIST_DIR = BASE_DIR / "static" / "dist"

app = FastAPI(
    title="ResumeForge AI - ATS Resume Builder",
    description="Next-generation ATS-friendly resume creator powered by Hugging Face GenAI and FastAPI",
    version="1.0.0"
)

# Enable CORS for Vite dev server (port 3000) or external clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount React static assets if built
if (REACT_DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(REACT_DIST_DIR / "assets")), name="react-assets")

# Mount general static files
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    # Serve React SPA if built
    react_index = REACT_DIST_DIR / "index.html"
    if react_index.exists():
        return FileResponse(str(react_index))
    
    # Fallback to Jinja2 template
    has_env_token = bool(HF_TOKEN and HF_TOKEN.strip())
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "has_env_token": has_env_token,
            "default_model": DEFAULT_HF_MODEL,
            "supported_models": SUPPORTED_MODELS
        }
    )

@app.get("/api/status")
async def get_system_status():
    return {
        "status": "online",
        "has_env_token": bool(HF_TOKEN and HF_TOKEN.strip()),
        "default_model": DEFAULT_HF_MODEL,
        "supported_models": SUPPORTED_MODELS
    }

@app.get("/api/samples/{role_key}")
async def get_sample_resume(role_key: str):
    if role_key not in SAMPLE_RESUMES:
        raise HTTPException(status_code=404, detail="Sample resume not found")
    return SAMPLE_RESUMES[role_key]

@app.post("/api/ats/score", response_model=ScoreResumeResponse)
async def score_resume(data: ScoreResumeRequest):
    result = evaluate_resume_ats(data.resume, data.job_description or "")
    return ScoreResumeResponse(**result)

@app.post("/api/ats/match-jd")
async def match_jd(data: ScoreResumeRequest):
    raw_text = generate_ats_raw_text(data.resume)
    score, matched, missing = match_job_description(raw_text, data.job_description or "")
    return {
        "match_score": score,
        "matched_keywords": matched,
        "missing_keywords": missing,
        "total_keywords": len(matched) + len(missing)
    }

@app.post("/api/ai/polish-bullet", response_model=PolishBulletResponse)
async def polish_bullet(data: PolishBulletRequest):
    return polish_bullet_point(
        bullet=data.bullet,
        target_role=data.target_role,
        hf_token=data.hf_token,
        model=data.model
    )

@app.post("/api/ai/generate-summary", response_model=GenerateSummaryResponse)
async def generate_summary(data: GenerateSummaryRequest):
    return generate_professional_summary(
        target_role=data.target_role,
        years_exp=data.years_exp,
        skills=data.skills,
        current_summary=data.current_summary,
        hf_token=data.hf_token,
        model=data.model
    )

@app.post("/api/ai/extract-skills", response_model=ExtractSkillsResponse)
async def extract_skills(data: ExtractSkillsRequest):
    return extract_skills_from_text(
        text=data.text,
        hf_token=data.hf_token,
        model=data.model
    )

@app.post("/api/ai/tailor-resume", response_model=TailorResumeResponse)
async def tailor_resume(data: TailorResumeRequest):
    return tailor_resume_to_jd(
        resume=data.resume,
        job_description=data.job_description,
        hf_token=data.hf_token,
        model=data.model
    )

@app.post("/api/export/pdf")
async def export_pdf(resume: ResumeData):
    pdf_bytes = generate_ats_pdf(resume)
    filename = f"{(resume.personal_info.full_name or 'Resume').replace(' ', '_')}_ATS.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.post("/api/export/docx")
async def export_docx(resume: ResumeData):
    docx_bytes = generate_ats_docx(resume)
    filename = f"{(resume.personal_info.full_name or 'Resume').replace(' ', '_')}_ATS.docx"
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.post("/api/export/txt")
async def export_txt(resume: ResumeData):
    txt_content = generate_ats_raw_text(resume)
    filename = f"{(resume.personal_info.full_name or 'Resume').replace(' ', '_')}_ATS.txt"
    return PlainTextResponse(
        content=txt_content,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.post("/api/resume/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported for import")
    content = await file.read()
    parsed_data = parse_uploaded_pdf(content)
    return parsed_data

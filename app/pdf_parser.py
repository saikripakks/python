import io
import re
from typing import Dict, Any, List
from pypdf import PdfReader
from app.models import ResumeData, PersonalInfo, WorkExperience, Education, SkillCategory

def parse_uploaded_pdf(file_bytes: bytes) -> Dict[str, Any]:
    """
    Extract text and key entities from an uploaded resume PDF.
    """
    reader = PdfReader(io.BytesIO(file_bytes))
    full_text = ""
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            full_text += txt + "\n"

    lines = [l.strip() for l in full_text.splitlines() if l.strip()]

    # Extract Contact Information
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', full_text)
    email = email_match.group(0) if email_match else ""

    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}', full_text)
    phone = phone_match.group(0) if phone_match else ""

    linkedin_match = re.search(r'(https?://)?(www\.)?linkedin\.com/in/[\w\-]+', full_text, re.IGNORECASE)
    linkedin = linkedin_match.group(0) if linkedin_match else ""

    github_match = re.search(r'(https?://)?(www\.)?github\.com/[\w\-]+', full_text, re.IGNORECASE)
    github = github_match.group(0) if github_match else ""

    # Name heuristic: Usually the first non-empty line with 2-4 words, no numbers or special symbols
    name = ""
    for line in lines[:5]:
        if not re.search(r'[@\d\(\)\+\/\|]', line) and len(line.split()) in [2, 3, 4] and len(line) < 40:
            name = line
            break
    if not name and lines:
        name = lines[0]

    # Simple section segmentation
    sections: Dict[str, List[str]] = {
        "summary": [],
        "experience": [],
        "education": [],
        "skills": []
    }

    current_sec = "summary"
    for line in lines:
        lower_line = line.lower()
        if any(h in lower_line for h in ["experience", "employment", "work history"]):
            current_sec = "experience"
            continue
        elif any(h in lower_line for h in ["education", "academic", "university", "college"]):
            current_sec = "education"
            continue
        elif any(h in lower_line for h in ["skills", "technologies", "competencies"]):
            current_sec = "skills"
            continue
        elif any(h in lower_line for h in ["summary", "profile", "objective", "about me"]):
            current_sec = "summary"
            continue
        
        sections[current_sec].append(line)

    summary_text = " ".join(sections["summary"][:6]) if sections["summary"] else ""

    # Extract sample experience bullets
    exp_bullets = []
    for line in sections["experience"]:
        if line.startswith(("-", "•", "*")) or len(line.split()) > 6:
            cleaned = line.lstrip("-•* \t")
            if len(cleaned.split()) >= 4:
                exp_bullets.append(cleaned)

    # Initial parsed structure
    return {
        "raw_text": full_text,
        "personal_info": {
            "full_name": name,
            "email": email,
            "phone": phone,
            "location": "",
            "linkedin": linkedin,
            "github": github,
            "portfolio": "",
            "target_role": ""
        },
        "summary": summary_text[:400],
        "work_experience": [
            {
                "id": "parsed-exp-1",
                "company": "Company Name",
                "role": "Role / Position",
                "location": "",
                "start_date": "2021",
                "end_date": "Present",
                "current": True,
                "bullets": exp_bullets[:5] if exp_bullets else ["Spearheaded critical engineering deliverables..."]
            }
        ] if exp_bullets else [],
        "education": [],
        "skills": [
            {
                "category": "Extracted Skills",
                "skills": [w.strip() for w in re.split(r'[,\|•]', " ".join(sections["skills"][:4])) if len(w.strip()) > 2][:12]
            }
        ] if sections["skills"] else []
    }

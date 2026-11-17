import io
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from app.models import ResumeData

def generate_ats_docx(resume: ResumeData) -> bytes:
    """
    Generate an ATS-compliant Word Document (.docx).
    Uses standard typography, explicit paragraph styles, and parseable flow.
    """
    doc = Document()

    # Set 0.65-inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.65)
        section.bottom_margin = Inches(0.65)
        section.left_margin = Inches(0.65)
        section.right_margin = Inches(0.65)

    p = resume.personal_info

    # 1. Name
    if p.full_name:
        name_p = doc.add_paragraph()
        name_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = name_p.add_run(p.full_name.upper())
        run.bold = True
        run.font.size = Pt(18)
        run.font.name = 'Arial'
        run.font.color.rgb = RGBColor(17, 24, 39)
        name_p.paragraph_format.space_after = Pt(2)

    # Target Role
    if p.target_role:
        role_p = doc.add_paragraph()
        role_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = role_p.add_run(p.target_role)
        run.font.size = Pt(11)
        run.font.name = 'Arial'
        run.font.color.rgb = RGBColor(75, 85, 99)
        role_p.paragraph_format.space_after = Pt(2)

    # Contact line
    contact_parts = []
    if p.email: contact_parts.append(p.email)
    if p.phone: contact_parts.append(p.phone)
    if p.location: contact_parts.append(p.location)
    if p.linkedin: contact_parts.append(p.linkedin)
    if p.github: contact_parts.append(p.github)
    if p.portfolio: contact_parts.append(p.portfolio)

    if contact_parts:
        c_p = doc.add_paragraph()
        c_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = c_p.add_run("  |  ".join(contact_parts))
        run.font.size = Pt(9.5)
        run.font.name = 'Arial'
        run.font.color.rgb = RGBColor(55, 65, 81)
        c_p.paragraph_format.space_after = Pt(10)

    def add_section_header(title: str):
        sec_p = doc.add_paragraph()
        sec_p.paragraph_format.space_before = Pt(8)
        sec_p.paragraph_format.space_after = Pt(3)
        sec_p.paragraph_format.keep_with_next = True
        run = sec_p.add_run(title.upper())
        run.bold = True
        run.font.size = Pt(11)
        run.font.name = 'Arial'
        run.font.color.rgb = RGBColor(30, 58, 138)  # Deep Slate Navy

    # 2. Professional Summary
    if resume.summary and resume.summary.strip():
        add_section_header("Professional Summary")
        sum_p = doc.add_paragraph()
        run = sum_p.add_run(resume.summary.strip())
        run.font.size = Pt(10)
        run.font.name = 'Arial'
        sum_p.paragraph_format.space_after = Pt(6)

    # 3. Work Experience
    if resume.work_experience:
        add_section_header("Work Experience")
        for exp in resume.work_experience:
            dates = f"{exp.start_date} – {'Present' if exp.current else exp.end_date}".strip()
            loc_str = f" | {exp.location}" if exp.location else ""
            
            job_p = doc.add_paragraph()
            job_p.paragraph_format.space_before = Pt(4)
            job_p.paragraph_format.space_after = Pt(2)
            job_p.paragraph_format.keep_with_next = True

            role_run = job_p.add_run(f"{exp.role}")
            role_run.bold = True
            role_run.font.size = Pt(10.5)
            role_run.font.name = 'Arial'

            comp_run = job_p.add_run(f" | {exp.company}{loc_str}")
            comp_run.font.size = Pt(10)
            comp_run.font.name = 'Arial'

            date_run = job_p.add_run(f"   [{dates}]")
            date_run.italic = True
            date_run.font.size = Pt(9.5)
            date_run.font.name = 'Arial'
            date_run.font.color.rgb = RGBColor(107, 114, 128)

            for b in exp.bullets:
                if b.strip():
                    bp = doc.add_paragraph(style='List Bullet')
                    bp.paragraph_format.space_after = Pt(2)
                    brun = bp.add_run(b.strip())
                    brun.font.size = Pt(9.5)
                    brun.font.name = 'Arial'

    # 4. Education
    if resume.education:
        add_section_header("Education")
        for edu in resume.education:
            edu_p = doc.add_paragraph()
            edu_p.paragraph_format.space_before = Pt(4)
            edu_p.paragraph_format.space_after = Pt(2)

            deg_run = edu_p.add_run(f"{edu.degree} in {edu.field_of_study}")
            deg_run.bold = True
            deg_run.font.size = Pt(10.5)
            deg_run.font.name = 'Arial'

            loc_str = f" | {edu.location}" if edu.location else ""
            inst_run = edu_p.add_run(f" – {edu.institution}{loc_str}")
            inst_run.font.size = Pt(10)
            inst_run.font.name = 'Arial'

            date_run = edu_p.add_run(f"   [{edu.graduation_date}]")
            date_run.italic = True
            date_run.font.size = Pt(9.5)
            date_run.font.name = 'Arial'

            extras = []
            if edu.gpa: extras.append(f"GPA: {edu.gpa}")
            if edu.honors: extras.append(edu.honors)
            if extras:
                sub_p = doc.add_paragraph()
                sub_run = sub_p.add_run(" • ".join(extras))
                sub_run.font.size = Pt(9)
                sub_run.font.name = 'Arial'
                sub_run.font.color.rgb = RGBColor(107, 114, 128)

    # 5. Skills
    if resume.skills:
        add_section_header("Technical Skills")
        for sc in resume.skills:
            if sc.skills:
                sp = doc.add_paragraph()
                sp.paragraph_format.space_after = Pt(3)

                c_run = sp.add_run(f"{sc.category}: ")
                c_run.bold = True
                c_run.font.size = Pt(10)
                c_run.font.name = 'Arial'

                s_run = sp.add_run(", ".join(sc.skills))
                s_run.font.size = Pt(10)
                s_run.font.name = 'Arial'

    # 6. Projects
    if resume.projects:
        add_section_header("Projects")
        for proj in resume.projects:
            pp = doc.add_paragraph()
            pp.paragraph_format.space_before = Pt(4)
            pp.paragraph_format.space_after = Pt(2)

            t_run = pp.add_run(proj.title)
            t_run.bold = True
            t_run.font.size = Pt(10.5)
            t_run.font.name = 'Arial'

            if proj.tech_stack:
                tech_run = pp.add_run(f" ({', '.join(proj.tech_stack)})")
                tech_run.italic = True
                tech_run.font.size = Pt(9.5)
                tech_run.font.name = 'Arial'

            if proj.link:
                link_run = pp.add_run(f" | Link: {proj.link}")
                link_run.font.size = Pt(9.5)
                link_run.font.name = 'Arial'

            for b in proj.bullets:
                if b.strip():
                    bp = doc.add_paragraph(style='List Bullet')
                    bp.paragraph_format.space_after = Pt(2)
                    brun = bp.add_run(b.strip())
                    brun.font.size = Pt(9.5)
                    brun.font.name = 'Arial'

    # 7. Certifications
    if resume.certifications:
        add_section_header("Certifications")
        for cert in resume.certifications:
            cp = doc.add_paragraph(style='List Bullet')
            cp.paragraph_format.space_after = Pt(2)
            c_text = f"{cert.name} – {cert.issuer} ({cert.date})"
            if cert.credential_id:
                c_text += f" [ID: {cert.credential_id}]"
            c_run = cp.add_run(c_text)
            c_run.font.size = Pt(9.5)
            c_run.font.name = 'Arial'

    buffer = io.BytesIO()
    doc.save(buffer)
    docx_bytes = buffer.getvalue()
    buffer.close()
    return docx_bytes

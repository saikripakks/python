import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from app.models import ResumeData

def generate_ats_pdf(resume: ResumeData) -> bytes:
    """
    Generate a 100% ATS-compliant single-column PDF resume.
    Uses standard Helvetica fonts, consistent margins, and parseable text flow.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.55 * inch,
        leftMargin=0.55 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
        title=f"{resume.personal_info.full_name or 'Resume'} - ATS Resume",
        author=resume.personal_info.full_name or "ResumeForge"
    )

    styles = getSampleStyleSheet()

    # Custom Clean ATS Typography
    name_style = ParagraphStyle(
        'ATSName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        alignment=1,  # Centered
        textColor=colors.HexColor('#111827'),
        spaceAfter=4
    )

    target_role_style = ParagraphStyle(
        'ATSTargetRole',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        alignment=1,
        textColor=colors.HexColor('#4B5563'),
        spaceAfter=4
    )

    contact_style = ParagraphStyle(
        'ATSContact',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        alignment=1,
        textColor=colors.HexColor('#374151'),
        spaceAfter=8
    )

    section_heading_style = ParagraphStyle(
        'ATSSectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#1E3A8A'),  # Classic Navy / Slate Blue
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    item_title_style = ParagraphStyle(
        'ATSItemTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#1F2937')
    )

    item_subtitle_style = ParagraphStyle(
        'ATSItemSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=12.5,
        textColor=colors.HexColor('#4B5563')
    )

    body_style = ParagraphStyle(
        'ATSBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'ATSBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor('#1F2937'),
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=2
    )

    story = []
    p = resume.personal_info

    # 1. Header (Name & Contact)
    if p.full_name:
        story.append(Paragraph(p.full_name.upper(), name_style))
    if p.target_role:
        story.append(Paragraph(p.target_role, target_role_style))

    contact_bits = []
    if p.email: contact_bits.append(p.email)
    if p.phone: contact_bits.append(p.phone)
    if p.location: contact_bits.append(p.location)
    if p.linkedin: contact_bits.append(p.linkedin)
    if p.github: contact_bits.append(p.github)
    if p.portfolio: contact_bits.append(p.portfolio)

    if contact_bits:
        story.append(Paragraph(" • ".join(contact_bits), contact_style))

    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=8))

    # Helper function for Section Headers
    def add_section_header(title: str):
        story.append(Paragraph(title.upper(), section_heading_style))
        story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor('#E2E8F0'), spaceAfter=6))

    # 2. Professional Summary
    if resume.summary and resume.summary.strip():
        add_section_header("Professional Summary")
        story.append(Paragraph(resume.summary.strip(), body_style))
        story.append(Spacer(1, 4))

    # 3. Work Experience
    if resume.work_experience:
        add_section_header("Work Experience")
        for exp in resume.work_experience:
            dates = f"{exp.start_date} – {'Present' if exp.current else exp.end_date}".strip()
            loc_str = f" | {exp.location}" if exp.location else ""

            # Use a clean 2-column table for Role / Company on Left, Date / Location on Right
            # Notice: simple flat 1-row table is universally supported and keeps text on the same line
            header_table_data = [
                [
                    Paragraph(f"<b>{exp.role}</b>, {exp.company}{loc_str}", item_title_style),
                    Paragraph(f"<b>{dates}</b>", ParagraphStyle('RightAlignedDate', parent=item_subtitle_style, alignment=2))
                ]
            ]
            t = Table(header_table_data, colWidths=[5.0 * inch, 2.0 * inch])
            t.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ]))
            story.append(t)

            # Bullets
            for bullet in exp.bullets:
                if bullet.strip():
                    story.append(Paragraph(f"&bull;&nbsp;&nbsp;{bullet.strip()}", bullet_style))
            story.append(Spacer(1, 4))

    # 4. Education
    if resume.education:
        add_section_header("Education")
        for edu in resume.education:
            degree_text = f"<b>{edu.degree}</b> in {edu.field_of_study}" if edu.field_of_study else f"<b>{edu.degree}</b>"
            loc_str = f" | {edu.location}" if edu.location else ""
            
            header_table_data = [
                [
                    Paragraph(f"{degree_text} – {edu.institution}{loc_str}", item_title_style),
                    Paragraph(f"<b>{edu.graduation_date}</b>", ParagraphStyle('RightDate', parent=item_subtitle_style, alignment=2))
                ]
            ]
            t = Table(header_table_data, colWidths=[5.2 * inch, 1.8 * inch])
            t.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
            ]))
            story.append(t)

            extras = []
            if edu.gpa: extras.append(f"GPA: {edu.gpa}")
            if edu.honors: extras.append(edu.honors)
            if extras:
                story.append(Paragraph(" • ".join(extras), item_subtitle_style))
            story.append(Spacer(1, 4))

    # 5. Skills
    if resume.skills:
        add_section_header("Technical & Professional Skills")
        for sc in resume.skills:
            if sc.skills:
                skills_str = ", ".join(sc.skills)
                p_text = f"<b>{sc.category}:</b> {skills_str}"
                story.append(Paragraph(p_text, body_style))
        story.append(Spacer(1, 4))

    # 6. Projects
    if resume.projects:
        add_section_header("Projects")
        for proj in resume.projects:
            tech_str = f" (<i>{', '.join(proj.tech_stack)}</i>)" if proj.tech_stack else ""
            link_str = f" [Link: {proj.link}]" if proj.link else ""
            story.append(Paragraph(f"<b>{proj.title}</b>{tech_str}{link_str}", item_title_style))
            for b in proj.bullets:
                if b.strip():
                    story.append(Paragraph(f"&bull;&nbsp;&nbsp;{b.strip()}", bullet_style))
            story.append(Spacer(1, 4))

    # 7. Certifications
    if resume.certifications:
        add_section_header("Certifications & Licenses")
        for cert in resume.certifications:
            c_text = f"<b>{cert.name}</b> – {cert.issuer} ({cert.date})"
            if cert.credential_id:
                c_text += f" [ID: {cert.credential_id}]"
            story.append(Paragraph(f"&bull;&nbsp;&nbsp;{c_text}", bullet_style))

    # Build the PDF
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

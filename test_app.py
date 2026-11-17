import sys
from fastapi.testclient import TestClient
from app.main import app
from samples.sample_resumes import SAMPLE_RESUMES

client = TestClient(app)

def run_tests():
    print("Testing ResumeForge AI API & React Integration...")

    # 1. Test Home / React SPA
    res = client.get("/")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert "root" in res.text, "Expected React root container in HTML"
    assert "/assets/index" in res.text, "Expected compiled React assets in HTML"
    print("✓ React SPA served successfully on GET /")

    # 2. Test Status
    res = client.get("/api/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    print("✓ System status endpoint functioning")

    # 3. Test Sample Resume
    res = client.get("/api/samples/software_engineer")
    assert res.status_code == 200
    sample_data = res.json()
    assert sample_data["personal_info"]["full_name"] == "Alexander Morgan"
    print("✓ Sample resume retrieved successfully")

    # 4. Test ATS Scoring
    score_payload = {
        "resume": sample_data,
        "job_description": "We are seeking a Senior Full-Stack Engineer experienced in Python, FastAPI, Docker, Kubernetes, and AWS."
    }
    res = client.post("/api/ats/score", json=score_payload)
    assert res.status_code == 200
    score_res = res.json()
    assert score_res["overall_score"] >= 80, f"Expected >=80, got {score_res['overall_score']}"
    assert "completeness_score" in score_res
    assert "action_verb_score" in score_res
    assert "metrics_score" in score_res
    print(f"✓ ATS scoring engine calculated score: {score_res['overall_score']}/100")

    # 5. Test Job Description Match
    jd_payload = {
        "resume": sample_data,
        "job_description": "Requirements: 5+ years with Python, FastAPI, Kubernetes, Terraform, GraphQL, and Redis."
    }
    res = client.post("/api/ats/match-jd", json=jd_payload)
    assert res.status_code == 200
    jd_res = res.json()
    assert "match_score" in jd_res
    assert len(jd_res["matched_keywords"]) > 0
    print(f"✓ JD Matcher calculated match score: {jd_res['match_score']}% (Matched: {jd_res['matched_keywords']})")

    # 6. Test AI Bullet Polish (Google XYZ Formula)
    bullet_payload = {
        "bullet": "worked on optimizing database queries and backend code",
        "target_role": "Backend Engineer"
    }
    res = client.post("/api/ai/polish-bullet", json=bullet_payload)
    assert res.status_code == 200
    bullet_res = res.json()
    assert len(bullet_res["variations"]) >= 1
    print(f"✓ AI Bullet Polish generated {len(bullet_res['variations'])} Google XYZ variations using {bullet_res['model_used']}")

    # 7. Test AI Summary Generation
    summary_payload = {
        "target_role": "Staff Software Engineer",
        "years_exp": "7+",
        "skills": ["Python", "FastAPI", "Kubernetes", "AWS"]
    }
    res = client.post("/api/ai/generate-summary", json=summary_payload)
    assert res.status_code == 200
    sum_res = res.json()
    assert len(sum_res["summary"]) > 50
    print(f"✓ AI Summary Generator created professional summary via {sum_res['model_used']}")

    # 8. Test Skill Extraction
    skill_payload = {
        "text": "Extensive expertise in Python, FastAPI, React, Docker, Kubernetes, PostgreSQL, and Redis."
    }
    res = client.post("/api/ai/extract-skills", json=skill_payload)
    assert res.status_code == 200
    skill_res = res.json()
    assert len(skill_res["categories"]) > 0
    print(f"✓ AI Skill Extractor extracted {len(skill_res['categories'])} skill categories")

    # 9. Test PDF Export
    res = client.post("/api/export/pdf", json=sample_data)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000
    print(f"✓ ATS PDF exported successfully ({len(res.content)} bytes)")

    # 10. Test DOCX Export
    res = client.post("/api/export/docx", json=sample_data)
    assert res.status_code == 200
    assert "wordprocessingml" in res.headers["content-type"]
    assert len(res.content) > 1000
    print(f"✓ ATS Word DOCX exported successfully ({len(res.content)} bytes)")

    print("\n🎉 ALL 10 TEST SUITES PASSED FLAWLESSLY!")

if __name__ == "__main__":
    run_tests()

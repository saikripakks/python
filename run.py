import uvicorn
from app.config import HOST, PORT

if __name__ == "__main__":
    print(f"🚀 Starting ResumeForge AI Server on http://{HOST}:{PORT}")
    print("🤖 Hugging Face GenAI + FastAPI ATS Resume Builder is live!")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)

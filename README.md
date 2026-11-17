# ResumeForge AI - ATS Resume Builder & GenAI Optimizer

> Next-generation ATS-friendly resume creator built with **FastAPI**, **React**, and **Hugging Face GenAI**.

![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)
![Python: 3.10+](https://img.shields.io/badge/Python-3.10+-blue.svg)
![React: 18](https://img.shields.io/badge/React-18-61dafb.svg)
![FastAPI: 0.110+](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)
![Hugging Face](https://img.shields.io/badge/%F0%9F%A4%97-Hugging%20Face-yellow.svg)

---

## 🌟 Key Features

### 1. 🤖 Hugging Face GenAI + Smart Local Fallback
- **Hugging Face Inference API**: Directly supports state-of-the-art open-source LLMs:
  - `mistralai/Mistral-7B-Instruct-v0.3` (Default)
  - `meta-llama/Llama-3.2-3B-Instruct`
  - `Qwen/Qwen2.5-7B-Instruct`
  - `google/gemma-2-2b-it`
  - Any custom Hugging Face model specified by the user.
- **Intelligent Local Engine**: If you don't supply a Hugging Face API key, ResumeForge automatically falls back to its built-in rule-based NLP and ATS heuristic engine so you can use the entire app offline and without token limits!

### 2. 🎯 Real-Time ATS Compatibility Engine
- Evaluates resumes in real time against Applicant Tracking System standards (Workday, Taleo, Greenhouse, Lever).
- **Comprehensive 100-Point Score**:
  - **Section Completeness (25 pts)**: Contact info, phone, email, summary, employment history, degrees.
  - **Power Action Verbs (25 pts)**: Detects verbs (`Spearheaded`, `Architected`, `Optimized`) vs weak/passive phrases (`responsible for`, `worked on`).
  - **Quantified Results & Metrics (25 pts)**: Regex-driven metric density scanner (detects %, $, time, headcount, and throughput).
  - **Formatting & Keyword Density (25 pts)**: Clean single-column structure, standard section headers, categorized skills.

### 3. 🎯 Job Description Matcher & 1-Click AI Tailoring
- Paste any job posting/description.
- Uncovers **Matched Keywords** and flags **Missing Critical Keywords**.
- **1-Click AI Tailor**: Rewrites the professional summary and enhances experience bullet points to organically integrate missing job requirements without keyword stuffing.

### 4. ✨ Google XYZ Formula Bullet Enhancer
- Transforms generic bullet points into impact statements:
  > *"Accomplished [X] as measured by [Y], by doing [Z]"*
- Generates 3 tailored variations:
  - **Metric-Driven** (focus on % speedup, cost savings, user scale)
  - **Leadership & Scope** (cross-functional alignment, ownership)
  - **Technical Depth** (architecture, automated pipelines, testing rigor)

### 5. 📄 100% ATS-Compliant Dual Exporters
- **ATS PDF Generator** (`ReportLab`): Clean vector typography (standard Helvetica), proper margins, zero multi-column parsing traps.
- **ATS Word DOCX Generator** (`python-docx`): Native Microsoft Word headings, bullet points, and tab stops.
- **Plain Text / OCR Stream**: Exact raw text format as seen by ATS crawlers.

### 6. 👁️ Live Dual-Mode Preview
- **ATS Document View**: Formatted paper simulation showing exact typography and spacing.
- **ATS Robot X-Ray View**: Monospaced raw text extraction simulating how parsing bots view the file.

---

## 🏗️ Architecture

```
python/
├── app/
│   ├── main.py                  # FastAPI server & route handlers
│   ├── config.py                # Environment & HF model configuration
│   ├── models.py                # Pydantic schemas
│   ├── ai_service.py            # Hugging Face InferenceClient + Local GenAI fallback
│   ├── ats_scanner.py           # ATS scoring algorithm & JD matcher
│   ├── pdf_parser.py            # pypdf resume text extractor
│   ├── exporters/
│   │   ├── pdf_exporter.py      # ReportLab ATS PDF generator
│   │   └── docx_exporter.py     # python-docx ATS Word generator
│   └── static/dist/             # Production build of the React frontend
├── frontend/                    # Modern React 18 + Vite + Tailwind CSS app
│   ├── src/
│   │   ├── components/          # Modular React components
│   │   │   ├── Header.jsx
│   │   │   ├── PersonalInfoEditor.jsx
│   │   │   ├── SummaryEditor.jsx
│   │   │   ├── ExperienceEditor.jsx
│   │   │   ├── EducationEditor.jsx
│   │   │   ├── SkillsEditor.jsx
│   │   │   ├── ProjectsEditor.jsx
│   │   │   ├── CertificationsEditor.jsx
│   │   │   ├── JobMatcher.jsx
│   │   │   ├── ATSScoreCard.jsx
│   │   │   ├── DocumentPreview.jsx
│   │   │   ├── AIBulletModal.jsx
│   │   │   ├── HFSettingsModal.jsx
│   │   │   └── ImportPdfModal.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── samples/
│   └── sample_resumes.py        # Pre-configured sample resumes
├── test_app.py                  # End-to-end integration test suite
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
└── run.py                       # Server entrypoint
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm (for building the React frontend)

### 2. Python Environment Setup
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install Python requirements
pip install -r requirements.txt
```

### 3. Frontend Setup (React)
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Configuration (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Hugging Face API Token (optional - the application works in local fallback mode without a token):
```env
HF_TOKEN=hf_your_hugging_face_token_here
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.3
HOST=127.0.0.1
PORT=8000
```
*(You can also configure or change your HF token and model directly in the web UI!)*

### 5. Launch the Application
```bash
python3 run.py
```
Open your browser and navigate to:
```
http://127.0.0.1:8000
```

---

## 🛠️ Development Mode

To run with Hot Module Reloading (HMR) for frontend development:

1. **Start FastAPI Backend**:
   ```bash
   python3 run.py
   ```
2. **Start Vite React Dev Server** (in a separate terminal):
   ```bash
   cd frontend
   npm run dev
   ```
   Open `http://localhost:3000` (API calls are automatically proxied to port 8000).

---

## 🧪 Testing

Run the automated test suite covering all ATS algorithms, AI fallback, PDF/DOCX exporters, and React integration:
```bash
.venv/bin/python test_app.py
```

---

## 📑 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Serves the React web application |
| `GET` | `/api/status` | System health & HF model status |
| `GET` | `/api/samples/{role}` | Pre-filled sample resumes (`software_engineer`, `ai_engineer`) |
| `POST` | `/api/ats/score` | Calculates ATS compatibility score and recommendations |
| `POST` | `/api/ats/match-jd` | Analyzes resume match against target job description |
| `POST` | `/api/ai/polish-bullet` | Enhances bullet using Google XYZ formula via HF / local GenAI |
| `POST` | `/api/ai/generate-summary` | Generates tailored 3-sentence professional summary |
| `POST` | `/api/ai/extract-skills` | Extracts and clusters skills into ATS categories |
| `POST` | `/api/ai/tailor-resume` | Rewrites summary and bullets to align with target JD |
| `POST` | `/api/export/pdf` | Generates and downloads ATS-compliant PDF |
| `POST` | `/api/export/docx` | Generates and downloads ATS-compliant Word document |
| `POST` | `/api/export/txt` | Generates plain text ATS file |
| `POST` | `/api/resume/parse-pdf` | Upload and parse existing PDF resume |

---

## 📜 License
Distributed under the MIT License.

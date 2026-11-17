from typing import Dict, Any

SAMPLE_RESUMES: Dict[str, Dict[str, Any]] = {
    "software_engineer": {
        "personal_info": {
            "full_name": "Alexander Morgan",
            "email": "alex.morgan.dev@gmail.com",
            "phone": "+1 (555) 234-5678",
            "location": "San Francisco, CA",
            "linkedin": "https://linkedin.com/in/alexmorgan-eng",
            "github": "https://github.com/alexmorgan-dev",
            "portfolio": "https://alexmorgan.tech",
            "target_role": "Senior Full-Stack Software Engineer"
        },
        "summary": "Innovative Senior Full-Stack Engineer with 6+ years of experience designing and deploying high-concurrency microservices, real-time web applications, and resilient cloud infrastructure. Spearheaded backend transformations resulting in 45% reduction in API response times across 12M+ monthly active users. Expert in Python (FastAPI/Django), TypeScript (React/Next.js), and Kubernetes cloud environments.",
        "work_experience": [
            {
                "id": "exp-1",
                "company": "Nexus Cloud Technologies",
                "role": "Senior Software Engineer",
                "location": "San Francisco, CA",
                "start_date": "2022-03",
                "end_date": "Present",
                "current": True,
                "bullets": [
                    "Architected high-throughput data ingestion pipeline in FastAPI and Apache Kafka, processing 35,000 requests/sec with 99.99% uptime.",
                    "Engineered distributed caching layer using Redis Cluster, reducing database read latency by 48% and saving $32,000 in monthly AWS infrastructure costs.",
                    "Spearheaded migration of legacy monolith into 8 containerized microservices orchestrated via Kubernetes and Terraform on AWS EKS.",
                    "Mentored team of 5 junior and mid-level software engineers, driving test-driven development (TDD) that improved sprint code coverage from 62% to 91%."
                ]
            },
            {
                "id": "exp-2",
                "company": "Vanguard Digital Systems",
                "role": "Full-Stack Software Engineer",
                "location": "San Jose, CA",
                "start_date": "2019-06",
                "end_date": "2022-02",
                "current": False,
                "bullets": [
                    "Developed responsive web dashboards using React, TypeScript, and TailwindCSS for enterprise clients managing $140M in ad spend.",
                    "Optimized PostgreSQL queries, connection pooling, and multi-column indexes, reducing 95th percentile query latency from 850ms to 95ms.",
                    "Automated end-to-end CI/CD testing pipelines using GitHub Actions and Docker, accelerating engineering deployment frequency by 3x."
                ]
            }
        ],
        "education": [
            {
                "id": "edu-1",
                "institution": "University of California, Berkeley",
                "degree": "Bachelor of Science",
                "field_of_study": "Computer Science",
                "location": "Berkeley, CA",
                "graduation_date": "2019",
                "gpa": "3.85 / 4.0",
                "honors": "Dean's Honors List, Magna Cum Laude"
            }
        ],
        "skills": [
            {
                "category": "Languages & Core",
                "skills": ["Python", "TypeScript", "JavaScript", "Go", "SQL", "HTML5/CSS3"]
            },
            {
                "category": "Frameworks & Libraries",
                "skills": ["FastAPI", "React", "Next.js", "Django", "Node.js", "Express", "TailwindCSS"]
            },
            {
                "category": "Cloud & DevOps",
                "skills": ["AWS (EKS, S3, RDS, Lambda)", "Docker", "Kubernetes", "Terraform", "CI/CD", "GitHub Actions"]
            },
            {
                "category": "Databases & Messaging",
                "skills": ["PostgreSQL", "Redis", "Kafka", "MongoDB", "Elasticsearch"]
            }
        ],
        "projects": [
            {
                "id": "proj-1",
                "title": "Distributed Task Orchestrator (PulseQueue)",
                "role": "Lead Creator",
                "tech_stack": ["Python", "FastAPI", "Redis", "Docker"],
                "link": "https://github.com/alexmorgan-dev/pulsequeue",
                "bullets": [
                    "Engineered asynchronous task scheduler executing 500k+ delayed tasks with priority queues and exponential backoff retry mechanisms.",
                    "Benchmarked against Celery demonstrating 22% lower memory footprint and zero deadlocks during simulated network partitions."
                ]
            }
        ],
        "certifications": [
            {
                "id": "cert-1",
                "name": "AWS Certified Solutions Architect – Associate",
                "issuer": "Amazon Web Services",
                "date": "2023",
                "credential_id": "AWS-PSA-993821",
                "url": ""
            }
        ]
    },
    "ai_engineer": {
        "personal_info": {
            "full_name": "Elena Rostova",
            "email": "elena.rostova.ai@gmail.com",
            "phone": "+1 (555) 890-1234",
            "location": "New York, NY",
            "linkedin": "https://linkedin.com/in/elena-rostova-ml",
            "github": "https://github.com/elena-rostova",
            "portfolio": "https://rostova-ai.dev",
            "target_role": "Machine Learning & GenAI Engineer"
        },
        "summary": "Results-driven Machine Learning Engineer with 5+ years of experience fine-tuning large language models (LLMs), architecting RAG pipelines, and deploying deep learning models to production. Successfully deployed GenAI copilots adopted by 80,000+ daily active users, lowering customer support resolution times by 55%. Strong foundation in PyTorch, Hugging Face Transformers, and vector databases.",
        "work_experience": [
            {
                "id": "exp-1",
                "company": "Cognitive AI Labs",
                "role": "Lead Machine Learning Engineer",
                "location": "New York, NY",
                "start_date": "2022-08",
                "end_date": "Present",
                "current": True,
                "bullets": [
                    "Engineered retrieval-augmented generation (RAG) system utilizing Hugging Face embeddings and Qdrant vector database, boosting answer retrieval accuracy to 94.2%.",
                    "Fine-tuned open-source LLMs (Llama 3 & Mistral) using LoRA/QLoRA on proprietary enterprise corpus, slashing inference costs by 65% compared to OpenAI GPT-4 API.",
                    "Orchestrated real-time inference serving with vLLM and Triton Inference Server, achieving p99 response latency under 320ms."
                ]
            },
            {
                "id": "exp-2",
                "company": "DeepData Analytics",
                "role": "Machine Learning Scientist",
                "location": "Boston, MA",
                "start_date": "2020-01",
                "end_date": "2022-07",
                "current": False,
                "bullets": [
                    "Trained neural text classification and named-entity recognition (NER) models for automated financial filing extraction across 2M+ SEC documents.",
                    "Constructed scalable feature stores and ML monitoring dashboards using Feast and Weights & Biases to track model drift in production."
                ]
            }
        ],
        "education": [
            {
                "id": "edu-1",
                "institution": "Columbia University",
                "degree": "Master of Science",
                "field_of_study": "Data Science & Artificial Intelligence",
                "location": "New York, NY",
                "graduation_date": "2019",
                "gpa": "3.92 / 4.0",
                "honors": "Graduate Research Fellowship"
            }
        ],
        "skills": [
            {
                "category": "GenAI & LLM",
                "skills": ["Hugging Face", "PyTorch", "Transformers", "LangChain", "LlamaIndex", "vLLM", "LoRA/QLoRA", "Vector DBs (Qdrant, Pinecone)"]
            },
            {
                "category": "Data Science & ML",
                "skills": ["Scikit-Learn", "Pandas", "NumPy", "MLflow", "Weights & Biases", "Feature Engineering"]
            },
            {
                "category": "Software & DevOps",
                "skills": ["Python", "FastAPI", "Docker", "Kubernetes", "AWS SageMaker", "Git", "SQL"]
            }
        ],
        "projects": [
            {
                "id": "proj-1",
                "title": "OpenMedLLM: Clinical Note Summarization",
                "role": "Creator & Lead Researcher",
                "tech_stack": ["PyTorch", "Hugging Face", "FastAPI", "Docker"],
                "link": "https://github.com/elena-rostova/open-med-llm",
                "bullets": [
                    "Fine-tuned Mistral-7B on synthetic EHR records, achieving 89% ROUGE-L score on clinical summaries.",
                    "Containerized and deployed as an open REST API handling 120 requests per minute."
                ]
            }
        ],
        "certifications": [
            {
                "id": "cert-1",
                "name": "TensorFlow Developer Certificate",
                "issuer": "Google",
                "date": "2021",
                "credential_id": "TF-883011",
                "url": ""
            }
        ]
    }
}

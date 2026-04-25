<div align="center">

# YuvaSetu

### AI-Powered Career Platform for Bharat's Youth

**AlgoZenith 10.0 | PS 01 - Next-Gen Generative AI | Team Idea Igniters**

**SDG 4** (Quality Education) | **SDG 8** (Decent Work) | **SDG 10** (Reduced Inequalities)

*Eliminating opportunity fatigue with explainable AI matching, real-time AI mock interviews, and multilingual career guidance.*

</div>

---

## What is YuvaSetu?

YuvaSetu is an AI-powered career platform that bridges the gap between job seekers and employers using explainable AI. Instead of drowning users in hundreds of irrelevant listings, YuvaSetu uses semantic matching to surface the right opportunities with transparent match breakdowns. It provides real-time voice-based AI mock interviews with granular feedback scoring, multilingual support across English, Hindi, and Marathi, and company-specific mock test preparation -- all designed to give India's youth a fair shot at meaningful employment.

---

## Architecture

```
+--------------------------------------------------+
|                   CLIENT BROWSER                  |
|  React + Vite + TypeScript + TailwindCSS + shadcn |
|                   (port 8080)                     |
+----------+-------------------+--------------------+
           |                   |
           | REST API           | Firebase Auth
           v                   v
+----------+----------+  +-----+-------+
|  Express Backend     |  |  Firebase   |
|  TypeScript/Mongoose |  |  Auth       |
|    (port 5000)       |  +-------------+
+--+-------+-------+--+
   |       |       |
   v       v       v
+--+--+ +--+---+ +-+----------+
| Mongo| |Gemini| | Ollama LLM |
| Atlas| | API  | | gemma3:4b  |
+------+ +------+ | mistral    |
                   | llama3     |
                   |(port 11434)|
                   +------------+

+---------------------+  +---------------------+
|  Edge TTS Server    |  |  Whisper STT Server |
|  Python / Flask     |  |  Python / Flask     |
|    (port 5100)      |  |  faster-whisper     |
+---------------------+  |    (port 5200)      |
                          +---------------------+
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, TailwindCSS, shadcn/ui, i18next |
| Backend | Node.js, Express, TypeScript, Mongoose |
| Database | MongoDB Atlas |
| Authentication | Firebase Auth (Google, Email/Password) |
| LLM Inference | Ollama (gemma3:4b, mistral, llama3) |
| Speech-to-Text | faster-whisper (Python Flask server) |
| Text-to-Speech | Edge TTS (Python Flask server) |
| Embeddings | Google Gemini API (384-dimensional vectors) |
| Email | Nodemailer |
| Scraping | BeautifulSoup4, Python |

---

## Features

### Job Seeker Features

| Feature | Description |
|---|---|
| Semantic Job Matching | AI-powered job recommendations with explainable match breakdowns (Skills, Experience, Culture) |
| AI Mock Interviews | Real-time voice-based mock interviews with dynamic questions generated from user profile |
| Company Mock Tests | Practice MCQ tests for 24+ companies (TCS, Infosys, Wipro, etc.) with AI-generated questions |
| Multilingual UI | Full platform support in English, Hindi, and Marathi (995 translation keys, 55+ components) |
| Profile Builder | Comprehensive profile with skills, experience, education, and bio |
| Job Applications | One-click apply with application status tracking |
| Interview Feedback | Detailed scoring across 5 categories with actionable improvement suggestions |

### Employer Features

| Feature | Description |
|---|---|
| Job Posting | Create and manage job listings with skill tags and requirements |
| Candidate Discovery | AI-ranked candidate recommendations based on job requirements |
| Application Management | Review, shortlist, and manage incoming applications |
| Interview Scheduling | Built-in scheduling with email notifications |
| Analytics Dashboard | Track posting performance and application metrics |

---

## AI Mock Interview -- Deep Dive

### Voice Pipeline

```
User speaks
    |
    v
ScriptProcessorNode (PCM capture in browser)
    |
    v
WAV encoding (client-side)
    |
    v
Whisper STT Server (port 5200) --> Transcribed text
    |
    v
Ollama LLM (gemma3:4b) --> AI response text
    |
    v
Sentence splitting (regex)
    |
    v
Edge TTS Server (port 5100) --> Audio chunks (parallel generation)
    |
    v
HTML5 Audio sequential playback
```

### Feedback Scoring

Each interview is scored across 5 categories, equally weighted:

| Category | Weight | What it Measures |
|---|---|---|
| Communication Skills | 20% | Clarity, articulation, structured responses |
| Technical Knowledge | 20% | Domain expertise, accuracy of technical answers |
| Problem Solving | 20% | Analytical thinking, approach to challenges |
| Cultural Fit | 20% | Teamwork, values alignment, adaptability |
| Confidence and Clarity | 20% | Composure, conviction, conciseness |

Each category is scored 0-100. The total score is the simple average of all 5 categories.

| Score Range | Rating |
|---|---|
| 90 - 100 | Exceptional |
| 80 - 89 | Strong |
| 70 - 79 | Good |
| 60 - 69 | Fair |
| Below 60 | Needs Development |

### Dynamic Question Generation

Interview questions are not static. The LLM generates contextual questions based on the user's profile:
- **Skills**: Technical questions tailored to listed skills (e.g., React, Python, SQL)
- **Experience**: Behavioral and situational questions based on years and roles
- **Education**: Questions calibrated to educational background
- **Bio**: Culture-fit and motivation questions derived from the user's self-description

### Voice-Triggered Interview End

The system detects phrases like "end interview", "stop interview", or "that's all" to gracefully conclude the session and trigger feedback generation.

---

## Semantic Job Matching

### How It Works

1. **Embedding Generation**: User profiles and job descriptions are embedded into 384-dimensional vectors using the Google Gemini Embedding API.
2. **Cosine Similarity**: Match scores are computed via cosine similarity between user and job vectors.
3. **Explainable Breakdown**: The overall match is decomposed into weighted sub-scores:

| Component | Weight | Source |
|---|---|---|
| Skills Match | 50% | Overlap between user skills and job required skills |
| Experience Match | 30% | Alignment of user experience level with job requirements |
| Bio / Culture Fit | 20% | Semantic similarity between user bio and job description |

Users see exactly *why* a job was recommended, not just a percentage.

---

## Multilingual Support

| Metric | Value |
|---|---|
| Translation Keys | 995 |
| Supported Languages | English, Hindi, Marathi |
| Components Covered | 55+ |
| Framework | i18next with React integration |

All UI strings, form labels, error messages, and navigation elements are fully translated. Language switching is instant with no page reload.

---

## Mock Test System

| Metric | Value |
|---|---|
| Companies Covered | 24 |
| Question Format | Multiple Choice (4 options) |
| Generation Pipeline | Web Scraping --> Ollama MCQ Generation --> MongoDB Storage |

### Scraper Pipeline

1. **Web Scraping** (BeautifulSoup4): Scrapes company-specific aptitude and technical question patterns from public sources.
2. **Ollama MCQ Generation** (mistral/llama3): Generates contextual multiple-choice questions based on scraped data.
3. **MongoDB Storage**: Questions are stored with company tags, difficulty levels, and correct answers.

---

## SDG Alignment

| SDG | Goal | How YuvaSetu Contributes |
|---|---|---|
| **SDG 4** | Quality Education | AI mock interviews provide personalized practice and feedback. Mock tests for 24 companies prepare students for real assessments. Multilingual support makes resources accessible to non-English speakers. |
| **SDG 8** | Decent Work and Economic Growth | Semantic job matching reduces opportunity fatigue and connects youth to relevant employment. Explainable AI ensures transparent, fair recommendations. |
| **SDG 10** | Reduced Inequalities | Multilingual UI (Hindi, Marathi) removes language barriers. Free AI interview practice levels the playing field for students without access to coaching. Profile-based matching reduces bias from traditional screening. |

---

## Hypothesis and Analysis

### H1: Semantic matching outperforms keyword matching

**Claim**: Embedding-based cosine similarity produces more relevant job recommendations than keyword overlap.

**Approach**: Compare precision@10 of semantic matching vs. keyword matching on the same user-job pairs. Semantic matching captures synonyms (e.g., "React" matches "frontend development"), partial skill overlaps, and contextual relevance that keyword matching misses entirely.

**Expected Outcome**: Semantic matching yields 30-40% higher relevance scores in user satisfaction surveys.

### H2: AI mock interviews improve scores over time

**Claim**: Users who complete 3+ mock interviews show measurable improvement in feedback scores.

**Approach**: Track per-user score trajectories across interview sessions. Analyze category-level improvements (e.g., Communication Skills improves faster than Technical Knowledge).

**Expected Outcome**: Average score improvement of 12-18% after 3 sessions, with Communication Skills showing the steepest learning curve.

### H3: Multilingual UI increases engagement

**Claim**: Offering Hindi and Marathi translations increases session duration and feature adoption among non-English-primary users.

**Approach**: Compare engagement metrics (session time, pages visited, interviews completed) between users who switch language vs. those who stay on English.

**Expected Outcome**: 25%+ increase in session duration for users who switch to their native language.

---

## Performance Metrics

| Metric | Measured Value | Notes |
|---|---|---|
| Whisper STT Latency | ~800ms - 1.5s | Depends on audio length; first request includes model download (~150MB) |
| Ollama LLM Response | ~2 - 5s | gemma3:4b on CPU; faster with GPU |
| Edge TTS Generation | ~300 - 600ms per sentence | Parallel generation across sentences |
| Total Conversation Turn | ~4 - 8s | End-to-end from user stops speaking to AI starts responding |
| Gemini Embedding | ~200 - 400ms | Per embedding request |
| Job Match Computation | ~50 - 100ms | For cosine similarity on pre-computed vectors |
| Page Load (Frontend) | < 2s | Vite HMR in development |

---

## API Endpoints

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login with credentials |
| GET | `/api/auth/me` | Yes | Get current user profile |

### Users / Profiles

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users/profile` | Yes | Get user profile |
| PUT | `/api/users/profile` | Yes | Update user profile |
| GET | `/api/users/:id` | Yes | Get user by ID |

### Jobs

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/jobs` | No | List all jobs (with filters) |
| POST | `/api/jobs` | Yes | Create a new job posting |
| GET | `/api/jobs/:id` | No | Get job details |
| PUT | `/api/jobs/:id` | Yes | Update job posting |
| DELETE | `/api/jobs/:id` | Yes | Delete job posting |
| GET | `/api/jobs/recommended` | Yes | Get AI-recommended jobs for user |

### Applications

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/applications` | Yes | Apply to a job |
| GET | `/api/applications` | Yes | List user's applications |
| GET | `/api/applications/job/:jobId` | Yes | Get applications for a job (employer) |
| PUT | `/api/applications/:id/status` | Yes | Update application status |

### Interviews

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/interviews` | Yes | Start a new mock interview |
| GET | `/api/interviews` | Yes | List user's interviews |
| GET | `/api/interviews/:id` | Yes | Get interview details |
| PUT | `/api/interviews/:id` | Yes | Update interview (add messages) |
| POST | `/api/interviews/:id/end` | Yes | End interview and trigger feedback |

### Interview Feedback

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/interviews/:id/feedback` | Yes | Get feedback for an interview |
| POST | `/api/interviews/:id/feedback` | Yes | Generate/save feedback |

### Mock Tests

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/mock-tests/companies` | Yes | List available companies |
| GET | `/api/mock-tests/:company` | Yes | Get questions for a company |
| POST | `/api/mock-tests/submit` | Yes | Submit test and get score |

### AI Services (Internal)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `localhost:5100/tts` | No | Convert text to speech audio |
| POST | `localhost:5200/stt` | No | Convert speech audio to text |

---

## Database Schema

### `interviews` Collection

```json
{
  "_id": "ObjectId",
  "userId": "string (Firebase UID)",
  "jobTitle": "string",
  "company": "string",
  "status": "in-progress | completed",
  "messages": [
    {
      "role": "interviewer | candidate",
      "content": "string",
      "timestamp": "ISODate"
    }
  ],
  "startedAt": "ISODate",
  "endedAt": "ISODate",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

### `interviewfeedbacks` Collection

```json
{
  "_id": "ObjectId",
  "interviewId": "ObjectId (ref: interviews)",
  "userId": "string (Firebase UID)",
  "scores": {
    "communicationSkills": 78,
    "technicalKnowledge": 82,
    "problemSolving": 75,
    "culturalFit": 85,
    "confidenceAndClarity": 80
  },
  "totalScore": 80,
  "rating": "Strong",
  "strengths": ["Clear communication", "Good technical depth"],
  "improvements": ["Could provide more structured answers", "Elaborate on problem-solving approach"],
  "overallFeedback": "string (detailed paragraph)",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

---

## Team Havoc

| Role | Name |
|---|---|
| CEO | Joy Banerjee |
| CTO | Shubham Kumar |
| CPO | Atharva Chavan |
| CMO | Arjun Verma |

---

## License

Built for HackDTU 6.0. All rights reserved by Team Havoc.

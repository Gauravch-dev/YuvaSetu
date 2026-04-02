# Recommendation Engine - Required Files for Standalone Use

To use the recommendation engine in a different project, you need to copy the following files:

## Core Controller File
- **[backend/src/controllers/recommendation.controller.ts](backend/src/controllers/recommendation.controller.ts)** - Main recommendation engine logic with two endpoints:
  - `getRecommendedJobs()` - Recommends jobs to a job seeker
  - `getRecommendedCandidates()` - Recommends candidates to an employer

## Service Files (Business Logic)
- **[backend/src/services/vector.service.ts](backend/src/services/vector.service.ts)** - Vector operations and cosine similarity calculations
- **[backend/src/services/gemini.service.ts](backend/src/services/gemini.service.ts)** - Embedding generation using Google Gemini API

## Model Files (Database Schemas)
- **[backend/src/models/Job.ts](backend/src/models/Job.ts)** - Job document schema with embedding fields
  - Required fields: `skillsEmbedding`, `experienceEmbedding`, `descriptionEmbedding`
- **[backend/src/models/JobSeekerProfile.ts](backend/src/models/JobSeekerProfile.ts)** - Job seeker profile schema with embedding fields
  - Required fields: `skillsEmbedding`, `experienceEmbedding`, `bioEmbedding`
- **[backend/src/models/CompanyProfile.ts](backend/src/models/CompanyProfile.ts)** - Company profile schema (referenced in job recommendations)
- **[backend/src/models/User.ts](backend/src/models/User.ts)** - User model for authentication

## Middleware Files
- **[backend/src/middleware/auth.middleware.ts](backend/src/middleware/auth.middleware.ts)** - User authentication via Firebase

## Utility Files
- **[backend/src/utils/response.ts](backend/src/utils/response.ts)** - Standard response formatting utilities

## Route File
- **[backend/src/routes/recommendation.routes.ts](backend/src/routes/recommendation.routes.ts)** - API route definitions

## Configuration Files
- **[backend/src/config/db.ts](backend/src/config/db.ts)** - MongoDB database connection
- **[backend/src/config/firebase.ts](backend/src/config/firebase.ts)** - Firebase authentication configuration

## Environment Variables Required
```
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
FIREBASE_CONFIG=your_firebase_config
```

## Dependencies Required
```json
{
  "@google/generative-ai": "^latest",
  "mongoose": "^latest",
  "express": "^latest",
  "dotenv": "^latest",
  "firebase-admin": "^latest"
}
```

## Database Requirements
### MongoDB Atlas Vector Search Indexes
1. **job_vector_index** on `jobs` collection
   - Index path: `skillsEmbedding`
   - Used for: Finding relevant jobs based on job seeker's skills

2. **candidate_vector_index** on `jobseekerprofiles` collection
   - Index path: `skillsEmbedding`
   - Used for: Finding relevant candidates based on job requirements

### Collections Required
- `users` - User accounts
- `jobs` - Job postings (must have embedding fields)
- `jobseekerprofiles` - Job seeker profiles (must have embedding fields)
- `companyprofiles` - Company information

## Recommendation Engine Architecture

### Flow 1: Get Recommended Jobs (for Job Seekers)
```
User Request → Authentication (Firebase)
    ↓
Load JobSeekerProfile with embeddings
    ↓
Auto-heal missing embeddings (generate via Gemini API)
    ↓
MongoDB Atlas Vector Search (retrieve ~50 candidates using skillsEmbedding)
    ↓
In-Memory Reranking with Hybrid Scoring:
    - Skill Match: 50%
    - Experience Match: 30%
    - Role/Bio Match: 20%
    ↓
Top 10 Results Returned
```

### Flow 2: Get Recommended Candidates (for Employers)
```
User Request → Authentication (Firebase)
    ↓
Load Job with embeddings
    ↓
Auto-heal missing embeddings (generate via Gemini API)
    ↓
MongoDB Atlas Vector Search (retrieve ~50 candidates)
    ↓
In-Memory Reranking with same weights
    ↓
Top Results Returned
```

## Key Features
1. **Multi-Vector Embeddings**: Separate embeddings for skills, experience, and bio/description
2. **Hybrid Scoring**: Weighted combination of multiple similarity scores
3. **MongoDB Atlas Vector Search**: Efficient vector similarity search
4. **Auto-Healing**: Automatically generates missing embeddings on-demand
5. **Lazy Loading**: Embeddings generated only when needed
6. **Security**: Role-based access control (JOB_SEEKER vs employer)

## Integration Notes
- The recommendation engine uses **MongoDB Atlas Vector Search**, which requires vector indexes
- **Gemini Embeddings API** is used for generating 768-dimensional embeddings
- **Firebase Authentication** is required for user authentication
- The engine filters out already-applied jobs/candidates
- Cosine similarity is used for vector comparison (range: -1 to 1)

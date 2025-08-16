# AI Meeting Summarizer

Full‑stack app with React frontend and Node.js/Express backend using MongoDB. Generates AI summaries via Groq with OpenAI fallback.

## Structure
- `backend/` — Express API, MongoDB models, AI + email services
- `frontend/` — React app (Vite)

## Backend: Local Setup
1. `cd backend`
2. `cp .env.example .env` and fill values
3. `npm install`
4. `npm run dev`

## Frontend: Local Setup
1. `cd frontend`
2. `cp .env.example .env` and fill values
3. `npm install`
4. `npm run dev`

## Deployment
- Backend: Render (Node) — set env vars from `backend/.env.example`
- Frontend: Vercel — set `VITE_API_BASE` (e.g., your Render URL)
- DB: MongoDB Atlas — set `MONGODB_URI`

## API Routes (prefix `/api`)
- POST `/uploadTranscript`
- POST `/summarize`
- POST `/saveSummary`
- POST `/sendEmail`
- GET  `/analytics` (optional)

# MoodBoard 🌊

A full-stack AI-powered mood journaling web app. Write daily entries, detect your emotions with AI, and discover emotional patterns over time.

🔗 **Live Demo:** [moodboard-frontend.netlify.app](https://moodboard-frontend.netlify.app)
📦 **Repo:** [github.com/charannalagatla/moodboard](https://github.com/charannalagatla/moodboard)

---

## Architecture

```
User (React / Netlify)
        │ REST
        ▼
Express Backend (Node.js / Render)
   ├──► MongoDB Atlas        — stores users, entries, emotions
   └──► Groq API (Llama 3)   — real-time 7-class emotion classification
                └──► returns joy / sadness / anger / fear / surprise / disgust / neutral
```

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Write entry** | Text area with optional mood tag. Triggers AI emotion detection on submit. |
| 2 | **Emotion detection** | 7-emotion classification with confidence scores via Groq API (Llama 3). |
| 3 | **Mood dashboard** | Bar chart (daily moods) + Line chart (confidence trend) + Pie chart (frequency). |
| 4 | **Insight cards** | Auto-generated tips and pattern detection ("Anxious on Mondays"). |
| 5 | **Streak tracker** | Days journaled count with milestone badges (3 / 7 / 14 / 21 / 30 / 60 / 100 days). |
| 6 | **JWT auth** | Register / Login with bcrypt hashed passwords. All entries are private. |

---

## Project Structure

```
moodboard/
├── backend/                  # Express.js API
│   ├── server.js
│   ├── middleware/auth.js     # JWT protect middleware
│   ├── models/
│   │   ├── User.js           # streak logic, bcrypt
│   │   └── Entry.js          # emotion schema
│   └── routes/
│       ├── auth.js           # register / login / me
│       └── entries.js        # create, list, dashboard, delete + Groq emotion analysis
│
├── frontend/                 # React app
│   └── src/
│       ├── context/AuthContext.js
│       ├── api.js            # axios instance + all API calls
│       ├── components/
│       │   ├── Navbar.js
│       │   ├── StreakBadge.js
│       │   ├── InsightCard.js
│       │   ├── EmotionBars.js
│       │   └── ProtectedRoute.js
│       └── pages/
│           ├── Login.js
│           ├── Register.js
│           ├── WriteEntry.js  # main journal page
│           ├── MoodResult.js  # emotion result page
│           ├── Dashboard.js   # Recharts charts + insights
│           └── History.js     # paginated entry list
│
├── netlify.toml              # Netlify deploy config
└── .gitignore
```

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone & install

```bash
git clone https://github.com/charannalagatla/moodboard.git
cd moodboard

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment variables

```bash
# backend/.env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=change_me_to_something_long_and_random
GROQ_API_KEY=gsk_...
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# frontend/.env
REACT_APP_API_URL=http://localhost:5000
```

### 3. Run both services

**Terminal 1 — Express backend:**
```bash
cd backend && npm run dev
# → http://localhost:5000
```

**Terminal 2 — React frontend:**
```bash
cd frontend && npm start
# → http://localhost:3000
```

---

## Deployment

### Backend (Render)

1. Push repo to GitHub.
2. In Render, click **New → Web Service** → connect your GitHub repo.
3. Set **Root directory** → `backend`, **Build command** → `npm install`, **Start command** → `npm start`.
4. Add environment variables:
   - `MONGODB_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — any long random string
   - `GROQ_API_KEY` — from console.groq.com
   - `FRONTEND_URL` — your Netlify URL (update after frontend deploy)
   - `NODE_ENV` — `production`
5. Deploy.

### Frontend (Netlify)

1. In Netlify, click **New site → Import from Git**.
2. Set **Base directory** → `frontend`, **Build command** → `npm run build`, **Publish directory** → `build`.
3. Add environment variable: `REACT_APP_API_URL` → your Render backend URL (no trailing slash).
4. Deploy.
5. Update `FRONTEND_URL` in Render with your Netlify URL and redeploy.

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ✗ | Create account |
| POST | `/api/auth/login` | ✗ | Get JWT token |
| GET | `/api/auth/me` | ✓ | Get current user |
| POST | `/api/entries` | ✓ | Create entry + run AI emotion detection |
| GET | `/api/entries` | ✓ | List entries (paginated) |
| GET | `/api/entries/dashboard` | ✓ | Aggregated chart data |
| GET | `/api/entries/:id` | ✓ | Single entry |
| DELETE | `/api/entries/:id` | ✓ | Delete entry |

---

## Emotion Detection

**Model:** Groq API with `llama-3.1-8b-instant`

Returns 7 emotions per journal entry with confidence scores:
- `joy` 😊 · `sadness` 😢 · `anger` 😠 · `fear` 😨 · `surprise` 😲 · `disgust` 🤢 · `neutral` 😐

The dominant emotion and full score distribution are stored in MongoDB and used for dashboard analytics.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router 6, Recharts, Axios |
| Backend | Node.js 18, Express 4, Mongoose, JWT, bcryptjs |
| AI | Groq API (Llama 3.1 8B) |
| Database | MongoDB Atlas |
| Deploy | Netlify (frontend) · Render (backend) |
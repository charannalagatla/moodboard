# MoodBoard 🌊

A private emotion-journaling app. Write daily entries, detect your mood with AI, and discover emotional patterns over time.

---

## Architecture

```
User (React / Netlify)
        │ REST
        ▼
Express Backend (Node.js / Render)
   ├──► MongoDB Atlas   — stores users, entries, emotions
   └──► Flask ML Service (Python / Render)
              └──► HuggingFace: j-hartmann/emotion-english-distilroberta-base
                        └──► returns joy / sadness / anger / fear / surprise / disgust / neutral
```

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Write entry** | Rich text area with optional mood tag. Triggers ML on submit. |
| 2 | **Emotion detect** | 7-emotion classification with confidence scores via HuggingFace. |
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
│       └── entries.js        # create, list, dashboard, delete
│
├── ml-service/               # Flask ML API
│   ├── app.py                # HuggingFace emotion pipeline
│   └── requirements.txt
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
├── render.yaml               # Render deploy config
└── .gitignore
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account (free tier works)

### 1. Clone & install

```bash
git clone https://github.com/you/moodboard.git
cd moodboard

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# ML service
cd ../ml-service && pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
# backend/.env  (copy from .env.example)
MONGODB_URI=mongodb+srv://...
JWT_SECRET=change_me_to_something_long_and_random
FLASK_ML_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000

# ml-service/.env
PORT=5001
FLASK_ENV=development
ALLOWED_ORIGINS=http://localhost:5000

# frontend/.env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Run all three services

**Terminal 1 — Express backend:**
```bash
cd backend && npm run dev
# → http://localhost:5000
```

**Terminal 2 — Flask ML service:**
```bash
cd ml-service && python app.py
# → http://localhost:5001
# Note: first run downloads the HuggingFace model (~300 MB)
```

**Terminal 3 — React frontend:**
```bash
cd frontend && npm start
# → http://localhost:3000
```

---

## Deployment

### Day 1 — Backend + ML (Render)

1. Push repo to GitHub.
2. In Render, click **New → Blueprint** and point to `render.yaml`.
3. Set secret env vars in the Render dashboard:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `FRONTEND_URL` — your Netlify URL (set after Day 2)
   - `ALLOWED_ORIGINS` — your Express backend URL
4. Deploy. The ML service downloads the model on first boot (~5 min).

### Day 2 — Frontend (Netlify)

1. In Netlify, click **New site → Import from Git**.
2. Set **Base directory** → `frontend`, **Build command** → `npm run build`, **Publish directory** → `frontend/build`.
3. Add env variable: `REACT_APP_API_URL` → your Render Express URL + `/api`.
4. Deploy.
5. Update `FRONTEND_URL` in Render with the new Netlify URL.

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ✗ | Create account |
| POST | `/api/auth/login` | ✗ | Get JWT token |
| GET | `/api/auth/me` | ✓ | Get current user |
| POST | `/api/entries` | ✓ | Create entry + run ML |
| GET | `/api/entries` | ✓ | List entries (paginated) |
| GET | `/api/entries/dashboard` | ✓ | Aggregated chart data |
| GET | `/api/entries/:id` | ✓ | Single entry |
| DELETE | `/api/entries/:id` | ✓ | Delete entry |

---

## ML Model

**Model:** `j-hartmann/emotion-english-distilroberta-base`

Returns 7 emotions per text:
- `joy` 😊 · `sadness` 😢 · `anger` 😠 · `fear` 😨 · `surprise` 😲 · `disgust` 🤢 · `neutral` 😐

The Express backend calls Flask at `POST /analyse` and stores the full distribution in MongoDB.
The Flask service is gracefully degraded — if it's unreachable, entries are saved without emotion data.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router 6, Recharts, Axios |
| Backend | Node.js 18, Express 4, Mongoose, JWT, bcryptjs |
| ML | Python 3.10, Flask 3, HuggingFace Transformers, PyTorch |
| Database | MongoDB Atlas |
| Deploy | Netlify (frontend) · Render (backend + ML) |
| Fonts | Syne + IBM Plex Mono |

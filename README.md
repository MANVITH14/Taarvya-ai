# 🌟 TAARVYA AI — Your Birth Chart. Your Cosmic Story.

A modern, authentic Vedic astrology platform designed for users in India and worldwide.  
Supports **English** and **ಕನ್ನಡ (Kannada)** with a working language toggle, real astronomical calculations (Lahiri Chitrapaksha ayanamsha), North Indian Kundli chart rendering, Vimshottari Dasha timelines, Ashtakoota compatibility matching, and AI-assisted cultural interpretations.

---

## 🎨 Visual Identity & Design System

- **Palette**: Warm ivory backgrounds (`#FAF8F5`), crisp white cards (`#FFFFFF`), rich deep plum text & headings (`#2D1A30`, `#4B2054`), soft lavender accents (`#EDE8F5`), and muted celestial gold (`#C89D3C`, `#FFE082`).
- **Typography**: Clean, contemporary sans-serif and display typography optimized for both Latin script and Kannada Unicode characters.
- **Motifs**: Authentic Indian celestial geometry, whole-sign 12-house diamond & square chart grid, 27 Nakshatras with planetary lords, and subtle micro-interactions.

---

## 🚀 System Architecture

```
taarvya-ai/
├── frontend/                 # React 19 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Layouts, Navbar, Footer, Language toggle
│   │   ├── contexts/         # AuthContext, LangContext
│   │   ├── i18n/             # en.ts (English) & kn.ts (Kannada) dictionaries
│   │   ├── lib/              # Axios API client, query hooks, type contracts
│   │   ├── pages/            # Landing, Kundli, Dasha, Reports, Settings, Matching
│   │   └── test/             # Vitest & React Testing Library suite
│   ├── Dockerfile            # Multi-stage production build (Node -> Nginx)
│   └── nginx.conf            # SPA routing, gzip, security headers & API proxy
├── backend/                  # FastAPI + SQLAlchemy 2.0 + Pydantic v2
│   ├── app/
│   │   ├── api/v1/           # Auth, Profiles, Charts, Reports, Geocode routes
│   │   ├── astrology/        # Sidereal calculation engine (Lahiri ayanamsha)
│   │   ├── core/             # Argon2 auth, JWT tokens, DB engine, Config
│   │   ├── models/           # SQLAlchemy models: User, BirthProfile, SavedReport
│   │   └── services/         # Geocoding (Nominatim), AI reports & fallbacks
│   ├── tests/                # Pytest unit & integration tests
│   └── Dockerfile            # Python 3.11-slim production container
├── docker-compose.yml        # One-command orchestration (PostgreSQL, Backend, Frontend)
├── .env.example              # Environment variables template
└── README.md
```

---

## ⚡ Quick Start with Docker (Recommended)

Run the entire full-stack application (PostgreSQL + FastAPI + React Frontend) with a single command:

```bash
docker-compose up --build
```

- **Frontend**: http://localhost
- **Backend API & Swagger Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js**: v18+ and `npm`
- **Python**: v3.8+ (v3.11 recommended)
- **Database**: SQLite (default zero-config out of the box) or PostgreSQL

### 2. Backend Setup
```bash
cd backend

# Initialize virtual environment
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations / start server
uvicorn app.main:app --reload --port 8000
```

The database tables are automatically initialized on startup with SQLite (`taarvya.db`) for immediate development without external database setup. For PostgreSQL, set `DATABASE_URL` in `.env`.

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit http://localhost:5173 to explore Taarvya AI.

---

## 🧪 Running Tests

### Backend Test Suite (Pytest)
```bash
cd backend
.\.venv\Scripts\pytest -o cache_dir=.pytest_cache
```
*Tests cover:*
- Astronomical constants (27 Nakshatras, 12 Rashis, 9 Vimshottari planetary periods = 120 years).
- Exact birth chart calculation (Planetary longitudes, Lagna, Nakshatras, whole sign houses).
- Unknown birth time handling (graceful noon interpolation with transparent user disclosure).
- Argon2 password hashing security & JWT token lifecycle.
- Deterministic bilingual fallback reports (English and Kannada) when AI key is omitted.
- Health check and root endpoints.

### Frontend Test Suite (Vitest)
```bash
cd frontend
npx vitest run
```
*Tests cover:*
- Full English and Kannada key parity (every English string has an equivalent Kannada translation).
- Non-empty localization validation.
- Branding and tagline fidelity.

---

## 🔒 Security & Privacy Practices

- **Password Hashing**: Uses OWASP-recommended **Argon2id** algorithm.
- **Authentication**: Stateless signed **JWT access tokens** with secure HTTP-only cookies for token refresh.
- **Data Ownership**: Strict tenant and user ownership authorization filters on all profile and report endpoints.
- **GDPR / DPDP Compliance**: Complete user data export (`GET /api/v1/reports/export`) and irreversible account deletion (`DELETE /api/v1/auth/account`).
- **AI Key Isolation**: OpenAI API keys are kept strictly on the backend. The application operates with complete fallback interpretations if no AI key is configured.
- **Responsible Astrology**: Mandatory, prominent cultural reflection disclaimers; no deterministic life, medical, or financial predictions.

---

## 📄 License & Attribution

- **Application Code**: MIT License.
- **Swiss Ephemeris**: Dual-licensed under AGPL v3 / Commercial. Refer to [astro.com/swisseph](https://www.astro.com/swisseph/swephprg.htm).

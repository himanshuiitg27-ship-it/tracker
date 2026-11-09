# 🌸 Bloom - Menstrual Health & Period Tracker

A modern, mobile-first period tracker with a lavender / blush / cream design.
No login: it's a single-user app, and **every record is saved in PostgreSQL (Neon)** - nothing lives only in React state or `localStorage`.

| Layer    | Tech                                      |
| -------- | ----------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS 4, Framer Motion, Recharts |
| Backend  | Python 3.11+, FastAPI                     |
| Database | Neon PostgreSQL via SQLAlchemy 2          |

## Features

- **Period logging** - start/end dates (end can be added later while a period is ongoing), notes, edit and delete. New periods are always *added*; old records are never overwritten.
- **Calendar** - past periods (rose), estimated upcoming periods (dashed lavender), estimated ovulation, symptom-logged days. Tap a day for details, edit/delete, or to log.
- **Dashboard** - last period start, current cycle day, average cycle length, estimated next period (with countdown / "late" state), total periods logged, cycle phase.
- **Mood & symptoms** - flow intensity, mood, cramps (0-5), energy (1-5), notes; one log per day (re-saving a day updates it).
- **Health & hygiene** - hygiene, nutrition, hydration, self-care and "when to see a doctor" guidance.
- **History & analytics** - all periods (newest/oldest first), cycle-length line chart with average line, period-length chart, shortest/longest/average stats.
- Everything refreshes from the database after each add / edit / delete, and is loaded from the API every time the app opens.

### Validation (server-side, with friendly messages)

- Start/end dates can't be in the future; end can't be before start
- Periods longer than 15 days are rejected as probable typos (`MAX_PERIOD_LENGTH`)
- **Duplicate start dates are rejected** (also enforced by a DB unique constraint)
- Overlapping periods are rejected; only the most recent period may be "ongoing"

### How predictions work

- *Cycle length* = days between consecutive period **start** dates.
- *Average cycle length* = mean of your most recent 6 cycles (needs 2+ periods; until then a default of 28 days is used and labelled as such).
- *Next period* = last start + average cycle length; the next 3 are shown on the calendar. *Ovulation* is estimated as 14 days before the next period.
- These are estimates only - not medical advice or contraception guidance.

## Project structure

```
period-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, error handlers
│   │   ├── config.py          # env-based settings
│   │   ├── database.py        # SQLAlchemy engine/session (Neon-friendly pooling)
│   │   ├── models.py          # Period, SymptomLog
│   │   ├── schemas.py         # Pydantic models + validation
│   │   ├── routers/           # periods, symptoms, stats
│   │   └── services/          # validation rules, cycle statistics
│   ├── tests/test_api.py      # API tests (run against PostgreSQL)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/             # Dashboard, Calendar, Symptoms, History, Tips
    │   ├── components/        # Modal, PeriodModal, stat cards, toasts
    │   ├── context/DataContext.jsx   # loads + refreshes all data from the API
    │   └── lib/               # api client, date helpers, content
    └── .env.example
```

## Setup

### 1. Create the Neon database

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Open **Connect** in the dashboard and copy the connection string, e.g.
   `postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env                 # then paste your Neon string into DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

Tables are created automatically on startup (`create_all` never drops or alters existing data).
Check it: <http://localhost:8000/api/health> - interactive API docs: <http://localhost:8000/docs>

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                          # http://localhost:5173
```

In development Vite proxies `/api` to `http://localhost:8000`, so no extra config is needed.

### Production

- Frontend: `npm run build` → deploy `frontend/dist` to any static host. Set `VITE_API_URL=https://your-api-host` **before** building.
- Backend: run `uvicorn app.main:app --host 0.0.0.0 --port $PORT` on your host, set `DATABASE_URL` and set `CORS_ORIGINS` to your frontend's URL.
- ⚠️ There is **no authentication** by design: anyone who can reach the API can read and change the data. Keep the deployment private (or put it behind your host's access control) if the data is sensitive.

## Environment variables

`backend/.env`

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string (`postgres://` / `postgresql://` both accepted) |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `DEFAULT_CYCLE_LENGTH` / `DEFAULT_PERIOD_LENGTH` | Fallbacks before enough data exists (28 / 5) |
| `MAX_PERIOD_LENGTH` | Reject periods longer than this many days (15) |

`frontend/.env` - `VITE_API_URL` (production API URL), `VITE_DEV_API_TARGET` (dev proxy target).

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/periods` | All periods, oldest first (with `duration_days`, `cycle_length`) |
| POST | `/api/periods` | Add a period (409 on duplicate/overlap, 422 on invalid dates) |
| PUT | `/api/periods/{id}` | Edit a period |
| DELETE | `/api/periods/{id}` | Delete a period |
| GET | `/api/stats?today=YYYY-MM-DD` | Dashboard stats, predictions, per-cycle lengths |
| GET | `/api/symptoms` | Daily logs, newest first |
| PUT | `/api/symptoms` | Create/update the log for a date |
| DELETE | `/api/symptoms/{id}` | Delete a log |
| GET | `/api/health` | DB connectivity check |

## Tests

The API tests run against whatever `DATABASE_URL` points at and **drop/recreate the tables**, so use a scratch database (e.g. a separate Neon branch), never your real one:

```bash
cd backend
DATABASE_URL="postgresql://user:pass@host/scratch_db?sslmode=require" pytest -q
```

## Disclaimer

Bloom is for tracking and general wellbeing information only. It is not medical advice, and predictions are estimates. Please consult a healthcare professional about any health concerns.

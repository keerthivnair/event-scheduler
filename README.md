# Slot It - Professional Scheduler 🚀

A high-performance, full-stack scheduling and booking web application built for seamless meeting management. Optimized for productivity with a premium, responsive feel.

## ✨ Latest Features
- **Smart Rescheduling**: One-click reschedule that automatically notifies invitees.
- **IST & Timezone Detection**: Automatically detects user's timezone and defaults to IST (Kolkata) for the host.
- **Admin Feedback System**: Reply directly to invitee questions from the dashboard with automated email logs.
- **Date Overrides**: Precision control over your calendar with holiday blocking and custom hours.
- **Mobile First**: Fully responsive layout optimized for iPhone, Tablet, and Desktop.
- **Premium UI**: Vanila CSS custom design with smooth transitions and glassmorphism elements.

## 🛠 Tech Stack
- **Frontend**: React (Vite), Custom Vanilla CSS.
- **Backend**: Python (FastAPI).
- **Database**: SQLite (SQLAlchemy ORM - DB agnostic).

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt  # Or install fastapi uvicorn sqlalchemy
python seed.py
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📦 Deployment
This app is ready for CI/CD. To deploy:
1. Push to your Git repository.
2. Connect to **Vercel** (Frontend) and **Render** (Backend).
3. Set `VITE_API_URL` to your backend URL in Vercel environment variables.

### 💾 Persistent Database (Crucial for Production)
By default, the app uses **SQLite**, which is a local file. On platforms like Render or Fly.io, the filesystem is **ephemeral** (wiped on every restart/deploy). To keep your event types and bookings permanently:

1. Create a free PostgreSQL database (e.g., on [Supabase](https://supabase.com) or [Neon](https://neon.tech)).
2. Copy your **External Database URL**.
3. In your **Render Dashboard**, go to **Environment Variables**.
4. Add a new variable: `DATABASE_URL` and paste your connection string.
5. The app will automatically detect this and switch from SQLite to PostgreSQL.

Enjoy your seamless scheduling!

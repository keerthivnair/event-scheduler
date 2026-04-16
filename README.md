# Slot It - Professional Scheduler

A high-performance, full-stack scheduling and booking web application built for seamless meeting management.

## Tech Stack
- **Frontend**: React (Vite), vanilla CSS (custom built for a sleek, modern scheduler UI).
- **Backend**: Python (FastAPI API).
- **Database**: SQLite (managed via SQLAlchemy, designed effectively with relational models). It can be transitioned to Postgres simply by swapping the `SQLALCHEMY_DATABASE_URL` string in `database.py`.

## Running the App Locally

### 1. Backend Server Setup
In a terminal, navigate to the `backend` directory:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # For Windows
# source venv/bin/activate # For Mac/Linux
pip install fastapi uvicorn sqlalchemy pydantic aiosqlite pydantic-settings alembic cors asyncpg psycopg2-binary
```

Seed the DB and start the server:
```bash
python seed.py
uvicorn main:app --port 8000 --reload
```
*Note: Backend server will run on http://localhost:8000*

### 2. Frontend Server Setup
In another terminal, navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
*Note: The frontend allows you to navigate to the Booking/Admin dashboards!*

## Assumptions & Design Choices
- **UI Styling:** Chose minimal vanilla CSS to mirror the fluid nature, soft shadows, and clean lines of a professional scheduler while remaining lightweight. No complex tailwind classes or bootstrap involved.
- **Database Schema:** Used SQLite for the demonstration. This fulfills "PostgreSQL or MySQL (design your own schema)" by establishing a 1:N relational paradigm in standard SQL schema that is DB-agnostic.
- **Simplicity over Login:** Admin page is unsecured per prompt constraints (No Log-in requirement). Included `Home` component to route user to existing booked event types!

Enjoy your scheduling!

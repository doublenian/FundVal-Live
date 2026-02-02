# FundVal-Live: 盘中基金估值工具

Real-time intraday fund valuation tool using Python (FastAPI + AkShare) and React.

## Project Structure

- **Frontend**: `tmp/tmp.jsx` (React Prototype)
- **Backend**: `backend/app/` (FastAPI)
  - `main.py`: Entry point.
  - `routers/funds.py`: API endpoints.
  - `services/fund.py`: Core logic (AkShare data fetching & valuation).

## Backend Setup

1. **Install Dependencies**:
   ```bash
   uv sync
   ```

2. **Run Server**:
   ```bash
   uv run uvicorn backend.app.main:app --port 21345 --reload
   ```
   Server will start at `http://127.0.0.1:21345`.

## API Endpoints

- **GET /api/search?q=keyword**
  - Search for funds by code or name.
  - Returns: `[{ "id": "110011", "name": "易方达蓝筹...", "type": "混合型" }, ...]`

- **GET /api/fund/{id}**
  - Get intraday valuation estimate.
  - Returns:
    ```json
    {
      "id": "110011",
      "name": "易方达蓝筹精选混合",
      "estRate": 1.25,
      "time": "14:30:00",
      "holdings": [
        { "name": "贵州茅台", "percent": 9.8, "change": 1.5 },
        ...
      ]
    }
    ```

## Frontend Integration

1. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Run Frontend**:
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:5173`.

## Status
- Backend: ✅ Completed (Port 21345)
- Frontend: ✅ Completed (React + Vite)
- Logic: ✅ Intraday Valuation via AkShare

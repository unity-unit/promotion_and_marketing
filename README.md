# SwiftWheels Enterprises — PMS (National Practical Exam 2026)

This project includes:
- **MySQL** database: `PMS`
- **Backend**: Node.js + Express (session-based authentication)
- **Frontend**: React (CRUD + search + report)

## Run (after installing dependencies)

### Backend
1. Configure `.env` in `backend/`
2. Start MySQL
3. Import `backend/sql/pms.sql`
4. `cd backend && npm install && npm start`

### Frontend
1. `cd frontend && npm install && npm start`

## Notes
- Default roles: `USER` only.
- Users are registered via the UI.
- Report logic uses rule **B** from the prompt.


# CineSpark 3.0

CineSpark 3.0 is a full-stack technical competition platform with a React frontend, Express API, OAuth-style team/admin authentication, event timing, question sets, leaderboard logic, and Docker support.

## Project structure

```text
cinespark3.0/
├── client/                # React + Vite frontend
├── server/                # Express + MongoDB backend
├── .github/               # Optional deployment workflow
├── .gitignore
├── .env.example           # Root environment template
├── docker-compose.yml     # Local Docker setup
├── package.json           # Root workspace scripts
├── README.md
├── start.bat              # Windows launcher for local dev
├── CineSpark_Project_Brief.html
├── CineSpark_Project_Brief_Advanced.html
└── CineSpark_Project_Brief_Advanced.pdf
```

## Technologies

- Frontend: React, Vite, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB + Mongoose
- Deployment: Docker + GitHub Actions

## Quick start

### 1) Install dependencies

```bash
npm install --prefix client
npm install --prefix server
```

### 2) Set environment files

Copy the example files and update values as needed:

```bash
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Example values:

```env
# root .env
MONGODB_URI=mongodb://127.0.0.1:27017/cinespark
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000/api
```

### 3) Run locally

Frontend:

```bash
cd client
npm run dev
```

Backend:

```bash
cd server
npm run dev
```

Or use the Windows launcher:

```bat
start.bat
```

The app will typically run at:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Production / Docker

```bash
docker compose up --build
```

## Notes

- Keep `start.bat` in the repo; it is useful for local startup.
- Do not commit real `.env` files.
- Remove generated files such as `node_modules`, build output, and local `.env` files before pushing to GitHub.

## Deployment

This repo includes a GitHub Actions workflow for deploying to AWS EC2. You can reuse or replace it after creating a fresh GitHub repository.

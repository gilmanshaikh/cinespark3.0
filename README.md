<<<<<<< HEAD
# cinespark3.0
Full-stack MERN web application containerized with Docker and automatically deployed to AWS EC2 using GitHub Actions CI/CD.
=======
# CineSpark 3.0

CineSpark 3.0 is a gamified technical competition where teams solve technical questions, earn and spend CineCoins, decode binary clues into words, and eventually construct a final sentence that becomes their filmmaking challenge.

CineSpark 3.0 is a working technical competition platform. Teams register, wait for an admin launch, solve a ten-question technical story set, spend CineCoins, decode binary clues, and assemble a meaningful ten-word sentence.

## Project Architecture

```
cinespark-3.0/
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── services/
│       ├── hooks/
│       └── utils/
├── server/          # Node.js + Express API
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
├── README.md
└── .gitignore
```

- **client** — UI and routing. Talks to the API through an Axios instance.
- **server** — REST API, database connection, and shared middleware. Controllers, models, and routes are separated so later features can be added without restructuring.

## Technologies

| Layer | Stack |
| --- | --- |
| Frontend | React, Vite, JavaScript, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Tooling | npm, dotenv, Git |

## Install Dependencies

From the project root:

```bash
cd client
npm install

cd ../server
npm install
```

## Configure Environment Variables

### Backend

Copy the example file and edit values as needed:

```bash
cd server
cp .env.example .env
```

`server/.env.example`:

```
PORT=5000
MONGODB_URI=
CLIENT_URL=http://localhost:5173
```

Leave `MONGODB_URI` empty during local setup if you do not have MongoDB yet. When ready, set a valid URI such as `mongodb://127.0.0.1:27017/cinespark` or a MongoDB Atlas `mongodb+srv://...` string. The server starts even if MongoDB is unavailable; connection errors are logged clearly.

**MongoDB Atlas tip:** In Atlas, click **Connect → Drivers**, copy the connection string, replace `<password>` with your database user password, and paste it as the value of `MONGODB_URI` in `server/.env` (one line, no quotes). If your password contains special characters like `@`, `#`, or `:`, URL-encode them first.

### Frontend

```bash
cd client
cp .env.example .env
```

`client/.env.example`:

```
VITE_API_URL=http://localhost:5000/api
```

Never commit `.env` files. Never put MongoDB credentials or other backend secrets in the React app.

## Start the Frontend

```bash
cd client
npm run dev
```

The app is available at [http://localhost:5173](http://localhost:5173).

## Start the Backend

```bash
cd server
npm run dev
```

Or without nodemon:

```bash
cd server
npm start
```

The API listens on port `5000` by default.

## Test `/api/health`

With the backend running:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "CineSpark 3.0 API is running"
}
```

The landing page also calls this endpoint and shows the connection status.

## Current Features

Included:

- Team registration and login
- Admin authentication and event controls
- Waiting room with rules and a protected 60-minute launch
- Twenty seeded story sets with 200 technical questions
- Automatic per-team set assignment and overflow set generation
- CineCoin rewards, penalties, hints, skips, and transaction history
- Binary clue decoding and ten-word story completion
- Fullscreen test mode and server-enforced anti-cheat disqualification
- Admin question-set editor, team search, leaderboard, and team reinstatement

## Seed the Question Library

The seed script replaces the current question library with 20 complete sets (200 questions):

```bash
cd server
node src/utils/seedQuestions.js
```

Run it only when you intend to reset the question library.
>>>>>>> 99460dd (Initial commit)

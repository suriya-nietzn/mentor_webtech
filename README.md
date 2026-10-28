# MentorConnect – Student Mentorship Portal

MentorConnect is a full-stack web application that connects college students with mentors (faculty, alumni and professionals). Students find mentors, send mentorship requests, schedule sessions and exchange messages. Mentors review requests, manage students and sessions, and keep a public profile.

**Tech stack**

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS (plain CSS files with CSS variables), JavaScript, React 18, Vite 7, React Router 6, Axios, lucide-react icons, react-hot-toast |
| Backend | Node.js, Express 4, Mongoose 8, bcryptjs, jsonwebtoken, express-validator, helmet, cors, express-rate-limit, express-mongo-sanitize, cookie-parser, morgan, dotenv |
| Database | MongoDB (local install or MongoDB Atlas free tier) |
| Dev tools | nodemon, concurrently |

---

## 1. Prerequisites

Install these first:

1. **Node.js LTS** (version 20 or 22): https://nodejs.org. Check with `node -v` (needs 20.19 or newer) and `npm -v`.
2. **Git**: https://git-scm.com
3. **VS Code** (recommended editor): https://code.visualstudio.com
4. **MongoDB**, either:
   - **MongoDB Atlas** (free cloud database, nothing to install; see below), or
   - **MongoDB Community Server** installed locally: https://www.mongodb.com/try/download/community. On Windows, tick "Install MongoDB as a Service" so it starts automatically.

### Setting up MongoDB Atlas (free)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Click **Create** → choose the **M0 Free** cluster → pick a region near you → **Create Deployment**.
3. In the pop-up, create a **database user** (username + password). Write the password down. Avoid `@`, `:` or `/` in it, or URL-encode them.
4. Under **Network Access**, click **Add IP Address** → **Add Current IP Address** (or `0.0.0.0/0` for "allow from anywhere", fine for a demo).
5. Go to **Database → Connect → Drivers**. Copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. Replace `<user>` and `<password>`, and add the database name `mentorconnect` before the `?`:
   `mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/mentorconnect?retryWrites=true&w=majority`
7. Put that string in `server/.env` as `MONGO_URI` (next section).

---

## 2. Create the `.env` file

The backend needs one file you create yourself: **`server/.env`**. Copy the template:

```bash
# Windows (PowerShell)
Copy-Item server/.env.example server/.env
# macOS / Linux / Git Bash
cp server/.env.example server/.env
```

Then open `server/.env` and fill in:

| Variable | Required | What it is |
|---|---|---|
| `PORT` | no (default 5000) | Port the Express API listens on. |
| `NODE_ENV` | no | `development` locally. `production` makes the login cookie HTTPS-only (`secure`). |
| `MONGO_URI` | **yes** | MongoDB connection string. Local: `mongodb://127.0.0.1:27017/mentorconnect`. Atlas: the `mongodb+srv://...` string from above. |
| `JWT_SECRET` | **yes** | Long random secret used to sign login tokens. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and paste it in. |
| `JWT_EXPIRES_IN` | no (default `7d`) | How long a login stays valid. |
| `CLIENT_URL` | no (default `http://localhost:5173`) | Frontend address(es) allowed by CORS, comma-separated. |
| `AUTH_RATE_LIMIT_MAX` | no (default 10) | Failed login/register attempts allowed per IP per 15 minutes. Only raise it temporarily for automated tests. |

If `MONGO_URI` or `JWT_SECRET` is missing, the server stops immediately with a clear message telling you which one.

The frontend needs **no** `.env` for local development. `client/.env.example` documents two optional settings (`VITE_PROXY_TARGET`, `VITE_API_URL`) that matter only if you change ports or deploy the backend separately.

`.env` files are listed in `.gitignore` and must never be committed.

---

## 3. Install, seed and run

Run all commands from the project root folder (the one with this README).

```bash
npm run install-all   # installs root, server and client dependencies
npm run seed          # loads demo mentors, students, requests, sessions and messages
npm run dev           # starts backend (port 5000) and frontend (port 5173) together
```

Open **http://localhost:5173** in your browser.

Other ways to run:

| Command | What it does |
|---|---|
| `npm run dev` (root) | Backend + frontend together (via `concurrently`). |
| `npm run dev --prefix server` | Backend only, auto-restarts on code changes (nodemon). |
| `npm run dev --prefix client` | Frontend only (Vite dev server). |
| `npm run seed` (root) | Re-seeds demo data. Safe to run again: it deletes only demo records (`isSample: true`) and anything linked to them. Your own accounts are kept. |
| `npm run build` (root) | Production build of the frontend into `client/dist`. |
| `npm start` (root) | Runs the backend without auto-restart. |

### How the frontend talks to the backend

During development, Vite **proxies** every request to `/api/...` to `http://localhost:5000`. The browser only ever talks to `localhost:5173`, so the login cookie is a normal same-site cookie and no cross-origin cookie configuration is needed. The backend still has a CORS allowlist (`CLIENT_URL`) as an extra safety layer.

---

## 4. Demo accounts (demo only)

After `npm run seed`, these **fictional** accounts exist. Every one uses the password **`Demo@12345`**.

| Role | Email | Notes |
|---|---|---|
| Student | `student1@example.com` | Aisha. Has an accepted mentorship with Karthik (mentor2), a pending request, an upcoming session and messages. |
| Student | `student2@example.com` | Rohan. Has one accepted and one declined request. |
| Student | `student3@example.com` | Nila. Has a completed mentorship (with a review) and a pending request. |
| Student | `student4@example.com` | Kavya. Cybersecurity; a completed, reviewed mentorship and a pending higher-studies request. |
| Student | `student5@example.com` | Aditya. Cloud & security; an accepted mentorship with sessions, two reviews given, a pending request. |
| Student | `student6@example.com` | Sneha. AI/ML; an upcoming session, a completed mentorship **without a review yet** (try leaving one), a declined request. |
| Student | `student7@example.com` | Harish. Mechanical student moving to software; two reviews given, one declined request. |
| Student | `student8@example.com` | Lakshmi. First year; accepted mentorship with an upcoming and a cancelled session, a pending request. |
| Mentor | `mentor2@example.com` | Karthik Menon. Has an active student, sessions and messages. |
| Mentor | `mentor1@example.com` ... `mentor10@example.com` | 10 mentors across 6 departments. `mentor8` (Sanjay) is "not accepting students". |

All names are invented and all emails use `example.com`. Sample mentors show a **"Demo data"** badge. Do not use these accounts for anything real.

---

## 5. How to test each workflow

**Registration**
1. Click **Register**. Try submitting the empty form: inline errors appear under each field.
2. Type a weak password (e.g. `abc`) and a different confirmation: you see the password rule and "Passwords do not match".
3. Register with `student1@example.com`: you see "An account with this email already exists".
4. Register a new student: you land on the **student dashboard**. Log out, then register as a mentor (or use **Become a Mentor** on the home page): you land on the **mentor dashboard**.

**Login and logout**
1. Log in with a wrong password: you see "Invalid email or password". The same message appears for an unknown email, on purpose.
2. Log in with `student1@example.com` / `Demo@12345`. Click **Logout**, then open `http://localhost:5173/student/dashboard`: you are sent to the login page.
3. While logged out, open `/student/sessions`, then log in: you are taken back to `/student/sessions`.
4. As a student, open `/mentor/dashboard`: you are redirected to your own dashboard.

**Mentor search**
1. Go to **Find Mentors**. Type `python` in the search box: results update after you stop typing, and the URL changes to `?search=python`.
2. Combine **Skill**, **Department**, **Category** and **Sort by**. Copy the URL into a new tab: the same filters load.
3. Search for something nonsensical: you see "No mentors match your filters" and a **Clear filters** button.

**Mentorship requests**
1. As a new student, open a mentor profile and click **Request Mentorship**. Try sending with short goals: you see the 20-character rule. Choose a category, write your goals and send.
2. The profile now shows "Your request is waiting...". Trying to request the same mentor again is blocked.
3. Log in as that mentor → **Student Requests** → **Accept** (optionally add a note).
4. Log back in as the student → **My Mentorships**: the request shows **Accepted** with the mentor's note.

**Sessions and messages**
1. On an accepted mentorship, click **Schedule session**. A past date or an invalid link (e.g. `abc`) is rejected.
2. Open the session from **My Sessions** to see details, edit/reschedule it, or cancel it. Cancelled sessions cannot be edited.
3. Open **Messages**, choose the conversation and send a message (Enter sends, Shift+Enter adds a new line). The other user sees it within 10 seconds.

**Profiles, contact and availability**
1. Edit **My Profile**, save, then refresh the page: the changes persist.
2. As a mentor, use **Availability** to switch off "Accepting new students": students can no longer send you requests.
3. Send a message through **Contact**. Stop the backend and try again: a clear error and a **Retry** button appear, never a fake success.

---

## 6. API reference

All responses have the shape `{ success, message?, data?, errors?: [{ field, message }] }`.
Status codes used: 200, 201, 400 (validation), 401 (not logged in), 403 (wrong role / not allowed), 404, 409 (conflict / invalid state change), 413, 429 (rate limited), 500, 503 (database unavailable).

"Auth" means a valid login cookie is required.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/health` | Public | API and database status (503 if the DB is down). |
| POST | `/api/auth/register` | Public, rate-limited | Create a student or mentor account and log in. |
| POST | `/api/auth/login` | Public, rate-limited | Log in; sets the httpOnly cookie. |
| POST | `/api/auth/logout` | Public | Clears the login cookie. |
| GET | `/api/auth/me` | Auth | Current user + profile completion %. |
| PUT | `/api/auth/password` | Auth | Change password (needs current password). |
| GET | `/api/mentors` | Public | List mentors. Query: `search`, `skill`, `department`, `category`, `sort=name\|experience`, `order=asc\|desc`, `page`, `limit`. |
| GET | `/api/mentors/filters` | Public | Skill and department options for the filters. |
| GET | `/api/mentors/:id` | Public (extra info for students) | Public profile, real reviews, students mentored; the student's active request status. |
| PUT | `/api/mentors/profile` | Mentor | Update own mentor profile (whitelisted fields only). |
| GET | `/api/students/profile` | Student | Own profile + completion %. |
| PUT | `/api/students/profile` | Student | Update own profile (whitelisted fields only). |
| POST | `/api/requests` | Student | Send a mentorship request. |
| GET | `/api/requests/my` | Auth | Requests sent (student) or received (mentor). Optional `?status=`. |
| PATCH | `/api/requests/:id/accept` | Mentor (own requests) | pending → accepted. |
| PATCH | `/api/requests/:id/reject` | Mentor (own requests) | pending → rejected. |
| PATCH | `/api/requests/:id/complete` | Mentor (own requests) | accepted → completed (cancels future sessions). |
| POST | `/api/requests/:id/review` | Student (own, completed) | One 1-5 star rating + comment. |
| POST | `/api/sessions` | Participant of an accepted request | Schedule a session. |
| GET | `/api/sessions/my` | Auth | `{ upcoming, past }` for the current user. |
| GET | `/api/sessions/:id` | Participants only | Session details. |
| PUT | `/api/sessions/:id` | Participants only | Edit / reschedule; mentor can set `status: "completed"` after the start time. |
| DELETE | `/api/sessions/:id` | Participants only | Cancel (record kept as `cancelled`). |
| GET | `/api/messages/conversations` | Auth | Connected people, last message, unread counts. |
| GET | `/api/messages/:userId` | Connected users only | Conversation thread; marks their messages as read. |
| POST | `/api/messages` | Connected users only | Send a message (max 1000 characters). |
| GET | `/api/dashboard/student` | Student | Counts, upcoming sessions, requests, recommendations, recently viewed. |
| GET | `/api/dashboard/mentor` | Mentor | Counts, pending/accepted requests, upcoming sessions, rating, recent activity. |
| POST | `/api/contact` | Public, rate-limited | Save a contact-form message. |
| GET | `/api/stats/public` | Public | Real counts for the home page. |

### Business rules enforced by the server
- Only students create requests, only to existing mentors who are accepting students. Only one *active* (pending/accepted) request per student-mentor pair, enforced by the app **and** by a partial unique index in MongoDB.
- Request states: `pending → accepted → completed`, or `pending → rejected`. Anything else returns **409**. A rejected or completed request does not block a new one.
- **Sessions (design choice):** either participant of an accepted mentorship can create, edit/reschedule or cancel a session. Only the mentor can mark it completed, and only after its start time. Cancelled and completed sessions are locked.
- Messages are allowed only between users who share an accepted or completed mentorship.
- Users who are not participants get **404** for other people's requests and sessions, so record IDs cannot be probed.
- Profile updates accept only whitelisted fields. `role`, `email` and the password hash cannot be changed through profile endpoints.

---

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| **`Port 5000 is already in use`** (or 5173) | Another program is using the port. Close the other terminal running the app, or change `PORT` in `server/.env` (then also set `VITE_PROXY_TARGET` in `client/.env`). On Windows, find the process with `netstat -ano \| findstr :5000`, then `taskkill /PID <pid> /F`. |
| **`MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017`** | Local MongoDB is not running. Windows: open *Services* and start "MongoDB Server", or run `net start MongoDB` as administrator. Or switch to Atlas. The API keeps retrying every 5 seconds and connects as soon as MongoDB is up. |
| Atlas: `bad auth` / `authentication failed` | Wrong username/password in `MONGO_URI`, or special characters in the password that are not URL-encoded. |
| Atlas: connection times out | Your IP is not allowed. Atlas → Network Access → add your current IP. |
| **`Missing required environment variable(s): JWT_SECRET`** | `server/.env` does not exist or the value is empty. See section 2. |
| **CORS error** in the browser console | Open the app at `http://localhost:5173` (not `127.0.0.1:5173`, which is a different origin), or add that origin to `CLIENT_URL`. |
| **Login works but you are immediately logged out / cookie not set** | Use the Vite address `http://localhost:5173`, not the API port directly. Do not set `NODE_ENV=production` locally (that makes the cookie HTTPS-only). Make sure the browser is not blocking cookies for localhost. |
| "Too many attempts. Please wait 15 minutes" | The login rate limit (10 failed attempts per 15 min) was hit. Wait, or restart the backend (the counter is kept in memory). |
| **Blank white page** | Open the browser console (F12). Usually the frontend dev server is not running (`npm run dev`), or dependencies are missing (`npm run install-all`). Hard-refresh with Ctrl+Shift+R. |
| Home page says "We cannot reach the server" | The backend is not running, or MongoDB is down. Check the backend terminal and `http://localhost:5000/api/health`. |
| No mentors shown | Run `npm run seed`. |
| `npm run install-all` fails on an old Node version | Vite 7 needs Node 20.19+ or 22.12+. Update Node.js LTS. |

---

## 8. Project structure

```
student-mentorship-portal/        (this folder)
├── package.json        root scripts: install-all, dev (concurrently), seed, build
├── README.md           this guide
├── VIVA_NOTES.md       architecture and viva Q&A
├── server/
│   ├── server.js       starts Express and connects to MongoDB
│   ├── app.js          middleware chain (helmet, CORS, JSON limit, sanitize) and routes
│   ├── config/         env.js (loads and checks .env), db.js (connect + retry)
│   ├── models/         Mongoose schemas: User, MentorshipRequest, Session, Message, ContactMessage
│   ├── controllers/    request handlers containing the business rules
│   ├── routes/         URL → middleware → controller mapping
│   ├── middleware/     auth (JWT cookie, roles), validation, rate limits, errors, DB check
│   ├── validators/     express-validator rules and input cleaning
│   ├── utils/          constants, response helpers, token helpers, query helpers
│   └── seed/           demo data and the idempotent seed script
└── client/
    ├── index.html      the single HTML page React renders into
    ├── vite.config.js  dev server + /api proxy
    └── src/
        ├── main.jsx            app entry (router, auth provider, toasts)
        ├── App.jsx             all routes, lazy-loaded pages, route guards
        ├── styles/             variables.css (design tokens), base.css, components.css
        ├── context/            AuthContext (who is logged in)
        ├── hooks/              useFetch, useDebounce, useDocumentTitle
        ├── services/           axios instance + one module per API resource
        ├── utils/              validators, formatters, constants
        ├── layouts/            PublicLayout, DashboardLayout (+ CSS)
        ├── components/
        │   ├── ui/             Button, Avatar, Badge, Modal, form fields, states, pagination...
        │   ├── layout/         Navbar, Footer, Logo, route guards, error boundary, hero SVG
        │   ├── mentors/        MentorCard, RequestMentorshipModal, How-it-works steps
        │   ├── dashboard/      RequestCard, SessionRow, dashboard widgets
        │   └── forms/          session, respond and review dialogs
        └── pages/
            ├── public/         Home, FindMentors, MentorProfile, HowItWorks, About, Contact, Login, Register, NotFound
            ├── student/        StudentDashboard, StudentMentorships, StudentProfile
            ├── mentor/         MentorDashboard, MentorProfileEdit, MentorRequests, MentorStudents, MentorAvailability
            └── shared/         Sessions, SessionDetails, Messages, Settings (used by both roles)
```

### Notes on choices that differ slightly from the original brief
- **Plain CSS instead of Tailwind:** the frontend uses only HTML, CSS and JavaScript with React, as requested. Design tokens are CSS custom properties in `client/src/styles/variables.css`.
- **Vite 7** (not 5): Vite 5 has published security advisories for the dev server on Windows.
- **React Router 6.30** stays on v6 as specified. Its open-redirect advisory is mitigated: the app only follows "return to" paths that pass `safeRedirectPath()` (must start with one `/`, no backslashes). The SSR advisory does not apply because there is no server-side rendering.
- **Extra routes:** `/mentor/messages` (mentors also need to message students), plus `GET /api/mentors/filters`, `PUT /api/auth/password` and `POST /api/requests/:id/review`.
- **Text input safety:** HTML tags are stripped and text is trimmed on the server. Output is not HTML-escaped on input, because React escapes everything it renders (escaping twice would show `&amp;` in the UI).
- **Auth rate limit** counts only failed login/register attempts, so normal users are never locked out. `GET /api/auth/me` is not limited because every page load calls it.

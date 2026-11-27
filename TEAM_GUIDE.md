# 📘 ConnectX – Team Guide (start here)

This guide tells each of the 4 members **which files are theirs**, **how to run the project**, and **the exact Git steps** to put your work on GitHub from your own account.

> **Important – read your own code.** The project is complete and tested, but GitHub only shows *your* contribution if you commit it from *your* account – and in a viva, interview or demo you will be asked to explain *your* part. So: run the app, read each of your files top to bottom (they are heavily commented), and be able to explain the "Learn / explain" points in your section below. The "Extra tasks" give each of you real improvements to add under your own name.

---

## 1. Words you will see

| Word | Meaning |
|---|---|
| **Repository (repo)** | The project folder stored on GitHub |
| **Branch** | Your own copy of the code where you work without breaking others. `main` = final, `develop` = everyone's work together, `feature/...` = your task |
| **Commit** | A saved snapshot with a message ("Add login page") |
| **Push** | Upload your commits to GitHub |
| **Pull Request (PR)** | A request: "please merge my branch into `develop`". A teammate reviews and clicks *Merge* |
| **Clone** | Download the repo to your computer |

---

## 2. Who owns which files

Every file also has a `// Owner: Member X` comment on its first line.

### 👤 Member 1 – Frontend (Deepak) · `client/src/`
| Branch | Files |
|---|---|
| `feature/login-register` | `services/api.js` · `context/AuthContext.jsx` · `context/ThemeContext.jsx` · `components/AuthLayout.jsx` · `pages/Login.jsx` · `pages/Register.jsx` · `main.jsx` · `App.jsx` |
| `feature/chat-ui` | `pages/Chat.jsx` · `components/Sidebar.jsx` · `ChatWindow.jsx` · `MessageBubble.jsx` · `MessageInput.jsx` · `Avatar.jsx` · `Modal.jsx` · `UserSearchList.jsx` · `NewGroupModal.jsx` · `ProfileModal.jsx` · `utils/format.js` |
| `feature/responsive-design` | `index.css` (layout, dark/light theme, mobile) |

**Learn / explain:** React components & props · `useState`/`useEffect` · Context API (why auth lives in a context) · React Router + protected routes · how `fetch` + JWT in the `Authorization` header works · CSS variables for dark mode · media queries for mobile.
**Extra tasks:** show a "message sent" sound · add link detection in messages · add a "scroll to bottom" button · add image preview before sending.

### 👤 Member 2 – Backend · `server/`
| Branch | Files |
|---|---|
| `feature/auth-api` | `utils/token.js` · `middleware/auth.js` · `controllers/authController.js` · `routes/authRoutes.js` |
| `feature/user-api` | `controllers/userController.js` · `routes/userRoutes.js` |
| `feature/message-api` | `server.js` · `controllers/conversationController.js` · `messageController.js` · `uploadController.js` · `routes/conversationRoutes.js` · `routes/uploadRoutes.js` · `middleware/upload.js` · `tests/e2e.mjs` |

**Learn / explain:** Express routes → controllers → models · what a JWT is and why we verify it · bcrypt hashing · middleware · multer uploads and why only some file types are allowed · rate limiting · CORS · running `npm test`.
**Extra tasks:** add `PUT /api/auth/password` (change password) · add input-validation tests · add a `/api/conversations/:id/members` endpoint.

### 👤 Member 3 – Database · `database/` + `server/models/`
| Branch | Files |
|---|---|
| `feature/database-schema` | `database/schema.sql` · `server/config/db.js` · `server/config/initDb.js` |
| `feature/chat-models` | `server/models/userModel.js` · `server/models/conversationModel.js` |
| `feature/query-optimization` | `server/models/messageModel.js` (pagination + status queries) |

**Learn / explain:** the 6 tables and their relationships (draw the ER diagram!) · primary & foreign keys · `ON DELETE CASCADE` · indexes (`idx_messages_conv`) and why chat history uses *cursor pagination* (`WHERE id < $before`) instead of `OFFSET` · transactions (`BEGIN/COMMIT`) when creating groups · why messages are *soft-deleted* · SQL injection and why we always use `$1, $2` parameters.
**Extra tasks:** run `EXPLAIN ANALYZE` on the conversation-list query and write your findings in `database/NOTES.md` · add a `database/seed.sql` with demo users · draw the ER diagram into `docs/`.

### 👤 Member 4 – Real-Time · `server/sockets/` + client chat state
| Branch | Files |
|---|---|
| `feature/socket-connection` | `server/sockets/index.js` · `client/src/services/socket.js` |
| `feature/online-status` | `server/sockets/presence.js` |
| `feature/group-chat` | `server/sockets/messageHandlers.js` · `client/src/context/ChatContext.jsx` · `client/src/hooks/useChat.js` |

**Learn / explain:** HTTP vs WebSocket · Socket.IO *rooms* (`user:<id>`, `conv:<id>`) · JWT check in the handshake · acknowledgements (callbacks) · why a user with 2 tabs is only offline when the *last* tab closes · how ✓ / ✓✓ / blue ✓✓ are calculated · why we wait for `socket.ready` · how `ChatContext` merges live events with loaded history.
**Extra tasks:** "last message seen by" list in groups · "user joined/left" system messages · sound on new message · reconnect banner.

---

## 3. Run the project on your computer (everyone)

1. Install **Node.js 18+** (nodejs.org) and **PostgreSQL** (postgresql.org – remember the password you set for the `postgres` user).
2. Clone the repo (section 4) and open a terminal in the `ConnectX-Real-Time-Chat-App` folder.
3. Run:

```bash
npm run install:all
psql -U postgres -c "CREATE DATABASE connectx;"
cp server/.env.example server/.env        # Windows: copy server\.env.example server\.env
```

4. Open `server/.env` and set:
   - `DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/connectx`
   - `JWT_SECRET=` any long random text (never share it, never commit `.env`)
5. Create the tables and start everything:

```bash
npm run db:init
npm run dev
```

6. Open **http://localhost:5173**. Use two browsers (or a normal + a private window) to chat with yourself.

**Problems?**
| Message | Fix |
|---|---|
| `password authentication failed` | wrong password in `DATABASE_URL` |
| `database "connectx" does not exist` | run the `CREATE DATABASE` command |
| `Missing JWT_SECRET or DATABASE_URL` | you did not create `server/.env` |
| Port 5000/5173 already in use | close the other program, or change `PORT` in `.env` |
| Login works but chat is empty/offline | server is not running – check the terminal |

---

## 4. Git & GitHub – step by step

### Step A – Deepak creates the repo (once)
1. github.com → **New repository** → name `ConnectX-Real-Time-Chat-App` → *Public* → don't add a README → Create.
2. **Settings → Collaborators → Add people** → add the 3 teammates (they accept the email invite).
3. Unzip the project. In that folder, push **only the shared starter files** (project setup, no feature code yet):

```bash
git init -b main
git add package.json package-lock.json .gitignore README.md TEAM_GUIDE.md docs \
        client/package.json client/package-lock.json client/vite.config.js client/vercel.json client/index.html client/.env.example \
        server/package.json server/package-lock.json server/.env.example server/uploads/.gitkeep
git commit -m "chore: project setup, README and team guide"
git remote add origin https://github.com/USERNAME/ConnectX-Real-Time-Chat-App.git
git push -u origin main
git checkout -b develop
git push -u origin develop
```

(replace `USERNAME`; if Git asks you to log in, use a *Personal Access Token* as the password, or GitHub Desktop.)

### Step B – every member clones and makes a branch
```bash
git clone https://github.com/USERNAME/ConnectX-Real-Time-Chat-App.git
cd ConnectX-Real-Time-Chat-App
git checkout develop
git checkout -b feature/<your-first-branch>      # names are in section 2
```
Set your **own** identity once, so commits show your avatar:
```bash
git config user.name  "Your Name"
git config user.email "the-email-of-your-GitHub-account"
```

### Step C – add your files, commit, push, open a Pull Request
Copy **your** files from the unzipped project into the same paths in your clone. Then, for each branch of yours (in order):

```bash
git add <the files of that branch>               # e.g. git add database/schema.sql server/config
git commit -m "feat(db): add users, conversations and messages tables"
git push -u origin feature/database-schema
```
On GitHub click **Compare & pull request** → base: **develop** → *Create pull request*. **A teammate (not you) reviews and clicks Merge.** Then start the next branch:

```bash
git checkout develop && git pull
git checkout -b feature/chat-models
```
Good commit messages: `feat: …` (new thing) · `fix: …` · `docs: …` · `style: …`. Make **several small commits** per branch (e.g. one per file) instead of one huge one.

### Step D – suggested merge order (so each PR can run)
1. **Member 3** `database-schema` → `chat-models` → `query-optimization`
2. **Member 2** `auth-api` → `user-api` → `message-api`
3. **Member 4** `socket-connection` → `online-status` → `group-chat`
4. **Member 1** `login-register` → `chat-ui` → `responsive-design`

(Work in parallel; just merge in this order. After each merge everybody runs `git checkout develop && git pull`.)

### Step E – finish
When all branches are merged: open a PR **develop → main**, merge it, then add screenshots of *your own* running app to `docs/screenshots/`, fix the team table (names + GitHub links) in `README.md`, and replace `USERNAME` in the contributors badge.

---

## 5. How the pieces talk to each other

```
React (Member 1)
  │  REST (fetch + JWT)            ─►  Express routes/controllers (Member 2) ─► models/SQL (Member 3) ─► PostgreSQL
  │  Socket.IO (ChatContext, M4)   ─►  sockets/* (Member 4) ──────────────────► models/SQL (Member 3)
```

- **Loading data** (chat list, history, search, upload) → REST.
- **Live things** (send, edit, delete, typing, read, presence) → Socket.IO.
- Members 2/3/4 meet in two places: controllers call `models/*` (M3), and `conversationController` calls `addToConversation()` from `sockets/index.js` (M4) so new chats appear instantly.
- Member 1 only ever uses the `useChat()` hook and `services/api.js` – he never touches the socket directly.

If you change an API response or a socket event, **tell the others** and update the tables in `README.md`.

---

## 6. Weekly plan (5 weeks)

| Week | Goal |
|---|---|
| 1 | Setup, GitHub, run the app, read your files, draw ER diagram (M3), commit `database-schema` + `auth-api` |
| 2 | Auth + login/register UI working end-to-end; profile page |
| 3 | Real-time messaging; typing; presence |
| 4 | Groups, files, notifications, your *Extra tasks* |
| 5 | Testing (`npm test`), bug fixing, deployment, README screenshots, demo rehearsal |

## 7. Demo script (3 minutes)
Register two users in two windows → search & start a chat → typing indicator → send → ticks turn blue → close one window → "last seen" → create a group of 3 → send an image → edit/delete a message → dark mode → shrink the window to show mobile layout.

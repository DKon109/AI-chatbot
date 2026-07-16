# MedAI Pro

Full-stack healthcare portfolio application with separate patient and doctor experiences, structured symptom analysis, patient record management, and AI-assisted health guidance.

> **Portfolio status:** deployment configuration is ready. The public demo URL will be added after the first cloud deployment.

## Product overview

MedAI Pro explores how a role-based healthcare assistant can combine conversational guidance with structured clinical workflows. Patients can record symptoms and receive safety-focused guidance, while doctors can manage fictional patient records and review supporting information from a dedicated dashboard.

All included portfolio data is fictional. This project is an educational software demonstration and does not provide medical diagnosis or replace professional medical care.

## Highlights

- Patient and doctor registration/login with JWT authentication
- Role-based protected routes and dashboards
- Structured symptom collection and severity-aware responses
- Patient record CRUD workflows for doctors
- Chat history, dietary recommendations, pharmacy search, and hospital search
- PostgreSQL persistence with parameterized queries and connection pooling
- Repeatable database migrations and deterministic portfolio seed data
- Dockerized production build serving React and Express from one service
- Render Free and Railway deployment configuration with automatic migrations and health checks

## Architecture

```mermaid
flowchart LR
    U["Portfolio visitor"] --> W["React 19 + TypeScript"]
    W -->|"/api"| A["Node.js + Express"]
    A --> D[("PostgreSQL")]
    A --> S["AI and healthcare services"]
```

The production container builds the React frontend and serves it from Express. This provides one public origin, avoids cross-origin setup for normal production traffic, and keeps deployment easy to review.

## Technology

| Area | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Axios, Lucide React |
| Backend | Node.js, Express, JWT, bcrypt, Helmet, express-validator |
| Data | PostgreSQL, SQL migrations, UUID primary keys |
| AI workflow | Multi-agent services, structured symptom analysis, optional OpenAI integration |
| Delivery | Docker, Render/Railway config-as-code, health checks |

## Demo accounts

Running `npm run db:seed` creates two fictional, idempotent accounts:

| Role | Email | Password |
| --- | --- | --- |
| Patient | `demo.patient@example.com` | `PortfolioDemo!2026` |
| Doctor | `demo.doctor@example.com` | `PortfolioDemo!2026` |

Set `DEMO_PASSWORD` before seeding to use a different demo password.

## Local setup

Requirements:

- Node.js 22+
- PostgreSQL 12+

```bash
git clone https://github.com/DKon109/AI-chatbot.git
cd AI-chatbot/medical-ai-enhanced

cp backend/env.example backend/.env
# Add your local PostgreSQL password and a random JWT_SECRET to backend/.env

./setup-database.sh

cd backend && npm start
# In another terminal:
cd frontend && npm install && npm start
```

The frontend runs at `http://localhost:3000`; the API defaults to `http://localhost:5001`.

### Database commands

From `medical-ai-enhanced/backend`:

```bash
npm run db:create   # create the local database when it does not exist
npm run db:migrate  # apply all schemas safely
npm run db:seed     # add deterministic fictional portfolio data
npm run db:init     # run all three steps
```

Hosted PostgreSQL providers should set `DATABASE_URL`. Local development can use the individual `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` variables shown in [`env.example`](medical-ai-enhanced/backend/env.example).

## Railway deployment

The repository includes [`Dockerfile`](Dockerfile) and [`railway.json`](railway.json). Railway builds both applications, runs migrations and demo seeding before deployment, then checks `/api/status` before marking the release healthy.

1. Create a Railway project from this GitHub repository.
2. Add a PostgreSQL service.
3. Reference the PostgreSQL service's `DATABASE_URL` from the application service.
4. Set `JWT_SECRET` to a random value of at least 32 characters.
5. Set `DB_SSL=true`, `NODE_ENV=production`, and optionally `DEMO_PASSWORD`.
6. Generate a public domain for the application service.

Railway pricing and free allowances can change; review the current plan before deployment. The Docker image is portable to other container hosts, and the database only requires a standard PostgreSQL connection URL.

## Free portfolio deployment (Render + Supabase)

The repository includes [`render.yaml`](render.yaml), which creates a Render web service with the Free instance type explicitly selected. Supabase supplies the free hosted PostgreSQL database.

1. Create a Supabase Free project and keep its generated database password private.
2. In Render, create a new Blueprint from this repository.
3. Enter only the Supabase database password in Render's `DB_PASSWORD` prompt. Do not commit it or post it in an issue/chat.
4. Confirm that the service plan is **Free**, then deploy.

The container runs the idempotent migrations and fictional demo seed before starting the server. Render generates `JWT_SECRET` automatically. No OpenAI or Google Maps key is required for the core portfolio demo.

Render Free services can sleep after a period without traffic, so the first request after inactivity can take about a minute. Free-tier terms and limits can change; confirm the provider dashboards still show **Free / $0** before deployment.

## Security decisions

- `.env` files, dependencies, generated model files, logs, and runtime feedback are excluded from Git.
- Passwords are hashed with bcrypt and never returned by API responses.
- SQL calls use parameterized queries.
- Authentication endpoints validate input and protected endpoints verify JWTs.
- Helmet, CORS allowlisting, and rate limiting are enabled.
- Secrets are supplied through environment variables rather than source control.

If a secret was committed in an earlier revision, it must be rotated even after the file is removed from the latest revision.

## Repository structure

```text
.
├── Dockerfile
├── render.yaml
├── railway.json
└── medical-ai-enhanced
    ├── backend
    │   ├── agents
    │   ├── controllers
    │   ├── database
    │   ├── routes
    │   ├── scripts
    │   └── services
    └── frontend
        ├── public
        └── src
```

## Current limitations

- AI provider features require a separately configured API key; deterministic local analysis remains available without one.
- Location-based pharmacy and hospital functionality depends on external map/search services.
- The application is a portfolio prototype and has not undergone clinical validation or production compliance certification.

## API health check

```bash
curl http://localhost:5001/api/status
```

A healthy service returns a JSON response with `status: "success"`.

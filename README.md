# MedAI Pro — Secure Healthcare Workflow Prototype

[![CI](https://github.com/DKon109/AI-chatbot/actions/workflows/ci.yml/badge.svg)](https://github.com/DKon109/AI-chatbot/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-00684a)](https://medai-pro-instant-demo.onrender.com/)

A secure full-stack healthcare workflow prototype demonstrating role-based access, AI-assisted symptom intake, deterministic safety guidance, clinician review, patient record management, and repeatable PostgreSQL delivery.

> **[Open Live Demo](https://medai-pro-instant-demo.onrender.com/)** · **[View GitHub](https://github.com/DKon109/AI-chatbot)**
>
> The landing page is served as a free static site and opens immediately. Interactive login and analysis use a separate Render Free API, which can take up to 60 seconds to wake after inactivity. The page starts waking it in the background as soon as a visitor arrives.

![MedAI Pro patient and doctor portal landing page](docs/medai-pro-home.jpg)

## Product overview

MedAI Pro explores how secure role-based software can support structured healthcare workflows. Patients can record symptoms and receive safety-focused next-step guidance, while doctors can manage fictional patient records and document supporting instructions from a dedicated dashboard.

All included portfolio data is fictional. This project is an educational software demonstration and does not provide medical diagnosis or replace professional medical care.

### What “AI-enhanced” means here

Patients can describe a concern in natural language. When a Gemini API key is configured, the backend uses the [Gemini Interactions API with Structured Outputs](https://ai.google.dev/gemini-api/docs/structured-output) and a strict JSON Schema to extract symptoms, duration, severity, missing information, and a clinician-facing draft. The default model is the stable, Free-Tier-eligible `gemini-3.1-flash-lite`. The model is explicitly prevented from diagnosing, prescribing, or deciding urgency.

Safety remains a separate deterministic layer: fixed, testable rules inspect the original patient text and can override the draft with an immediate-action message. Every submission enters the Doctor Portal as `pending`; a clinician must approve it or request changes. The UI identifies whether a result came from live structured AI or the transparent free portfolio fallback.

If `GEMINI_API_KEY` is absent, recruiters can still exercise the complete intake, safety, persistence, and human-review workflow with fictional examples through the deterministic portfolio fallback. Adding a Gemini Free Tier key activates real structured model extraction without changing the safety or review architecture. Provider requests are stateless (`store: false`) and do not include a patient account ID.

```mermaid
flowchart LR
    P["Patient free text"] --> X["Gemini structured extraction<br/>or free demo fallback"]
    P --> G["Deterministic safety guardrails"]
    X --> D["Clinician draft"]
    G --> D
    D --> R{"Doctor review"}
    R -->|Approve| A["Clinician-approved record"]
    R -->|Needs changes| C["Correction requested"]
```

## Highlights

- Patient and doctor registration/login with JWT authentication
- Role-based protected routes and dashboards
- Structured symptom collection and deterministic, severity-aware responses
- Natural-language intake with strict structured output and provider-independent fallback
- Human-in-the-loop Doctor Portal queue with approve / needs-changes audit state
- Deterministic emergency guardrails that do not delegate urgency to a language model
- Patient record CRUD workflows for doctors
- Chat history, dietary recommendations, pharmacy search, and hospital search
- PostgreSQL persistence with parameterized queries and connection pooling
- Repeatable database migrations and deterministic portfolio seed data
- Dockerized full-stack production build for portable deployment
- Instant-loading Render Static Site with a separate Free API, automatic migrations, and health checks

## Architecture

```mermaid
flowchart LR
    U["Portfolio visitor"] --> W["React 19 + TypeScript<br/>Render Static Site / CDN"]
    W -->|"HTTPS API calls<br/>background wake-up"| A["Node.js + Express<br/>Render Free Web Service"]
    A --> D[("PostgreSQL")]
    A --> S["Gemini structured extraction<br/>Deterministic safety + fallback"]
```

The recruiter-facing frontend is deployed as a static site, so the first screen does not depend on a sleeping server. It immediately sends a background health request to the Free API. Interactive requests allow enough time for a normal cold start and show a clear startup message instead of a generic network error. The Docker image still contains the combined frontend and API as a portable fallback.

## Technology

| Area | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Axios, Lucide React |
| Backend | Node.js, Express, JWT, bcrypt, Helmet, express-validator |
| Data | PostgreSQL, SQL migrations, UUID primary keys |
| Decision support | Gemini Interactions API + Structured Outputs, deterministic safety guardrails, clinician review, free fallback |
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

### Optional live AI mode

The complete workflow works without a model provider. To activate live structured extraction locally, set these only in `backend/.env` or a hosting provider's secret settings:

```bash
GEMINI_API_KEY=your_private_key
GEMINI_MODEL=gemini-3.1-flash-lite
```

Never expose the key through a `VITE_` variable, commit it, or paste it into the application UI. Model requests use `store: false`; the included demo accounts and examples are fictional. Gemini Free Tier inputs may be used to improve Google products, so do not use this portfolio prototype for real patient or protected health information.

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

The repository includes [`render.yaml`](render.yaml), which creates two services while keeping the instance configuration free:

- `medai-pro-instant-demo`: static React site served from Render's CDN; it does not have a server process that spins down.
- `medai-pro-portfolio`: Free Express API connected to the Supabase Free PostgreSQL database; it can spin down after inactivity.

1. Create a Supabase Free project and keep its generated database password private.
2. In Render, create a new Blueprint from this repository.
3. Enter only the Supabase database password in Render's `DB_PASSWORD` prompt. Do not commit it or post it in an issue/chat.
4. Confirm that the service plan is **Free**, then deploy.
5. To enable live AI, create a key in a Gemini API Free Tier project, then add it only to the `medai-pro-portfolio` service as a secret environment variable named `GEMINI_API_KEY`.
6. Keep `GEMINI_MODEL=gemini-3.1-flash-lite`, save the environment settings, and redeploy.

The API container starts accepting health requests before running its idempotent migrations and fictional demo seed in the background. Render generates `JWT_SECRET` automatically. No Gemini or Google Maps key is required for the core portfolio demo. The Blueprint intentionally does not contain a provider key. A Gemini key is added manually in Render so it never appears in GitHub.

The static landing page remains immediately available even when the API is asleep. The UI starts waking the API during the visitor's first read and clearly explains that the first interactive action can take up to 60 seconds. Free-tier terms and usage allowances can change; confirm the provider dashboards still show **Free / $0** before deployment.

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

- The application uses Gemini structured extraction when `GEMINI_API_KEY` is configured and a clearly labelled deterministic fallback otherwise. Free Tier quotas and terms can change, and requests fall back safely when a quota or provider error occurs.
- Deterministic guidance is educational decision support, not a clinically validated diagnostic system.
- AI output is always a draft and has not been clinically validated; human review is mandatory by design.
- Location-based pharmacy and hospital functionality depends on external map/search services.
- The application is a portfolio prototype and has not undergone clinical validation or production compliance certification.

## API health check

```bash
curl http://localhost:5001/api/status
```

A healthy service returns a JSON response with `status: "success"`.

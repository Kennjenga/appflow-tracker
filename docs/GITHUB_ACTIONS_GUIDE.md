# From Code to Cloud: A Beginner's Guide to CI/CD with GitHub Actions

> **Follow along with a real project.**
> AppFlow Tracker is an open-source Django + React application. Every code snippet and workflow file in this article is live and working in the repository. You can run the app right now — no setup required.

---

## Table of Contents

1. [Run the App First](#1-run-the-app-first)
2. [What Is GitHub Actions?](#2-what-is-github-actions)
3. [Four Concepts You Must Know](#3-four-concepts-you-must-know)
4. [Workflow 1 — PR Tests (CI)](#4-workflow-1--pr-tests-ci)
5. [Workflow 2 — Docker Hub Publish (CD)](#5-workflow-2--docker-hub-publish-cd)
6. [Secrets — Never Hardcode Passwords](#6-secrets--never-hardcode-passwords)
7. [Caching — Making Pipelines Fast](#7-caching--making-pipelines-fast)
8. [The Full Picture](#8-the-full-picture)

---

## 1. Run the App First

Before we talk about automation, let's get the app running. You have two options.

### Option A — Pull the Docker images (fastest, no code needed)

You need [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

```bash
# 1. Pull both images from Docker Hub
docker pull kennjenga/appflow-tracker-backend:latest
docker pull kennjenga/appflow-tracker-frontend:latest
```

Then create a `docker-compose.yml` file anywhere on your machine:

```yaml
services:
  backend:
    image: kennjenga/appflow-tracker-backend:latest
    environment:
      SECRET_KEY: local-demo-only
      DEBUG: "True"
      ALLOWED_HOSTS: localhost,127.0.0.1
      CORS_ALLOWED_ORIGINS: http://localhost,http://127.0.0.1
      DJANGO_DB_PATH: /app/db/db.sqlite3
    volumes:
      - sqlite_data:/app/db
    expose:
      - "8000"

  frontend:
    image: kennjenga/appflow-tracker-frontend:latest
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  sqlite_data:
```

```bash
# 2. Start the app
docker compose up

# 3. Open your browser
#    App:       http://localhost
#    API docs:  http://localhost/api/v1/docs
#    Admin:     http://localhost/admin
```

---

### Option B — Clone the repository and run locally

```bash
# 1. Clone
git clone https://github.com/Kennjenga/appflow-tracker.git
cd appflow-tracker

# 2. Copy the Docker env file
cp .env.docker.example .env.docker

# 3. Build and start (first run downloads base images + installs deps)
docker compose up --build

# 4. Create an admin user (first run only)
docker compose exec backend python manage.py createsuperuser
```

Same URLs apply: `http://localhost` for the app, `http://localhost/admin` for the Django admin.

> **What just happened?**
> Docker Compose built two containers from the source code — one running Django via Gunicorn, one running the built React app via Nginx — and connected them on a private network. The GitHub Actions workflows we're about to study are what **built those Docker images** and pushed them to Docker Hub automatically.

---

## 2. What Is GitHub Actions?

GitHub Actions is an automation platform **built directly into GitHub**. You write a YAML file, put it in a special folder in your repository, and GitHub automatically runs it whenever something happens — a push, a pull request, a schedule, or a manual button click.

No extra accounts. No separate CI/CD server. It's already there.

### Where the files live

```
your-project/
├── src/
├── tests/
└── .github/
    └── workflows/
        ├── pr-tests.yml          ← runs on every Pull Request
        └── docker-publish.yml    ← runs on every push to master
```

That's it. Two YAML files = two fully automated pipelines.

### Why use it over alternatives?

| Feature | GitHub Actions | Jenkins | CircleCI |
|---|---|---|---|
| Setup | Zero — it's built in | Needs its own server | Separate account |
| Free tier | Generous (2,000 min/month) | Self-hosted cost | Limited |
| Marketplace | 20,000+ pre-built actions | Plugin ecosystem | Orbs |
| Logs | Live, in GitHub UI | Separate UI | Separate UI |

---

## 3. Four Concepts You Must Know

Everything in GitHub Actions is built from four building blocks.

```
EVENT  →  WORKFLOW  →  JOB  →  STEP
```

### Event — The trigger

An event is what kicks the workflow off. You choose which events to listen for.

```yaml
on:
  push:               # Code was pushed to the repo
    branches:
      - master

  pull_request:       # A PR was opened or updated
    branches:
      - master
      - staging

  schedule:           # Runs on a timer (cron syntax)
    - cron: '0 2 * * *'   # Every day at 2 AM UTC

  workflow_dispatch:  # Manual "Run workflow" button in GitHub UI
```

### Workflow — The script

One YAML file = one workflow. A workflow contains one or more jobs. You can have as many workflow files as you need.

### Job — A group of steps

Each job runs on its own fresh virtual machine (called a **Runner**). Jobs run **in parallel by default**. Use `needs:` to chain them sequentially.

```yaml
jobs:
  test:
    runs-on: ubuntu-latest   # Fresh Ubuntu VM
    steps: [...]

  build:
    runs-on: ubuntu-latest
    needs: test              # Only runs if 'test' passes
    steps: [...]

  deploy:
    runs-on: ubuntu-latest
    needs: build             # Only runs if 'build' passes
    steps: [...]
```

### Step — A single task

A step is one unit of work inside a job. It's either a shell command (`run:`) or a pre-built action from the Marketplace (`uses:`).

```yaml
steps:
  # Pre-built action — downloads your repository code
  - name: Checkout code
    uses: actions/checkout@v4

  # Shell command — installs Python packages
  - name: Install dependencies
    run: pip install -r requirements.txt

  # Shell command with environment variables
  - name: Run tests
    run: pytest
    env:
      SECRET_KEY: ${{ secrets.SECRET_KEY }}
```

---

## 4. Workflow 1 — PR Tests (CI)

**File:** `.github/workflows/pr-tests.yml`

**Purpose:** Every time a developer opens or updates a Pull Request targeting `master` or `staging`, this pipeline automatically runs the full test suite. If any test fails, the PR is blocked from merging.

This is **Continuous Integration (CI)** — automatically validating every code change before it touches a protected branch.

### The full file

```yaml
# ════════════════════════════════════════════════════════════════════════════
#  CI Pipeline — Runs on every Pull Request targeting master or staging
#
#  What this pipeline does:
#    Job 1 (backend-tests)  → Install Python deps → Run pytest
#    Job 2 (frontend-tests) → Install Node deps  → Run Vitest → Vite build
#
#  Both jobs run in PARALLEL (no `needs:` between them).
#  The PR is only considered green when BOTH jobs pass. ✅
# ════════════════════════════════════════════════════════════════════════════

name: PR Tests

# ── TRIGGER ─────────────────────────────────────────────────────────────────
#  This workflow fires whenever a Pull Request is:
#    • opened       — brand new PR
#    • synchronize  — new commit pushed to an existing PR
#    • reopened     — a closed PR is re-opened
#
#  It runs for PRs targeting EITHER master or staging.
# ─────────────────────────────────────────────────────────────────────────────
on:
  pull_request:
    branches:
      - master
      - staging

# ── JOBS ─────────────────────────────────────────────────────────────────────
jobs:

  # ┌─────────────────────────────────────────────────────────────────────────┐
  # │  JOB 1 · Backend Tests                                                  │
  # │  Runs Django / pytest on an Ubuntu virtual machine.                     │
  # └─────────────────────────────────────────────────────────────────────────┘
  backend-tests:
    name: 🐍 Backend — pytest
    runs-on: ubuntu-latest   # Fresh Ubuntu VM, wiped after each run

    # Change into the backend folder for every step in this job
    defaults:
      run:
        working-directory: backend

    steps:
      # ── Step 1 ──────────────────────────────────────────────────────────
      # Download the repository code onto the runner.
      # Without this step, the VM has no access to your files.
      - name: Checkout repository
        uses: actions/checkout@v4

      # ── Step 2 ──────────────────────────────────────────────────────────
      # Install Python 3.12 on the runner VM.
      # The `with:` block passes the version as a parameter to the Action.
      - name: Set up Python 3.12
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      # ── Step 3 ──────────────────────────────────────────────────────────
      # Cache pip packages so we don't re-download them on every PR run.
      # The cache key includes the hash of requirements.txt — if the file
      # changes, the cache is invalidated and packages are re-downloaded.
      - name: Cache pip dependencies
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: pip-${{ runner.os }}-${{ hashFiles('backend/requirements.txt') }}
          restore-keys: |
            pip-${{ runner.os }}-

      # ── Step 4 ──────────────────────────────────────────────────────────
      # Install all Python packages listed in requirements.txt.
      # `run:` executes a shell command directly on the runner.
      - name: Install dependencies
        run: pip install -r requirements.txt

      # ── Step 5 ──────────────────────────────────────────────────────────
      # Run the Django system check — catches configuration errors fast,
      # before we even run tests.
      - name: Django system check
        run: python manage.py check
        env:
          SECRET_KEY: ci-only-not-a-real-secret
          DEBUG: "True"

      # ── Step 6 ──────────────────────────────────────────────────────────
      # Run the full pytest suite.
      # --tb=short  → shorter tracebacks (easier to read in CI logs)
      # -v          → verbose output (shows each test name)
      - name: Run pytest
        run: pytest --tb=short -v
        env:
          SECRET_KEY: ci-only-not-a-real-secret
          DEBUG: "True"


  # ┌─────────────────────────────────────────────────────────────────────────┐
  # │  JOB 2 · Frontend Tests                                                 │
  # │  Runs Vitest + a production build check on an Ubuntu virtual machine.   │
  # └─────────────────────────────────────────────────────────────────────────┘
  frontend-tests:
    name: ⚛️ Frontend — Vitest + Build
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: frontend

    steps:
      # ── Step 1 ──────────────────────────────────────────────────────────
      - name: Checkout repository
        uses: actions/checkout@v4

      # ── Step 2 ──────────────────────────────────────────────────────────
      # Install Node.js 20 on the runner.
      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # ── Step 3 ──────────────────────────────────────────────────────────
      # Cache node_modules so npm ci doesn't re-download packages every run.
      # The cache key uses the hash of package-lock.json — exact dependency
      # versions are locked, so this cache is very stable.
      - name: Cache node_modules
        uses: actions/cache@v4
        with:
          path: frontend/node_modules
          key: node-${{ runner.os }}-${{ hashFiles('frontend/package-lock.json') }}
          restore-keys: |
            node-${{ runner.os }}-

      # ── Step 4 ──────────────────────────────────────────────────────────
      # `npm ci` is the CI-safe version of `npm install`.
      # It installs exact versions from package-lock.json and errors if
      # the lockfile is out of sync — preventing surprise dependency changes.
      - name: Install dependencies
        run: npm ci

      # ── Step 5 ──────────────────────────────────────────────────────────
      # Run the Vitest unit test suite.
      - name: Run Vitest tests
        run: npm run test

      # ── Step 6 ──────────────────────────────────────────────────────────
      # Attempt a production build with Vite.
      # This catches TypeScript errors, missing imports, and broken assets
      # that might not surface in unit tests alone.
      - name: Production build check
        run: npm run build
        env:
          VITE_API_BASE_URL: http://localhost:8000/api/v1
```

### How this protects your repository

```
Developer opens a PR → master or staging
             ↓
   [Event: pull_request fires]
             ↓
  ┌───────────────────┐   ┌───────────────────────┐
  │ 🐍 backend-tests  │   │ ⚛️  frontend-tests     │  ← run in PARALLEL
  │                   │   │                       │
  │ 1. Checkout code  │   │ 1. Checkout code       │
  │ 2. Setup Python   │   │ 2. Setup Node 20       │
  │ 3. Cache pip      │   │ 3. Cache node_modules  │
  │ 4. pip install    │   │ 4. npm ci              │
  │ 5. Django check   │   │ 5. npm run test        │
  │ 6. pytest         │   │ 6. npm run build       │
  └────────┬──────────┘   └──────────┬────────────┘
           │   both must pass ✅      │
           └──────────┬──────────────┘
                      ↓
           PR gets a green checkmark
           → team can safely merge
```

If either job fails, the PR shows a red ❌ and GitHub can be configured to block the merge entirely.

### Key concepts demonstrated

| Concept | Where in the file |
|---|---|
| `on: pull_request: branches:` | Lines 22–26 — the trigger |
| Two jobs in parallel | `backend-tests` and `frontend-tests` have no `needs:` |
| `defaults: run: working-directory:` | Avoids repeating `cd backend` in every step |
| `uses:` — pre-built actions | `actions/checkout@v4`, `actions/setup-python@v5`, `actions/cache@v4` |
| `run:` — shell commands | `pip install`, `pytest`, `npm ci`, `npm run test` |
| `env:` — safe env vars per step | `SECRET_KEY`, `DEBUG`, `VITE_API_BASE_URL` |
| Dependency caching | `hashFiles()` creates a smart cache key |

---

## 5. Workflow 2 — Docker Hub Publish (CD)

**File:** `.github/workflows/docker-publish.yml`

**Purpose:** Every time code is merged into `master`, this pipeline builds Docker images for the backend and frontend, and automatically pushes them to Docker Hub. This is how the images in **Section 1** of this article got there.

This is **Continuous Deployment (CD)** — automatically shipping a new version to users after every passing merge.

### The full file

```yaml
name: Build & Push to Docker Hub

on:
  push:
    branches:
      - master
  # Also allow manual trigger from GitHub UI
  workflow_dispatch:

# ── Global environment variables ─────────────────────────────────────────────
# Defined here once so we don't repeat image names in every job.
env:
  REGISTRY: docker.io
  BACKEND_IMAGE: kennjenga/appflow-tracker-backend
  FRONTEND_IMAGE: kennjenga/appflow-tracker-frontend

jobs:
  # ── Build & push backend ────────────────────────────────────────────────────
  build-backend:
    name: Backend — Build & Push
    runs-on: ubuntu-latest
    permissions:
      contents: read   # Only needs read access to the repo

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      # Docker Buildx enables multi-platform builds (amd64 + arm64)
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # Log in to Docker Hub using secrets (never hardcode credentials!)
      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      # Generate smart image tags automatically:
      #   :latest          → always points to the newest build on master
      #   :sha-a1b2c3d     → immutable tag tied to the exact commit
      - name: Extract metadata (tags & labels)
        id: meta-backend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.BACKEND_IMAGE }}
          tags: |
            type=raw,value=latest,enable={{is_default_branch}}
            type=sha,prefix=sha-,format=short

      # Build the image from ./backend/Dockerfile and push to Docker Hub
      - name: Build and push backend image
        uses: docker/build-push-action@v6
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ${{ steps.meta-backend.outputs.tags }}
          labels: ${{ steps.meta-backend.outputs.labels }}
          # Reuse cached layers from previous runs — speeds up builds
          cache-from: type=gha,scope=backend
          cache-to: type=gha,mode=max,scope=backend
          # Build for both Intel/AMD servers AND Apple Silicon / ARM servers
          platforms: linux/amd64,linux/arm64

  # ── Build & push frontend ───────────────────────────────────────────────────
  build-frontend:
    name: Frontend — Build & Push
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract metadata (tags & labels)
        id: meta-frontend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.FRONTEND_IMAGE }}
          tags: |
            type=raw,value=latest,enable={{is_default_branch}}
            type=sha,prefix=sha-,format=short

      - name: Build and push frontend image
        uses: docker/build-push-action@v6
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: true
          tags: ${{ steps.meta-frontend.outputs.tags }}
          labels: ${{ steps.meta-frontend.outputs.labels }}
          # The API URL is baked into the JS bundle at build time.
          # /api/v1 works because nginx proxies it to the backend container.
          build-args: |
            VITE_API_BASE_URL=/api/v1
          cache-from: type=gha,scope=frontend
          cache-to: type=gha,mode=max,scope=frontend
          platforms: linux/amd64,linux/arm64
```

### How the CD pipeline flows

```
Developer merges PR → master
          ↓
  [Event: push to master fires]
          ↓
  ┌──────────────────────────┐   ┌───────────────────────────┐
  │  build-backend           │   │  build-frontend           │  ← PARALLEL
  │                          │   │                           │
  │ 1. Checkout              │   │ 1. Checkout               │
  │ 2. Setup Buildx          │   │ 2. Setup Buildx           │
  │ 3. Login to Docker Hub   │   │ 3. Login to Docker Hub    │
  │ 4. Generate :latest tag  │   │ 4. Generate :latest tag   │
  │    and :sha-abc1234 tag  │   │    and :sha-abc1234 tag   │
  │ 5. Build + Push image    │   │ 5. Build + Push image     │
  └──────────────────────────┘   └───────────────────────────┘
          ↓                                   ↓
  kennjenga/appflow-tracker-backend:latest
  kennjenga/appflow-tracker-frontend:latest
  → Live on Docker Hub for anyone to pull
```

### Key concepts demonstrated

| Concept | Where in the file |
|---|---|
| `on: push: branches: [master]` | Triggers only on merges to master |
| `workflow_dispatch:` | Adds a manual "Run workflow" button in GitHub UI |
| `env:` at workflow level | Global variables shared across all jobs |
| `permissions:` | Principle of least privilege — only `contents: read` |
| `id:` on a step | Captures output from one step to use in a later step |
| `${{ steps.meta-backend.outputs.tags }}` | Step output reference |
| `${{ env.BACKEND_IMAGE }}` | Global env var reference |
| `platforms: linux/amd64,linux/arm64` | Multi-platform image build |
| `cache-from/cache-to: type=gha` | GitHub Actions layer cache for Docker |

---

## 6. Secrets — Never Hardcode Passwords

Notice this pattern in the CD workflow:

```yaml
username: ${{ secrets.DOCKERHUB_USERNAME }}
password: ${{ secrets.DOCKERHUB_TOKEN }}
```

**Secrets** are encrypted key-value pairs stored in GitHub — never in your code. Even if your repository is public, secrets are never exposed.

### How to add secrets to your repository

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add your secrets:

| Secret Name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Your Docker Hub access token (not your password) |

### How to generate a Docker Hub token

1. Log in at [hub.docker.com](https://hub.docker.com)
2. Click your avatar → **My Account** → **Personal access tokens**
3. Click **Generate new token**
4. Set **Access permissions** to `Read & Write`
5. Copy the token immediately — it is only shown once

> **Security note:** GitHub masks secrets in all logs. Even if a step accidentally prints a secret, GitHub replaces it with `***` in the output.

---

## 7. Caching — Making Pipelines Fast

Without caching, every pipeline run downloads all dependencies from scratch. For a Python + Node project this can add 2–3 minutes per run. Caching cuts that to seconds on repeat runs.

```yaml
- name: Cache pip dependencies
  uses: actions/cache@v4
  with:
    path: ~/.cache/pip          # What folder to cache
    key: pip-${{ runner.os }}-${{ hashFiles('backend/requirements.txt') }}
    restore-keys: |
      pip-${{ runner.os }}-
```

### How the cache key works

```
key: pip-Linux-a3f8c2d1...
         │      │        └── MD5 hash of requirements.txt
         │      └─────────── Operating system
         └────────────────── Prefix
```

- If `requirements.txt` **has not changed** → cache hit → packages loaded instantly
- If `requirements.txt` **has changed** → cache miss → fresh install → new cache saved
- `restore-keys:` is a fallback — uses the closest old cache if the exact key does not match

Same pattern applies to Node.js:

```yaml
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: frontend/node_modules
    key: node-${{ runner.os }}-${{ hashFiles('frontend/package-lock.json') }}
```

---

## 8. The Full Picture

Here is how the two workflows together create a complete automated software delivery system:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT LIFECYCLE                         │
│                                                                  │
│  1. Developer writes code on a feature branch                   │
│                    ↓                                             │
│  2. Developer opens a Pull Request → master (or staging)        │
│                    ↓                                             │
│  ┌─────────────────────────────┐                                │
│  │   pr-tests.yml fires        │  ← CI                         │
│  │   🐍 Backend tests (pytest) │                                │
│  │   ⚛️  Frontend tests (Vitest)│                                │
│  │   ⚛️  Vite production build  │                                │
│  └──────────────┬──────────────┘                                │
│                 │                                                │
│         ✅ all pass                                              │
│                 ↓                                                │
│  3. Team reviews and approves the PR                            │
│                 ↓                                                │
│  4. PR is merged into master                                    │
│                 ↓                                                │
│  ┌─────────────────────────────┐                                │
│  │   docker-publish.yml fires  │  ← CD                         │
│  │   🐳 Build backend image    │                                │
│  │   🐳 Build frontend image   │                                │
│  │   📦 Push → Docker Hub      │                                │
│  └──────────────┬──────────────┘                                │
│                 ↓                                                │
│  5. Anyone can pull the new image                               │
│     docker pull kennjenga/appflow-tracker-backend:latest        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why this matters

| Without CI/CD | With CI/CD |
|---|---|
| Tests run manually (if at all) | Tests run on every PR automatically |
| "Works on my machine" | Identical clean environment every time |
| Manual Docker builds | Image built and published automatically |
| Deploys require SSH + commands | One merge = new version live |
| Bugs found in production | Bugs caught before merge |

---

## Quick Reference

### GitHub Actions expression syntax

```yaml
${{ secrets.MY_SECRET }}          # Encrypted secret
${{ env.MY_VAR }}                 # Workflow-level env variable
${{ github.sha }}                 # Full commit SHA
${{ github.ref }}                 # Branch/tag ref (e.g. refs/heads/master)
${{ github.actor }}               # Username who triggered the run
${{ runner.os }}                  # Runner OS (Linux, Windows, macOS)
${{ hashFiles('file.txt') }}      # MD5 hash of a file (great for cache keys)
${{ steps.my-step-id.outputs.x }} # Output from a named step
```

### Most useful pre-built actions

```yaml
uses: actions/checkout@v4              # Download repo code — always first
uses: actions/setup-python@v5         # Install Python
uses: actions/setup-node@v4           # Install Node.js
uses: actions/cache@v4                # Cache dependencies
uses: actions/upload-artifact@v4      # Save build output
uses: docker/setup-buildx-action@v3   # Docker multi-platform builds
uses: docker/login-action@v3          # Log in to a container registry
uses: docker/build-push-action@v6     # Build and push Docker image
uses: docker/metadata-action@v5       # Auto-generate image tags
```

### Common `on:` triggers

```yaml
on:
  push:
    branches: [master, staging]
  pull_request:
    branches: [master, staging]
  schedule:
    - cron: '0 2 * * 1'        # Every Monday at 2 AM
  workflow_dispatch:            # Manual run button
  release:
    types: [published]          # New GitHub Release published
```

---

*The full source code for AppFlow Tracker, including both workflow files, is available at [github.com/Kennjenga/appflow-tracker](https://github.com/Kennjenga/appflow-tracker). The Docker images are public at [hub.docker.com/u/kennjenga](https://hub.docker.com/u/kennjenga).*

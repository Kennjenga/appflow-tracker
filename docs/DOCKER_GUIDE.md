# Docker & Containerization: A Comprehensive Guide for AppFlow Tracker

> **Mastering Docker, Multi-Stage Builds, and Local Service Orchestration.**
> This guide details how the AppFlow Tracker application uses containerization, provides line-by-line breakdowns of all Dockerfiles and Compose configurations, and lists essential commands for managing your containers.

---

## Table of Contents
1. [Docker Basics: The Core Concepts](#1-docker-basics-the-core-concepts)
2. [Project Docker Architecture](#2-project-docker-architecture)
3. [Deep Dive: Backend Dockerfile & Entrypoint](#3-deep-dive-backend-dockerfile--entrypoint)
4. [Deep Dive: Frontend Dockerfile & Nginx Config](#4-deep-dive-frontend-dockerfile--nginx-config)
5. [Deep Dive: Docker Compose Orchestration](#5-deep-dive-docker-compose-orchestration)
6. [Essential Docker Command Reference](#6-essential-docker-command-reference)

---

## 1. Docker Basics: The Core Concepts

If you are new to Docker, think of it as a shipping container system for software. Before Docker, running an app required installing specific versions of Python, Node.js, libraries, and system utilities directly on your host machine. If versions clashed (e.g. your system had Python 3.8 but the app needed 3.12), things broke.

Docker solves this by packing the application and all its dependencies into an isolated environment called a **container**.

### Key Terminology

| Term | What it is | Analogy |
|---|---|---|
| **Image** | A read-only blueprint containing the application code, libraries, runtime, and environmental settings. | A blueprint or a compiled executable file. |
| **Container** | A live, runnable instance of an image. You can start, stop, edit, or delete a container. | A house built from a blueprint, or a running program in memory. |
| **Dockerfile** | A text document containing the recipe of sequential commands to assemble a Docker Image. | A build script or setup instructions. |
| **Docker Compose** | A tool for defining and running multi-container applications. It lets you run multiple services with a single command. | An orchestra conductor coordinating different instruments (containers). |
| **Volume** | A persistent folder stored on your host machine that is mounted inside the container, saving data beyond the container's lifecycle. | An external hard drive plugged into a virtual machine. |
| **Network** | A virtual network that lets containers talk to each other securely without exposing all ports to the host machine. | A private LAN switch inside your Docker host. |

---

## 2. Project Docker Architecture

AppFlow Tracker is composed of two main services that communicate with each other:

```mermaid
graph TD
    Host["Host Machine (Browser: localhost:80)"] -->|HTTP Request| Frontend[Nginx Container]
    
    subgraph AppFlow Network (appflow-network)
        Frontend -->|Proxy API Request /api/v1| Backend[Gunicorn/Django Container]
        Backend -->|Write Data| Vol[(SQLite Database Volume)]
    end
```

1. **Frontend Container (Nginx)**: Serves static compiled React files and acts as a reverse proxy, forwarding API requests starting with `/api/` to the backend.
2. **Backend Container (Gunicorn/Django)**: Runs the Django API, processes workflow rules, and writes data to an SQLite database file.
3. **SQLite Volume**: Persists the database file (`db.sqlite3`) on the host machine so your data isn't lost when containers are recreated or stopped.
4. **Bridge Network**: Allows the frontend to resolve and communicate with the backend using the hostname `http://backend:8000`.

---

## 3. Deep Dive: Backend Dockerfile & Entrypoint

The backend uses a **Multi-Stage Build**. This splits the build process into two steps: compiling dependencies in a heavy "builder" environment, and running the application in a lightweight "runtime" environment. This keeps the final image tiny and secure.

### The Dockerfile: `backend/Dockerfile`

Here is a line-by-line explanation of [backend/Dockerfile](file:///c:/Users/user/Desktop/Ken/appflow-tracker/backend/Dockerfile):

```dockerfile
# ── Stage 1: dependency builder ───────────────────────────────────────────────
# Uses a slim Python base image but names this stage "builder"
FROM python:3.12-slim AS builder

# Set the working directory where dependencies will be installed temporarily
WORKDIR /install

# Install build tools (gcc, build-essential) needed to compile certain Python wheels.
# Then delete apt cache lists to keep the builder stage as clean as possible.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Upgrade pip and install all requirements into the /install folder prefix.
# We disable the cache directory (--no-cache-dir) since we don't need it inside an image.
RUN pip install --upgrade pip \
 && pip install --prefix=/install --no-cache-dir -r requirements.txt


# ── Stage 2: runtime ──────────────────────────────────────────────────────────
# Start a fresh, clean stage using the slim Python base image. This is the final production image.
FROM python:3.12-slim AS runtime

# Set environment variables:
# PYTHONDONTWRITEBYTECODE=1: Prevents Python from writing .pyc files to disk (saves space/noise)
# PYTHONUNBUFFERED=1: Forces Python stdout and stderr to be unbuffered. 
# This ensures application logs are printed immediately to the terminal in real-time.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set the active working directory inside the container
WORKDIR /app

# Copy the pre-built, compiled Python packages from the builder stage
# into the runtime's local packages folder. 
# This skips copying compilers, gcc, and build dependencies into our final container!
COPY --from=builder /install/lib /usr/local/lib
COPY --from=builder /install/bin /usr/local/bin

# Copy our Django application source code from the host directory to the container
COPY . .

# Grant execute permissions to our startup script
RUN chmod +x entrypoint.sh

# Document that this container intends to listen on port 8000
EXPOSE 8000

# Specify the script to run when the container boots up
ENTRYPOINT ["./entrypoint.sh"]
```

### The Startup Script: `backend/entrypoint.sh`

When the backend container boots, it runs [backend/entrypoint.sh](file:///c:/Users/user/Desktop/Ken/appflow-tracker/backend/entrypoint.sh) before starting the server.

```sh
#!/bin/sh
set -e # Exit immediately if any command exits with a non-zero status

# 1. Run database migrations to make sure the SQLite database schema is up-to-date
echo "==> Running database migrations..."
python manage.py migrate --noinput

# 2. Collect Django static files (admin panel styles, rest framework UI) into a static folder
echo "==> Collecting static files..."
python manage.py collectstatic --noinput

# 3. Start Gunicorn (WSGI application server) instead of the Django development server.
# Gunicorn is designed to handle production traffic.
# 'exec' replaces the current shell process with Gunicorn, allowing it to receive OS signals (like SIGTERM for shutdown).
echo "==> Starting Gunicorn..."
exec gunicorn core.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers "${GUNICORN_WORKERS:-2}" \
  --threads "${GUNICORN_THREADS:-4}" \
  --timeout "${GUNICORN_TIMEOUT:-120}" \
  --log-level "${GUNICORN_LOG_LEVEL:-info}" \
  --access-logfile - \
  --error-logfile -
```

---

## 4. Deep Dive: Frontend Dockerfile & Nginx Config

Like the backend, the frontend uses a multi-stage build: Stage 1 installs Node.js and builds the React code into static files. Stage 2 discards Node.js completely, starting a lightweight Nginx web server to serve the built files.

### The Dockerfile: `frontend/Dockerfile`

Here is a line-by-line breakdown of [frontend/Dockerfile](file:///c:/Users/user/Desktop/Ken/appflow-tracker/frontend/Dockerfile):

```dockerfile
# ── Stage 1: build ────────────────────────────────────────────────────────────
# Start with a lightweight Node.js environment on Alpine Linux
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configs first. 
# By copying these before the rest of the source code, we use Docker's caching system.
# The heavy "npm ci" command only re-runs if package.json or package-lock.json changes.
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy the entire frontend source code into the builder container
COPY . .

# Set up build arguments. 
# The build needs to know what API URL the frontend should send requests to.
# This defaults to localhost but can be overridden at build time.
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Compile the React application into optimized static HTML, CSS, and JS files.
# The output is placed in the '/app/dist' directory.
RUN npm run build


# ── Stage 2: serve with nginx ─────────────────────────────────────────────────
# Start a clean Nginx container to serve the static assets
FROM nginx:1.27-alpine AS runtime

# Remove the default Nginx index.html configuration file
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx routing and proxy configuration
COPY nginx.conf /etc/nginx/conf.d/appflow.conf

# Copy the compiled React files from Stage 1 into Nginx's public folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port 80
EXPOSE 80

# Start Nginx in the foreground so the container stays running
CMD ["nginx", "-g", "daemon off;"]
```

### The Nginx Config: `frontend/nginx.conf`

Because React uses client-side routing (Single Page Application) and needs to talk to a separate backend, we use Nginx to manage paths.

Here is the explanation of [frontend/nginx.conf](file:///c:/Users/user/Desktop/Ken/appflow-tracker/frontend/nginx.conf):

* **Serving React Files**: Nginx serves everything out of `/usr/share/nginx/html`.
* **Caching**: Static files like CSS, JS, and images are cached in the browser for up to a year (`Cache-Control: public, immutable`) to make the page load instantly.
* **API Reverse Proxy**: Any request starting with `/api/` is forwarded (`proxy_pass`) to the Django backend.
  ```nginx
  location /api/ {
      proxy_pass         http://backend:8000;
      ...
  }
  ```
  This solves CORS (Cross-Origin Resource Sharing) issues because the browser thinks it's talking to a single server on port 80.
* **Django Admin Proxy**: Requests starting with `/admin/` are forwarded to the Django administration panel on port 8000.
* **SPA Routing Fallback**: In a React Single Page Application (SPA), routes like `/applications/create` only exist inside the browser. If a user refreshes the page on `/applications/create`, the web server will return a 404 because that file doesn't exist on disk.
  This line instructs Nginx to fall back to `index.html` for any unknown routes, letting React handle the URL path:
  ```nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  ```

---

## 5. Deep Dive: Docker Compose Orchestration

Instead of launching our database volume, networks, backend container, and frontend container with separate, complicated commands, we orchestrate them in [docker-compose.yml](file:///c:/Users/user/Desktop/Ken/appflow-tracker/docker-compose.yml).

Here is what each block in the compose file does:

### Services

#### 1. Backend Service
* **`build`**: Builds the image from `./backend/Dockerfile`.
* **`image`**: Names the built local image `kennjenga/appflow-tracker-backend:local`.
* **`env_file`**: Loads environment variables from the `.env.docker` file.
* **`volumes`**: Mounts the volume named `sqlite_data` to `/app/db` inside the container. This folder is where SQLite writes `db.sqlite3`. This prevents database deletion when you stop or rebuild containers.
* **`environment`**: Overrides `DJANGO_DB_PATH` to store the database inside the mounted volume directory (`/app/db/db.sqlite3`).
* **`expose`**: Exposes port 8000 to the container network, but *does not* publish it to the host computer (prevents port conflicts on your local computer).
* **`healthcheck`**: Periodically checks if the Django application is running by sending a request to the `/api/v1/applications/` endpoint. The frontend service waits for this to be healthy.

#### 2. Frontend Service
* **`build`**: Builds from `./frontend/Dockerfile`. It passes `VITE_API_BASE_URL: /api/v1` as a build argument. This tells the compiled React code to send API calls to the same domain Nginx is running on, which then proxies them to the backend container.
* **`ports`**: Publishes port `80:80` to the host computer. You access the app by typing `http://localhost` (port 80 is the default HTTP port).
* **`depends_on`**: Declares that the frontend depends on the backend container being healthy. This ensures Nginx doesn't start up until the backend has finished applying migrations.

### Volumes and Networks

* **`volumes: sqlite_data`**: Defines a persistent named volume. Docker stores this data outside the container file systems, keeping it safe.
* **`networks: appflow-net`**: Creates an isolated bridge network named `appflow-network`. Containers on this network can communicate using their container names. For example, Nginx can route traffic to `http://backend:8000` because Docker's DNS server automatically resolves `backend` to the backend container's IP address.

---

## 6. Essential Docker Command Reference

These are the most common Docker and Docker Compose commands you will need to manage the AppFlow Tracker project.

### Docker Compose Commands (Recommended)

Always run these commands from the project root directory (where `docker-compose.yml` is located).

| Command | What it does | When to use it |
|---|---|---|
| `docker compose up` | Starts all containers in the foreground. You will see live logs from all containers. | Standard startup during development. |
| `docker compose up -d` | Starts all containers in the background ("detached" mode). | Starting the application in the background. |
| `docker compose down` | Stops all containers, removes them, and cleans up the network. *Saves database volume.* | Stopping the application when you are done. |
| `docker compose down -v` | Stops containers and **deletes all database volumes**. | Resetting the database and starting fresh. |
| `docker compose up --build` | Forces a rebuild of images, then starts the containers. | When you edit source code or change a Dockerfile. |
| `docker compose logs` | Shows output logs from all running containers. | Debugging errors or seeing server requests. |
| `docker compose logs -f backend` | Follows (`-f`) live logs for the `backend` container only. | Checking database migrations or backend logs. |
| `docker compose ps` | Lists all containers and their current health status. | Checking if containers are running or failing health checks. |
| `docker compose exec backend sh` | Opens an interactive terminal inside the running backend container. | Running Django commands manually inside Docker. |
| `docker compose exec backend python manage.py createsuperuser` | Runs a command inside the backend container. | Creating an admin user without opening a shell. |

### Classic Docker CLI Commands

These are general Docker commands for managing single images, containers, and resources.

| Command | What it does | When to use it |
|---|---|---|
| `docker ps` | Lists all running containers on your system. | Checking what Docker containers are active globally. |
| `docker ps -a` | Lists all containers, including stopped ones. | Finding containers that exited or crashed. |
| `docker images` | Lists all downloaded or built Docker images. | Checking what images are taking up disk space. |
| `docker stop <container_id>` | Gracefully stops a running container. | Stopping a container manually. |
| `docker rm <container_id>` | Deletes a stopped container. | Cleaning up old containers. |
| `docker rmi <image_id>` | Deletes a Docker image. | Deleting unused or old images to free space. |
| `docker system prune -a --volumes` | Deletes **all** unused containers, networks, images, and volumes. | Freeing up gigabytes of host hard drive space. |
| `docker volume ls` | Lists all persistent volumes on your machine. | Finding where persistent data is stored. |
| `docker volume rm <volume_name>`| Deletes a specific persistent volume. | Cleaning up individual databases or persistent data. |

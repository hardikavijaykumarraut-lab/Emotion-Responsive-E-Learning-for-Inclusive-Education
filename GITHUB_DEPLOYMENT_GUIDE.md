# GitHub Deployment Guide — EmoLearn Project

This guide walks you through deploying the EmoLearn project to GitHub and then to production platforms (Vercel for frontend, Railway/Render for backend, etc.).

---

## Table of Contents
1. [Initialize Git & Push to GitHub](#1-initialize-git--push-to-github)
2. [Configure Environment Variables](#2-configure-environment-variables)
3. [Deploy Frontend to Vercel](#3-deploy-frontend-to-vercel)
4. [Deploy Backend to Railway](#4-deploy-backend-to-railway)
5. [Deploy Python Service to Railway](#5-deploy-python-service-to-railway)
6. [Set Up GitHub Actions (Optional CI/CD)](#6-set-up-github-actions-optional-cicd)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Initialize Git & Push to GitHub

### Step 1A: Create a GitHub repository
1. Go to [GitHub.com](https://github.com) and sign in.
2. Click **New** or go to [github.com/new](https://github.com/new).
3. Repository name: `emolearn` (or your preferred name).
4. Description: `EmoLearn — Emotion-Adaptive Learning Platform`
5. Choose **Public** or **Private** (use **Private** if you don't want to share).
6. Do **NOT** initialize with README (we already have one).
7. Click **Create repository**.

### Step 1B: Initialize Git locally and push
Open **PowerShell** in `c:\Users\HARDIKA RAUT\emotionapp` and run:

```powershell
cd 'c:\Users\HARDIKA RAUT\emotionapp'

# Initialize Git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: EmoLearn project with frontend, backend, and Python service"

# Add remote (replace YOUR_USERNAME and YOUR_REPO_NAME with your GitHub details)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub (main branch)
git branch -M main
git push -u origin main
```

**Note:** If you encounter authentication issues:
- Use a **Personal Access Token (PAT)** instead of a password. See [GitHub Docs: Create a PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).
- Store your credentials using `git config --global credential.helper wincred` (Windows Credential Manager).

---

## 2. Configure Environment Variables

Before deploying, prepare environment variable files.

### Step 2A: Backend `.env`
Create (or update) `emolearn/backend/.env`:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<generate-a-secure-random-string>
CORS_ORIGIN=https://your-frontend-domain.vercel.app,https://your-admin-domain.com
PYTHON_SERVICE_URL=https://your-python-service-url.com
```

**Do NOT commit `.env` to GitHub.** Add to `.gitignore`:
```
emolearn/backend/.env
emolearn/backend/.env.local
emolearn/python-service/.env
emolearn/python-service/.env.local
.DS_Store
node_modules/
```

### Step 2B: Frontend `.env`
Create (or update) `emolearn/frontend/.env`:
```
REACT_APP_API_URL=https://your-backend-api.railway.app
REACT_APP_WEBSOCKET_URL=wss://your-backend-api.railway.app
REACT_APP_PYTHON_SERVICE_URL=https://your-python-service.railway.app
```

### Step 2C: Python Service `.env`
Create (or update) `emolearn/python-service/.env`:
```
ENVIRONMENT=production
BACKEND_API_URL=https://your-backend-api.railway.app
```

---

## 3. Deploy Frontend to Vercel

### Step 3A: Connect GitHub to Vercel
1. Go to [Vercel.com](https://vercel.com) and sign in (or create an account).
2. Click **Add New** → **Project**.
3. Click **Import Git Repository**.
4. Paste your GitHub repository URL: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`
5. Click **Continue**.
6. **Select Root Directory:** Choose `emolearn/frontend`.
7. Click **Continue**.

### Step 3B: Configure build settings
Vercel should auto-detect React. Set:
- **Framework Preset:** `Create React App`
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`

### Step 3C: Add environment variables
In Vercel Dashboard, go to **Settings** → **Environment Variables**:
- Name: `REACT_APP_API_URL` → Value: `https://your-backend-api.railway.app`
- Name: `REACT_APP_WEBSOCKET_URL` → Value: `wss://your-backend-api.railway.app`
- Name: `REACT_APP_PYTHON_SERVICE_URL` → Value: `https://your-python-service.railway.app`

Click **Save**.

### Step 3D: Deploy
Click **Deploy**. Vercel will:
1. Clone your repo.
2. Install dependencies.
3. Build the frontend.
4. Deploy to Vercel's CDN.

Once complete, you'll get a URL like `https://emolearn.vercel.app`.

**Auto-deploy on push:** Any push to `main` branch will trigger a new Vercel deployment automatically.

---

## 4. Deploy Backend to Railway

### Step 4A: Create a Railway account
1. Go to [Railway.app](https://railway.app) and sign in (or create an account).
2. Connect your GitHub account (Railway will ask for OAuth permission).

### Step 4B: Create a new project
1. Click **+ New Project**.
2. Select **Deploy from GitHub repo**.
3. Search for and select your `emolearn` repository.
4. Click **Add Service**.

### Step 4C: Configure the backend service
1. Railway will scan the repo. Select **Node.js** as the runtime.
2. Set the **Root Directory** to `emolearn/backend`.
3. Add environment variables in Railway Dashboard:
   - Go to your project → **Backend service** → **Variables**.
   - Add each variable from your `.env` (see Step 2A):
     ```
     NODE_ENV=production
     PORT=5000
     MONGODB_URI=<your-mongodb-url>
     JWT_SECRET=<your-secure-random-string>
     CORS_ORIGIN=https://emolearn.vercel.app,<other-allowed-origins>
     PYTHON_SERVICE_URL=https://your-python-service-url.railway.app
     ```
4. Click **Save**.

### Step 4D: Configure MongoDB
Railway can provision MongoDB, or you can use an external one (e.g., MongoDB Atlas):
- **Option A: Use Railway's MongoDB:**
  1. Click **+ Add** in your project.
  2. Select **Database** → **MongoDB**.
  3. Railway will add `MONGODB_URI` automatically to your backend environment.
- **Option B: Use MongoDB Atlas (cloud):**
  1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
  2. Create a cluster and get your connection string.
  3. Manually add `MONGODB_URI` in Railway variables (Step 4C).

### Step 4E: Deploy
Click **Deploy**. Railway will:
1. Install dependencies from `emolearn/backend/package.json`.
2. Run `npm start` (or the script you defined in `package.json`).
3. Expose your backend at a Railway URL like `https://emolearn-backend-production.railway.app`.

**Auto-deploy on push:** Any push to `main` triggers a Railway rebuild.

---

## 5. Deploy Python Service to Railway

### Step 5A: Add Python service to the same Railway project
1. In your Railway project, click **+ Add**.
2. Select **Deploy from GitHub repo** (same repo).
3. Select your `emolearn` repository again.
4. Railway will scan for Python files. Select `emolearn/python-service` as the **Root Directory**.
5. Click **Add Service**.

### Step 5B: Configure the Python service
1. Set **Runtime** to **Python**.
2. Add environment variables:
   ```
   ENVIRONMENT=production
   BACKEND_API_URL=https://emolearn-backend-production.railway.app
   ```
3. Click **Save**.

### Step 5C: Deploy
Railway will:
1. Install Python dependencies from `requirements.txt`.
2. Run your FastAPI service (typically `python -m uvicorn main:app` or a similar start command defined in Procfile).
3. Expose at a URL like `https://emolearn-python-service-production.railway.app`.

---

## 6. Set Up GitHub Actions (Optional CI/CD)

To run tests automatically on every push, create `.github/workflows/test.yml`:

```yaml
name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd emolearn/backend && npm install && npm test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd emolearn/frontend && npm install && npm test -- --passWithNoTests

  test-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: cd emolearn/python-service && pip install -r requirements.txt && python -m pytest
```

Save this file in your repository and commit:
```powershell
git add .github/workflows/test.yml
git commit -m "Add GitHub Actions CI workflow"
git push origin main
```

Tests will now run automatically before each deploy.

---

## 7. Troubleshooting

### Frontend won't connect to backend
- **Problem:** Frontend shows error "Cannot reach backend API".
- **Solution:** 
  1. Verify backend is deployed and running on Railway.
  2. Verify `REACT_APP_API_URL` and `REACT_APP_WEBSOCKET_URL` in Vercel match your Railway backend URL.
  3. Check backend CORS settings allow your frontend origin.
  4. In backend `.env`, ensure `CORS_ORIGIN=https://emolearn.vercel.app` (or your Vercel URL).

### WebSocket connection fails
- **Problem:** Real-time updates don't work; WebSocket connection times out.
- **Solution:**
  1. Ensure backend is running (not just deployed but actually serving).
  2. Backend must expose WebSocket endpoint on the same domain as HTTP API.
  3. Verify `REACT_APP_WEBSOCKET_URL=wss://your-backend-url.railway.app` (must use `wss://` not `ws://`).
  4. Check Railway backend logs for WebSocket server startup messages.

### MongoDB connection fails
- **Problem:** Backend logs show "MongooseError: connect ENOTFOUND" or similar.
- **Solution:**
  1. If using MongoDB Atlas:
     - Verify connection string in `MONGODB_URI` includes your IP in Network Access list.
     - If deploying from Railway, add Railway's IP range or use "Allow all IPs" (less secure).
  2. If using Railway MongoDB:
     - Ensure the MongoDB service was provisioned and the `MONGODB_URI` was auto-added to backend environment.

### Python service not responding
- **Problem:** Frontend or backend cannot reach Python service.
- **Solution:**
  1. Verify `PYTHON_SERVICE_URL` in backend environment matches the Railway Python service URL.
  2. Check Python service logs on Railway for startup errors.
  3. Ensure `requirements.txt` includes all necessary packages (fastapi, uvicorn, etc.).

### Deployment fails with "Build error"
- **Problem:** Railway or Vercel shows a build error.
- **Solution:**
  1. Check the build log for specific errors (e.g., missing dependency, syntax error).
  2. On Railway: Click **View Logs** in the service settings.
  3. On Vercel: Go to **Deployments** tab and click the failed deployment to see logs.
  4. Common fixes:
     - Missing `node_modules`: run `npm install` locally and commit `package-lock.json`.
     - Missing `.env`: add to deployment platform's environment variables (not `.env` file).
     - Wrong root directory: ensure Railway/Vercel points to correct service folder.

---

## Next Steps

1. **Test the deployment:**
   - Visit your Vercel frontend URL.
   - Try logging in or performing an action that triggers an API call.
   - Monitor backend logs on Railway to confirm requests are being received.

2. **Set up monitoring:**
   - Use Railway's built-in logs and metrics.
   - (Optional) Set up error tracking with Sentry or similar.

3. **Set up a custom domain:**
   - Vercel and Railway both allow custom domain mapping. See their docs for details.

4. **Backup your database:**
   - If using MongoDB Atlas, enable automated backups.
   - If using Railway MongoDB, set a backup schedule.

---

## References
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)

---

**Questions or issues?** Refer to the main `README.md` or the troubleshooting section above.

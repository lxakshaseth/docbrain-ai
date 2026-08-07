# 🚀 Deployment Guide (Free Tier Infrastructure)

This guide provides step-by-step instructions to deploy the entire **PDF Knowledge Base AI Chatbot** stack to free-tier cloud platforms (Vercel, Render, MongoDB Atlas, Upstash Redis, Hugging Face).

---

## 🏗️ Architecture Overview

| Component | Technology | Recommended Free Host | Alternative Host |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 15, TailwindCSS | **Vercel** | Netlify / Render |
| **Backend** | Node.js, Express, TypeScript | **Render** | Railway / Koyeb |
| **AI Microservice** | Python 3.10, FastAPI, LangChain | **Render** | Hugging Face Spaces / Railway |
| **Database** | MongoDB | **MongoDB Atlas** | Railway MongoDB |
| **Pub/Sub & Cache** | Redis | **Upstash Redis** | Redis Cloud |

---

## 1. Database Setup: MongoDB Atlas (Free 512MB)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new **M0 Free Cluster**.
3. Under **Database Access**, create a database user and password.
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect** -> **Drivers** and copy your Connection String:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/pdf_chatbot?retryWrites=true&w=majority
   ```

---

## 2. Redis Setup: Upstash Redis (Free Serverless)

1. Create an account at [Upstash](https://upstash.com).
2. Create a **Redis Database**.
3. Copy your `REDIS_URL` connection string:
   ```
   rediss://default:<password>@<your-db>.upstash.io:6379
   ```

---

## 3. Deploy AI Service (FastAPI) on Render / Hugging Face

### Option A: Render.com (Web Service)
1. Push this repository to GitHub.
2. Log in to [Render.com](https://render.com) and click **New > Web Service**.
3. Connect your repository.
4. Set the Root Directory: `apps/ai-service`.
5. Environment: `Python 3`.
6. Build Command: `pip install -r requirements.txt`.
7. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
8. Add Environment Variables:
   - `GROQ_API_KEY`: `your_groq_api_key`
   - `GEMINI_API_KEY`: `your_gemini_api_key`
   - `REDIS_URL`: `your_upstash_redis_url`
9. Deploy! Copy the deployed URL (e.g., `https://pdf-ai-service.onrender.com`).

---

## 4. Deploy Backend (Node.js/Express) on Render

1. Log in to [Render.com](https://render.com) and click **New > Web Service**.
2. Connect your repository.
3. Set Root Directory: (leave blank for root).
4. Environment: `Node`.
5. Build Command: `npm install && npm run build:shared && npm run build:backend`.
6. Start Command: `cd apps/backend && npm run start`.
7. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGO_URI`: `your_mongodb_atlas_uri`
   - `REDIS_URL`: `your_upstash_redis_url`
   - `JWT_SECRET`: `your_secure_jwt_secret`
   - `AI_SERVICE_URL`: `https://pdf-ai-service.onrender.com` (from Step 3)
8. Deploy! Copy the deployed URL (e.g., `https://pdf-backend.onrender.com`).

---

## 5. Deploy Frontend (Next.js) on Vercel

1. Log in to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. Set **Root Directory** to `apps/frontend`.
4. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://pdf-backend.onrender.com/api/v1` (from Step 4)
5. Click **Deploy**.

---

## 6. Verification Checklist

- [ ] Visit Vercel Frontend URL (e.g., `https://your-app.vercel.app`).
- [ ] Test User Registration & Login.
- [ ] Test PDF Upload (verifies Redis + AI Service pipeline).
- [ ] Test RAG Chat (verifies LangGraph + Groq/Gemini).
- [ ] Test Summary, Mind Map, and Audio Overview (gTTS).
- [ ] Test Public Share Link (`/share/:token`).

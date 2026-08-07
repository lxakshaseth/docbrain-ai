# PDF Knowledge Base AI Chatbot (RAG System)

A production-ready, clean-architecture AI Full Stack Microservice application built with **Next.js 15 (App Router)**, **TypeScript**, **Node.js / Express**, **Python FastAPI**, **LangChain**, **LangGraph**, **ChromaDB**, **MongoDB Atlas**, **Groq / Google Gemini**, and **Redis Pub/Sub**.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               Next.js 15 App Router Frontend                           │
│        (React 18, React Query, Zustand, Tailwind CSS, shadcn/ui, Markdown)             │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP REST API (JWT Bearer Auth)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             Node.js / Express Backend                                  │
│     (Clean Architecture, Repository Pattern, Zod DTOs, Multer Upload, Swagger UI)      │
└───────────────────┬────────────────────────────────────────────────┬───────────────────┘
                                                                     │
                                                                     │ Redis Pub/Sub (Mandatory)
                                                                     ▼
                                                         ┌───────────────────────┐
                                                         │  Redis Event Broker   │
                                                         └───────────┬───────────┘
                                                                     │ Pub/Sub Channels
                                                                     ▼
                                                         ┌───────────────────────┐
                                                         │   Python AI Engine    │
                                                         │ (FastAPI, LangGraph,  │
                                                         │  Gemini, Hybrid RAG)  │
                                                         └───────────┬───────────┘
                                                                     │
                                                                     ▼
                                                         ┌───────────────────────┐
                                                         │ Chroma Vector DB      │
                                                         └───────────────────────┘
```

> **Note**: Direct communication between the Node.js backend and Python AI service for AI processing is strictly forbidden; all processing tasks (PDF ingestion & RAG chat streaming) are mediated asynchronously via Redis Pub/Sub channels.

---

## 🛠️ Mandatory Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui primitives, React Query (@tanstack/react-query), Zustand
- **Backend**: Node.js, Express, TypeScript, JWT Auth, bcrypt, Multer, Zod DTOs, Winston Logger, Swagger UI (`/api-docs`)
- **AI Microservice**: Python 3.11+, FastAPI, LangChain, **LangGraph (StateGraph Workflow)**, Groq LPUs (`llama-3.1-70b-versatile`) / Google Gemini (`gemini-1.5-flash`), PyPDF, SentenceTransformers
- **Database**: MongoDB Atlas Cloud
- **Vector Database**: ChromaDB (Persistent Vector Store)
- **Event Broker**: Redis Pub/Sub (Mandatory Microservice Event Bus)

---

## 🔄 LangGraph StateGraph Workflow

1. `hybrid_retrieve`: Executes Hybrid Retrieval combining **ChromaDB Dense Embeddings** and **Sparse BM25 Keyword Search** with Reciprocal Rank Fusion.
2. `generate_answer`: Formats anti-hallucination prompt, retrieves conversation memory, and invokes LLM (Groq / Gemini).
3. `generate_followups`: Automatically generates 3 grounded follow-up questions for the user.

---

## 📂 Repository Project Structure

```
pdf-kb-ai-chatbot/
├── apps/
│   ├── frontend/                   # Next.js 15 App Router Frontend
│   │   ├── src/
│   │   │   ├── app/                # App Router Layout, Error Boundary & Pages
│   │   │   ├── components/         # UI Primitives & Providers
│   │   │   ├── features/           # Auth, Documents, and Chat modules
│   │   │   ├── hooks/              # React Query hooks
│   │   │   ├── lib/                # Fetch API Client with JWT authorization
│   │   │   └── store/              # Zustand state stores
│   │   ├── .env.example
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   ├── backend/                    # Node.js Express TypeScript Backend
│   │   ├── src/
│   │   │   ├── config/             # Environment & Swagger configs
│   │   │   ├── core/               # AppError, Logger, AsyncHandler
│   │   │   ├── dtos/               # Zod validation schemas
│   │   │   ├── features/           # Auth, Documents, Chat controllers & routes
│   │   │   ├── middlewares/        # Auth, Role (RBAC), Upload, Validation
│   │   │   ├── models/             # Mongoose schemas (User, Document, Conversation, Message)
│   │   │   ├── redis/              # Redis Client wrapper & Pub/Sub subscriber
│   │   │   ├── repositories/       # UserRepository, DocumentRepository, ConversationRepository, MessageRepository
│   │   │   └── app.ts              # Express application entry point
│   │   ├── .env.example
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── ai-service/                 # Python FastAPI AI Microservice
│       ├── app/
│       │   ├── api/                # FastAPI Routers (/health, /ingest, /query, /suggest-questions)
│       │   ├── core/               # Pydantic Settings, Logger, Custom Exceptions
│       │   ├── db/                 # ChromaDB vector store client manager
│       │   ├── redis_pubsub/       # Async Redis Publisher & Subscriber with task retry
│       │   ├── schemas/            # Request/Response & Event Pydantic schemas
│       │   └── services/           # PDFProcessor, HybridRetriever, LangGraph RAG Graph, MemoryService
│       ├── .env.example
│       ├── main.py                 # FastAPI application entry point
│       └── requirements.txt
│
├── packages/
│   └── shared/                     # Shared TypeScript Contracts & Interfaces
│       ├── src/
│       │   ├── interfaces/         # Domain Interfaces (IUser, IDocument, IMessage)
│       │   └── redis-events/       # Event Payloads & Channel Constants
│       └── package.json
│
├── docker-compose.yml              # Complete Multi-Container Setup
├── .gitignore
├── README.md
└── package.json                    # Monorepo Root Configuration
```

---

## ⚡ Quick Start & Execution Steps

### 1. Start Infrastructure Containers

```bash
docker-compose up redis chromadb -d
```

### 2. Start Node.js Backend Service (Port 5000)

```bash
# Install workspace dependencies
npm install --legacy-peer-deps

# Build shared contracts package
npm run build:shared

# Start backend in development mode
npm run dev:backend
```

### 3. Start Python AI Microservice (Port 8001)

```bash
cd apps/ai-service
python -m venv venv
# PowerShell on Windows:
.\venv\Scripts\Activate.ps1
# macOS / Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 4. Start Next.js 15 Frontend (Port 3000)

```bash
npm run dev:frontend
```

Open `http://localhost:3000` in your web browser.

---

## 🌐 Interactive Swagger API Documentation

Interactive Swagger OpenAPI UI documentation is served on:
`http://localhost:5000/api-docs`

---

## 🧪 Health Checks

- Node Backend Health: `GET http://localhost:5000/health`
- Redis Connection Health: `GET http://localhost:5000/health/redis`
- Python AI Service Health: `GET http://localhost:8001/api/v1/health`

---

## 🚀 Cloud Deployment

See [DEPLOYMENT.md](file:///c:/Users/lxaks/OneDrive/Desktop/intern/DEPLOYMENT.md) for step-by-step instructions on deploying:
- **Frontend** on [Vercel](https://vercel.com) using `apps/frontend/vercel.json`.
- **Node Backend & Python AI Service** on [Render](https://render.com) using [`render.yaml`](file:///c:/Users/lxaks/OneDrive/Desktop/intern/render.yaml) (1-click Blueprint).
- **Database** on [MongoDB Atlas Free Tier](https://www.mongodb.com/cloud/atlas).
- **Cache & Pub/Sub** on [Upstash Redis Free Tier](https://upstash.com).
- **Docker Containers**: `apps/backend/Dockerfile` and `apps/ai-service/Dockerfile`.


# RAG Pipeline API - Game of Thrones Laws

This repository contains a RAG (Retrieval-Augmented Generation) pipeline API that allows querying a database of laws from the fictional series "Game of Thrones". The API uses LlamaIndex, Qdrant vector store, and OpenAI embeddings/LLM to provide semantic search over the laws PDF document.

Decisions are documented in [Decision Documentation](decisionDocumentation.md)
Reflections are documented in [Reflective Response](reflectiveResponse.md)

## Getting Started

### 1. Setup Environment

1.  **Clone the repository**
2.  **Set up Environment Variables**
    
    Copy the example environment files and fill in your API keys (OpenAI API Key and a custom API Key for auth):
    -   Backend: Copy `.env.example` to `.env`
    -   Frontend: Copy `frontend/.env.example` to `frontend/.env`

### 2. Run the Backend

Choose one of the following methods to run the backend API.

**Option A: Docker (Static)**
Use this for a stable, containerized environment.

1.  Build the image:
    ```bash
    docker build -t norm-rag-api .
    ```
2.  Run the container:
    ```bash
    docker run -d -p 8000:80 --env-file .env --name norm-rag-api norm-rag-api
    ```

**Option B: Local with Uvicorn (Hot-reloading)**
Use this for development to enable hot-reloading when changing backend code.

1.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
2.  Run the server:
    ```bash
    uvicorn app.main:app --host localhost --port 8000 --reload
    ```

The backend API will be available at `http://localhost:8000`.

### 3. Run the Frontend

The frontend is a Next.js application. It must be run locally for development.

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Run the development server:
    ```bash
    pnpm run dev
    ```

The frontend will be available at `http://localhost:3000`.


## Project Structure

The project is organized into backend services (`app/`) and a frontend client (`frontend/`).

```
.
├── app/                         # Backend FastAPI application
│   ├── __init__.py
│   ├── dependencies.py          # Dependency injection (API Key validation)
│   ├── main.py                  # App entry point & configuration
│   ├── data_models.py           # Pydantic data models (Request/Response)
│   ├── routers.py               # API Route definitions
│   └── utils.py                 # Core RAG logic & Qdrant service
├── docs/                        # Documentation & Source files
│   └── laws.pdf                 # Source legal text
├── frontend/                    # Next.js Client Application
│   ├── app/                     # Next.js App Router pages
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Main chat interface
│   │   └── providers.tsx        # React Query & Chakra providers
│   ├── components/              # UI Components
│   │   ├── CitationCard.tsx     # Displays individual source citations
│   │   ├── FeedbackControls.tsx # Thumbs up/down feedback UI
│   │   ├── HeaderNav.tsx        # Application header
│   │   ├── PdfViewer.tsx        # Modal PDF viewer
│   │   ├── ResultsDisplay.tsx   # Renders answer text and citations
│   │   ├── SearchInput.tsx      # Search bar and options
│   │   ├── Sidebar.tsx          # History sidebar
│   │   └── WelcomeScreen.tsx    # Initial empty state view
│   ├── lib/                     # Utilities
│   │   └── api.ts               # API client and type definitions
│   └── public/                  # Static assets
└── requirements.txt             # Python dependencies
```

## Server Repository

### Overview

The server implements a RAG pipeline that:
- Parses `docs/laws.pdf` into structured sections and subsections
- Creates vector embeddings for each law section
- Provides semantic search capabilities via a FastAPI endpoint
- Returns answers with citations including page numbers, section IDs, and section names

### Prerequisites

- Python 3.11+
- Docker (for containerized deployment)
- OpenAI API key
- API key for authentication (you can set your own)

### API Documentation

Once the server is running, you can access:
- **Interactive API docs:** `http://localhost:8000/docs` (Swagger UI)
- **Alternative docs:** `http://localhost:8000/redoc` (ReDoc)
- **Health check:** `http://localhost:8000/health`

### Key API Endpoint

#### POST `/query`

Query the laws database using RAG.

**Headers:**
- `X-API-Key`: Your API key (required)

**Request Body:**
```json
{
  "query": "What happens if I steal?",
  "k": 3
}
```

**Parameters:**
- `query` (string, required): The query string to search for
- `k` (integer, optional): Number of similar vectors to return (default: 2, max: 20)

**Response:**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "query": "What happens if I steal?",
    "response": "According to the laws, theft is punishable by hanging...",
    "response_segments": [
      {
        "text": "According to the laws, theft is punishable by hanging...",
        "citation_index": 0,
        "citation_text": "Section 5.1.1"
      }
    ],
    "citations": [
      {
        "source": "Section 5.1.1",
        "text": "Theft is punishable by hanging...",
        "page": 12,
        "score": 0.85
      }
    ]
  },
  "meta": {
    "timestamp": "2023-11-20T10:00:00Z",
    "latency_ms": 150.5,
    "api_version": "1.0"
  },
  "errors": null
}
```

**Response Fields:**
- `status`: API status ("success" or "error")
- `message`: Human-readable status message
- `data`: The payload (for success responses)
  - `query`: The original query string
  - `response`: The LLM-generated answer based on retrieved laws
  - `response_segments`: Array of text segments (with optional citation links) used by the frontend to render rich, citation-aware answers. Each segment has:
    - `text`: The raw text for this segment (may include citation markers like `[1]`)
    - `citation_index`: Zero-based index into the `citations` array for this segment (optional)
    - `citation_text`: Human-readable citation label (e.g., "Section 5.1.1") (optional)
  - `citations`: Array of citation objects with:
    - `source`: Section identifier (e.g., "Section 5.1.1")
    - `text`: The relevant text snippet from the law
    - `page`: Page number in the PDF (optional)
    - `score`: Relevance score (optional)
- `meta`: Request metadata
  - `timestamp`: Request completion timestamp
  - `latency_ms`: Processing time in milliseconds
  - `api_version`: API version
- `errors`: List of errors (if any)

### Example Usage

#### Using curl:

```bash
curl -X POST "http://localhost:8000/query" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What happens if I steal from the Sept?",
    "k": 3
  }'
```

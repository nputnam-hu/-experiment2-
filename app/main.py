from dotenv import load_dotenv
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.utils import QdrantService
from app.routers import router
from app.data_models import ApiResponse, ServiceStatus, ResponseMeta

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Initialize service and store in app.state
    qdrant_service = QdrantService(k=2)
    qdrant_service.connect()
    qdrant_service.load()
    app.state.qdrant_service = qdrant_service
    print("Index initialized and documents loaded")
    yield
    # Cleanup if needed
    app.state.qdrant_service = None

app = FastAPI(
    title="RAG Pipeline API",
    description="Query Game of Thrones laws using RAG",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router)

# Mount docs directory for static file serving
docs_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs")
if os.path.exists(docs_path):
    app.mount("/docs-static", StaticFiles(directory=docs_path), name="docs-static")
else:
    print(f"Warning: Docs directory not found at {docs_path}")


# --- Exception Handlers ---
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            status=ServiceStatus.ERROR,
            message=exc.detail,
            errors=[{"code": str(exc.status_code), "detail": exc.detail}],
            meta=ResponseMeta(latency_ms=0.0) 
        ).model_dump(mode="json")
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    print(f"Internal Error: {exc}")
    return JSONResponse(
        status_code=500,
        content=ApiResponse(
            status=ServiceStatus.ERROR,
            message="Internal Server Error",
            errors=[{"code": "INTERNAL_ERROR", "detail": str(exc)}],
            meta=ResponseMeta(latency_ms=0.0)
        ).model_dump(mode="json")
    )

from dotenv import load_dotenv
import os
import time
from contextlib import asynccontextmanager
from typing import Optional, Generic, TypeVar, Any
from enum import Enum
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Header, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer
from pydantic import BaseModel, Field

from app.utils import Output, QdrantService

# Load environment variables
load_dotenv()

# API Key from environment
API_KEY = os.environ.get("API_KEY", "default-api-key-change-in-production")

# Global service instance
qdrant_service: Optional[QdrantService] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    global qdrant_service
    qdrant_service = QdrantService(k=2)
    qdrant_service.connect()
    qdrant_service.load()
    print("Index initialized and documents loaded")
    yield


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


# --- Response Models ---
T = TypeVar("T")


class ServiceStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"


class ResponseMeta(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    latency_ms: float
    api_version: str = "1.0"


class ApiResponse(BaseModel, Generic[T]):
    status: ServiceStatus
    message: str = "Success"
    data: Optional[T] = None
    meta: Optional[ResponseMeta] = None
    errors: Optional[list[dict]] = None


# --- Exception Handlers ---
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            status=ServiceStatus.ERROR,
            message=exc.detail,
            errors=[{"code": str(exc.status_code), "detail": exc.detail}],
            meta=ResponseMeta(latency_ms=0.0) # Latency 0 for instant errors, or could calculate
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


# --- Models ---
class QueryRequest(BaseModel):
    query: str = Field(..., description="The query string to search for")
    k: Optional[int] = Field(None, ge=1, le=20, description="Number of similar vectors to return (optional, default: 2)")


def verify_api_key(api_key: str = Header(..., alias="X-API-Key")):
    """Verify API key from header"""
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return api_key


@app.post("/query", response_model=ApiResponse[Output])
async def query_laws(
    request: QueryRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Query the laws database using RAG.
    
    Requires X-API-Key header for authentication.
    Returns a standard API response envelope with the RAG result.
    """
    global qdrant_service
    start_time = time.time()
    
    if qdrant_service is None:
        raise HTTPException(status_code=500, detail="Service not initialized")
    
    # Validate query length
    if len(request.query) > 1000:
        raise HTTPException(status_code=400, detail="Query too long (max 1000 characters)")
    
    # Override k if provided
    original_k = qdrant_service.k
    if request.k is not None:
        qdrant_service.k = request.k
    
    try:
        result = qdrant_service.query(request.query)
        
        latency_ms = (time.time() - start_time) * 1000
        
        return ApiResponse[Output](
            status=ServiceStatus.SUCCESS,
            data=result,
            meta=ResponseMeta(latency_ms=latency_ms)
        )
    except HTTPException:
        raise
    except Exception as e:
        # Re-raise to be caught by global handler
        raise e
    finally:
        # Restore original k
        qdrant_service.k = original_k


@app.get("/health", response_model=ApiResponse[dict])
async def health_check():
    """Health check endpoint"""
    start_time = time.time()
    status_data = {"status": "healthy", "service_initialized": qdrant_service is not None}
    latency_ms = (time.time() - start_time) * 1000
    
    return ApiResponse[dict[str, Any]](
        status=ServiceStatus.SUCCESS,
        data=status_data,
        meta=ResponseMeta(latency_ms=latency_ms)
    )

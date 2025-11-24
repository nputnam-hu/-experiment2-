import time
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request
from app.data_models import (
    ApiResponse, 
    ServiceStatus, 
    ResponseMeta, 
    QueryRequest, 
    FeedbackRequest
)
from app.utils import Output
from app.dependencies import verify_api_key

router = APIRouter()

@router.post("/query", response_model=ApiResponse[Output])
async def query_laws(
    request: Request,
    query_request: QueryRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Query the laws database using RAG.
    
    Requires X-API-Key header for authentication.
    Returns a standard API response envelope with the RAG result.
    """
    # Access qdrant_service from app state
    qdrant_service = getattr(request.app.state, "qdrant_service", None)
    
    start_time = time.time()
    
    if qdrant_service is None:
        raise HTTPException(status_code=500, detail="Service not initialized")
    
    # Validate query length
    if len(query_request.query) > 1000:
        raise HTTPException(status_code=400, detail="Query too long (max 1000 characters)")
    
    # Override k if provided
    original_k = qdrant_service.k
    if query_request.k is not None:
        qdrant_service.k = query_request.k
    
    try:
        result = qdrant_service.query(query_request.query)
        
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


@router.post("/feedback", response_model=ApiResponse[dict])
async def submit_feedback(
    request: FeedbackRequest,
    api_key: str = Depends(verify_api_key)
):
    """
    Receive feedback on search results.
    """
    # Log to console as requested
    print(f"Feedback received: {request.model_dump_json(indent=2)}")
    
    return ApiResponse[dict](
        status=ServiceStatus.SUCCESS,
        data={"received": True},
        meta=ResponseMeta(latency_ms=0.0)
    )


@router.get("/health", response_model=ApiResponse[dict])
async def health_check(request: Request):
    """Health check endpoint"""
    start_time = time.time()
    
    qdrant_service = getattr(request.app.state, "qdrant_service", None)
    
    status_data = {"status": "healthy", "service_initialized": qdrant_service is not None}
    latency_ms = (time.time() - start_time) * 1000
    
    return ApiResponse[dict[str, Any]](
        status=ServiceStatus.SUCCESS,
        data=status_data,
        meta=ResponseMeta(latency_ms=latency_ms)
    )


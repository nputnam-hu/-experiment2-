from enum import Enum
from datetime import datetime, timezone
from typing import Optional, Generic, TypeVar, Any
from pydantic import BaseModel, Field
from app.utils import Output

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

class QueryRequest(BaseModel):
    query: str = Field(..., description="The query string to search for")
    k: Optional[int] = Field(None, ge=1, le=20, description="Number of similar vectors to return (optional, default: 2)")

class FeedbackRequest(BaseModel):
    feedback: Optional[str] = Field(None, pattern="^(positive|negative)$")
    result: Output
    timestamp: datetime


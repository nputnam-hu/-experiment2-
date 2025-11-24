import os
from fastapi import Header, HTTPException

# API Key from environment
API_KEY = os.environ.get("API_KEY", "default-api-key-change-in-production")

def verify_api_key(api_key: str = Header(..., alias="X-API-Key")):
    """Verify API key from header"""
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return api_key


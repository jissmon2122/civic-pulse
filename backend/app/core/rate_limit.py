import time
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException, Request, status
from app.config import settings


class InMemoryRateLimiter:
    """Sliding-window in-memory rate limiter per client IP."""
    def __init__(self):
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def check(self, key: str, max_requests: int, window_seconds: int = 60) -> bool:
        now = time.time()
        timestamps = self._requests[key]
        
        # Filter out timestamps older than the window
        valid_timestamps = [ts for ts in timestamps if now - ts < window_seconds]
        self._requests[key] = valid_timestamps
        
        if len(valid_timestamps) >= max_requests:
            return False
            
        self._requests[key].append(now)
        return True


rate_limiter = InMemoryRateLimiter()


def rate_limit(max_requests: int = 60, window_seconds: int = 60):
    def dependency(request: Request):
        client_ip = request.client.host if request.client else "127.0.0.1"
        endpoint = request.url.path
        key = f"{client_ip}:{endpoint}"
        
        if not rate_limiter.check(key, max_requests, window_seconds):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please wait a moment before trying again."
            )
        return True
    return dependency

"""Rate limiting middleware for API endpoints."""
from fastapi import Request, HTTPException
from time import time
from collections import defaultdict
from typing import Dict, Tuple
from ..config import config

class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self):
        # Store: {ip: [(timestamp, count)]}
        self.requests: Dict[str, list[Tuple[float, int]]] = defaultdict(list)
        self.window = 3600  # 1 hour in seconds
    
    def _clean_old_requests(self, ip: str, current_time: float):
        """Remove requests older than the time window."""
        cutoff_time = current_time - self.window
        self.requests[ip] = [
            (ts, count) for ts, count in self.requests[ip]
            if ts > cutoff_time
        ]
    
    def is_allowed(self, request: Request, is_authenticated: bool = False) -> Tuple[bool, int, int]:
        """
        Check if request is allowed based on rate limits.
        
        Returns:
            (is_allowed, current_count, limit)
        """
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        current_time = time()
        
        # Clean old requests
        self._clean_old_requests(client_ip, current_time)
        
        # Calculate current request count
        current_count = sum(count for _, count in self.requests[client_ip])
        
        # Determine limit based on authentication
        limit = config.RATE_LIMIT_AUTHENTICATED if is_authenticated else config.RATE_LIMIT_ANONYMOUS
        
        # Check if allowed
        if current_count >= limit:
            return False, current_count, limit
        
        # Add current request
        self.requests[client_ip].append((current_time, 1))
        
        return True, current_count + 1, limit
    
    def check_rate_limit(self, request: Request, is_authenticated: bool = False):
        """Raise exception if rate limit exceeded."""
        allowed, current, limit = self.is_allowed(request, is_authenticated)
        
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "message": f"You have exceeded the maximum of {limit} requests per hour",
                    "current": current,
                    "limit": limit,
                    "retry_after": "3600 seconds"
                }
            )

rate_limiter = RateLimiter()

"""Rate limiting middleware for API endpoints with Redis support."""
from fastapi import Request, HTTPException
from time import time
from collections import defaultdict
from typing import Dict, Tuple, Optional
import os
import logging
from config import config

logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiter with Redis support for distributed scaling."""
    
    def __init__(self):
        # In-memory fallback: {ip: [(timestamp, count)]}
        self.memory_requests: Dict[str, list[Tuple[float, int]]] = defaultdict(list)
        self.window = 3600  # 1 hour in seconds
        
        # Redis setup
        self.redis = None
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            try:
                import redis
                self.redis = redis.from_url(redis_url, decode_responses=True)
                logger.info("RateLimiter: Redis enabled")
            except ImportError:
                logger.warning("RateLimiter: redis package not installed, falling back to memory")
            except Exception as e:
                logger.warning(f"RateLimiter: Redis connection failed ({e}), falling back to memory")

    def _clean_old_requests_memory(self, ip: str, current_time: float):
        """Remove requests older than the time window (Memory mode)."""
        cutoff_time = current_time - self.window
        self.memory_requests[ip] = [
            (ts, count) for ts, count in self.memory_requests[ip]
            if ts > cutoff_time
        ]

    def _is_allowed_memory(self, client_ip: str, limit: int) -> Tuple[bool, int, int]:
        current_time = time()
        self._clean_old_requests_memory(client_ip, current_time)
        current_count = sum(count for _, count in self.memory_requests[client_ip])
        
        if current_count >= limit:
            return False, current_count, limit
            
        self.memory_requests[client_ip].append((current_time, 1))
        return True, current_count + 1, limit

    def _is_allowed_redis(self, client_ip: str, limit: int) -> Tuple[bool, int, int]:
        key = f"rate_limit:{client_ip}"
        try:
            # Use Redis pipeline for atomic operations
            pipe = self.redis.pipeline()
            now = time()
            # Remove old items (ZREMRANGEBYSCORE)
            pipe.zremrangebyscore(key, 0, now - self.window)
            # Count current items (ZCARD)
            pipe.zcard(key)
            # Add current timestamp (ZADD) - only if allowed, but we need count first
            # Actually pattern is: cleanup -> count -> check -> add
            # But pipelines execute at once. 
            # Better pattern: multi/exec.
            
            # 1. Cleanup & Count
            pipe.zremrangebyscore(key, 0, now - self.window)
            pipe.zcard(key)
            pipe.expire(key, self.window) # Refresh limits
            _, current_count, _ = pipe.execute()
            
            if current_count >= limit:
                return False, current_count, limit
            
            # 2. Add new request
            self.redis.zadd(key, {str(now): now})
            # Check count again effectively implies +1
            return True, current_count + 1, limit
            
        except Exception as e:
            logger.error(f"Redis Error: {e}")
            # Fallback to memory if Redis fails mid-flight
            return self._is_allowed_memory(client_ip, limit)

    def is_allowed(self, request: Request, is_authenticated: bool = False) -> Tuple[bool, int, int]:
        client_ip = request.client.host if request.client else "unknown"
        if request.headers.get("X-Forwarded-For"):
             client_ip = request.headers.get("X-Forwarded-For").split(",")[0]
             
        limit = config.RATE_LIMIT_AUTHENTICATED if is_authenticated else config.RATE_LIMIT_ANONYMOUS
        
        if self.redis:
            return self._is_allowed_redis(client_ip, limit)
        else:
            return self._is_allowed_memory(client_ip, limit)
    
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

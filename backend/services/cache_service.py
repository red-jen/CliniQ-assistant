import json
import hashlib
from typing import Optional
import redis

REDIS_URL = "redis://redis:6379/0"

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True, socket_timeout=2)
    redis_client.ping()
    REDIS_AVAILABLE = True
    print("[Redis] Connected successfully")
except Exception:
    redis_client = None
    REDIS_AVAILABLE = False
    print("[Redis] Not available — caching disabled")


def _make_key(query: str, chat_history: list) -> str:
    raw = json.dumps({"q": query, "h": chat_history}, sort_keys=True)
    return f"rag:{hashlib.sha256(raw.encode()).hexdigest()}"


def get_cached_answer(query: str, chat_history: list) -> Optional[dict]:
    if not REDIS_AVAILABLE:
        return None
    try:
        key = _make_key(query, chat_history)
        cached = redis_client.get(key)
        if cached:
            print(f"[Redis] Cache HIT for query: {query[:50]}...")
            return json.loads(cached)
    except Exception:
        pass
    return None


def cache_answer(query: str, chat_history: list, result: dict, ttl: int = 3600) -> None:
    if not REDIS_AVAILABLE:
        return
    try:
        key = _make_key(query, chat_history)
        redis_client.setex(key, ttl, json.dumps(result, default=str))
    except Exception:
        pass


def invalidate_cache() -> int:
    if not REDIS_AVAILABLE:
        return 0
    try:
        keys = redis_client.keys("rag:*")
        if keys:
            return redis_client.delete(*keys)
    except Exception:
        pass
    return 0

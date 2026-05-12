import httpx
import jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from ..config import settings

_security = HTTPBearer()

# Cache the JWK client so we don't re-fetch JWKS on every request
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(
            settings.CLERK_JWKS_URL,
            cache_keys=True,
        )
    return _jwks_client


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(_security),
) -> str:
    """
    Verify the Clerk JWT and return the user's Clerk subject (user_id).
    Raises HTTP 401 if the token is missing, expired, or invalid.
    """
    token = credentials.credentials
    try:
        client = _get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_exp": True},
        )
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing subject claim")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Authentication error: {exc}")

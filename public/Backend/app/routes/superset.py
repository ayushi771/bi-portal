# app/routes/superset.py
import json
from datetime import datetime
from typing import Dict, Set
from fastapi import Request
import base64
from fastapi import APIRouter , Query
import requests
from fastapi import Request

router = APIRouter(prefix="/superset", tags=["Superset"])

SUPERSET_URL = "http://localhost:8088"
USERNAME = "admin"
PASSWORD = "admin"


@router.get("/token/{dashboard_id}")
def get_superset_token(dashboard_id: str):
    session = requests.Session()

    # Login
    login_res = session.post(
        f"{SUPERSET_URL}/api/v1/security/login",
        json={"username": USERNAME, "password": PASSWORD, "provider": "db"},
    )
    access_token = login_res.json().get("access_token")
    if not access_token:
        return {"error": "No access token returned from Superset"}

    # CSRF
    csrf_res = session.get(
        f"{SUPERSET_URL}/api/v1/security/csrf_token/",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    csrf_token = csrf_res.json().get("result")

    # Guest token
    guest_res = session.post(
        f"{SUPERSET_URL}/api/v1/security/guest_token/",
        headers={
            "Authorization": f"Bearer {access_token}",
            "X-CSRFToken": csrf_token,
            "Referer": SUPERSET_URL,
        },
        json={
            # ✅ USE dynamic dashboard_id HERE
            "resources": [{"type": "dashboard", "id": dashboard_id}],
            "rls": [],
            "user": {"username": "guest_user"},
        },
    )

    guest_json = guest_res.json()
    if "result" in guest_json and "token" in guest_json["result"]:
        return {"token": guest_json["result"]["token"]}
    elif "token" in guest_json:
        return {"token": guest_json["token"]}
    else:
        return {"error": "Failed to get guest token", "details": guest_json}


favorites_by_user: Dict[str, Set[str]] = {}

def _user_key_from_request(request: Request) -> str:
    """
    Derive a user key from Authorization header token.
    This decodes the JWT payload WITHOUT verification (only for identifying user in-memory).
    In production use proper token verification or call Superset /whoami.
    """
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return "anonymous"  # fallback
    token = auth.split(" ", 1)[1].strip()
    try:
        payload_b64 = token.split(".")[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)
        payload_json = base64.urlsafe_b64decode(payload_b64).decode("utf-8")
        claims = json.loads(payload_json)
        # prefer "sub", fallback to username or a portion of token
        return str(claims.get("sub") or claims.get("username") or claims.get("user") or token[:16])
    except Exception:
        # if decode fails, fallback to token prefix
        return token[:16]

@router.post("/favorites/{dashboard_id}")
def toggle_favorite(dashboard_id: str, request: Request):
    user_key = _user_key_from_request(request)
    user_set = favorites_by_user.setdefault(user_key, set())
    if dashboard_id in user_set:
        user_set.remove(dashboard_id)
        is_fav = False
    else:
        user_set.add(dashboard_id)
        is_fav = True
    # persist back (not needed for setdefault usage)
    favorites_by_user[user_key] = user_set
    return {"isFavorite": is_fav}

@router.get("/favorites/{dashboard_id}")
def get_favorite(dashboard_id: str, request: Request):
    user_key = _user_key_from_request(request)
    user_set = favorites_by_user.get(user_key, set())
    return {"isFavorite": dashboard_id in user_set}

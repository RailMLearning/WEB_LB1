from fastapi import APIRouter
from starlette import status
from starlette.responses import Response



# from schemas import Student

api_router = APIRouter()

@api_router.get("/api/health")
def check_health():
    return {"status": "ok"}

@api_router.get("/api/requests")
def get_requests():
    return 
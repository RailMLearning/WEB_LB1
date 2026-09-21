from fastapi import APIRouter, HTTPException

from server.store import get_all_students, get_student_by_id

api_router = APIRouter()

@api_router.get("/api/health")
def check_health():
    return {"status": "ok"}

@api_router.get("/api/requests")
def get_requests():
    return get_all_students()

@api_router.get("/api/requests/{isu}")
def get_request(isu: str):
    student = get_student_by_id(isu)
    if student is None:
        raise HTTPException(status_code=404, detail="Студент не найден")
    return student
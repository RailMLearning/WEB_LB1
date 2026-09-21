from fastapi import APIRouter, HTTPException, Response

from server.store import delete_student_by_id, get_all_students, get_student_by_id

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

@api_router.delete("/api/requests/{isu}", status_code=204)
def delete_request(isu: str):
    if not delete_student_by_id(isu):
        raise HTTPException(status_code=404, detail="Студент не найден")
    return Response(status_code=204)
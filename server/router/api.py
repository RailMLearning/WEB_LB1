from fastapi import APIRouter, HTTPException, Request, Response

from server.store import create_student, delete_student_by_id, get_all_students, get_student_by_id, update_student
from server.validator import validate_student

api_router = APIRouter()

@api_router.get("/api/health")
def check_health():
	return {"status": "ok"}

@api_router.get("/api/requests")
def get_requests():
	return get_all_students()

async def _read_json_object(request: Request):
	try:
		body = await request.json()
	except (ValueError, UnicodeDecodeError) as error:
		raise HTTPException(status_code=400, detail="Некорректный JSON.") from error
	if not isinstance(body, dict):
		raise HTTPException(status_code=400, detail="Тело запроса должно быть JSON-объектом.")
	return body

@api_router.post("/api/requests", status_code=201)
async def create_request(request: Request):
	body = await _read_json_object(request)
	student, errors = validate_student(body)
	if errors:
		raise HTTPException(status_code=422, detail=errors)
	created_student = create_student(student)
	if created_student is None:
		raise HTTPException(status_code=409, detail="Студент с таким ИСУ уже существует")
	return created_student

@api_router.get("/api/requests/{isu}")
def get_request(isu: str):
	student = get_student_by_id(isu)
	if student is None:
		raise HTTPException(status_code=404, detail="Студент не найден")
	return student

@api_router.patch("/api/requests/{isu}")
async def patch_request(isu: str, request: Request):
	body = await _read_json_object(request)
	updates, errors = validate_student(body, partial=True)
	if errors:
		raise HTTPException(status_code=422, detail=errors)
	result, updated_student = update_student(isu, updates, validate_student)
	if result == "not_found":
		raise HTTPException(status_code=404, detail="Студент не найден")
	if result == "conflict":
		raise HTTPException(status_code=409, detail="Студент с таким ИСУ уже существует")
	if result == "invalid":
		raise HTTPException(status_code=422, detail=updated_student)
	return updated_student

@api_router.delete("/api/requests/{isu}", status_code=204)
def delete_request(isu: str):
	if not delete_student_by_id(isu):
		raise HTTPException(status_code=404, detail="Студент не найден")
	return Response(status_code=204)
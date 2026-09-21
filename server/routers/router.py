from fastapi import APIRouter
from starlette import status
from starlette.responses import Response

from server.store import (get_all_students, get_student_by_id)

# from schemas import Student

student_properties = [ "isu_id", "fio", "group", "dorm", "room", "date", "foreigner", "notes"
    # isu_id: str = int,
#     first_name: str
#     last_name: str
#     surname: str
#     group: str
#     dorm: int
#     room: int
#     date: datetime
]

numeric = ["isu_id", "dorm", "room"]


api_router = APIRouter()

@api_router.get("/api/health")
def check_health():
    return {"status": "ok"}

@api_router.get("/api/requests")
def get_requests(
                 sort_by: str,
                 asc: bool,
                 maxm: int,
                 minm: int,
                 exact_value: str
                 ):
    all = get_all_students()
    res_obj = {}
    if(sort_by in numeric) and (maxm):
        for k in all:
            res

@api_router.get("/api/requests/{id}")
def get_requests(id: int):
    return get_student_by_id(id)

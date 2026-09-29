from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from server.settings import BASE_DIR

from fastapi.middleware.cors import CORSMiddleware

from server.router.api import api_router
# from server.router.page import page_router
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException
from fastapi.exceptions import RequestValidationError



app = FastAPI()

@app.exception_handler(HTTPException)
async def http_error(request, error):
    detail = error.detail
    if not isinstance(detail, list):
        detail = [{"field": None, "message": str(detail)}]
    return JSONResponse(status_code=error.status_code, content={"detail": detail})

@app.exception_handler(RequestValidationError)
async def validation_error(request, error):
    detail = [{"field": str(item["loc"][-1]), "message": item["msg"]} for item in error.errors()]
    return JSONResponse(status_code=422, content={"detail": detail})

@app.exception_handler(Exception)
async def server_error(request, error):
    return JSONResponse(status_code=500, content={"detail": [{"field": None, "message": "Не удалось выполнить запрос на сервере."}]})

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:5500",  # Например, Live Server в VS Code
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Позволяет делать запросы с любого домена/порта
    allow_credentials=True,
    allow_methods=["*"],            # Разрешает любые HTTP-методы (GET, POST, PUT, DELETE и т.д.)
    allow_headers=["*"],            # Разрешает любые заголовки (Content-Type, Authorization и т.д.)
)

static = BASE_DIR / 'static'

print(static)

app.mount("/static", StaticFiles(directory= static), name="static")

app.include_router(api_router)
# app.include_router(page_router)


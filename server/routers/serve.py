from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from server.settings import BASE_DIR

from fastapi.middleware.cors import CORSMiddleware

from server.router.api import api_router
from server.router.page import page_router



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # Позволяет делать запросы с любого домена/порта
    allow_credentials=True,
    allow_methods=["*"],            # Разрешает любые HTTP-методы (GET, POST, PUT, DELETE и т.д.)
    allow_headers=["*"],            # Разрешает любые заголовки (Content-Type, Authorization и т.д.)
)

static = BASE_DIR / 'static'

print(static)

app.mount("/static", StaticFiles(directory= static), name="static")

app.include_router(api_router)
app.include_router(page_router)


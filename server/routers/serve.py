from fastapi import FastAPI
from server.routers.router import api_router

app = FastAPI()

app.include_router(api_router)
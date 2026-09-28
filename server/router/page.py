from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from server.settings import BASE_DIR
 
page_router = APIRouter()

TEMPLATE_DIR = BASE_DIR / 'templates'

templates = Jinja2Templates(TEMPLATE_DIR)

@page_router.get('/', response_class= HTMLResponse)
def get_page(request: Request):
    return templates.TemplateResponse(
        request= request,
        name= "table.html"
    )
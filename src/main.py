from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from src.routers.train import train_router

app = FastAPI(title="Desafio Detecção de Anomalias")

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")
templates = Jinja2Templates(directory="frontend/templates")

app.include_router(train_router)

@app.get("/", response_class=HTMLResponse, tags=["Frontend"])
async def login(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

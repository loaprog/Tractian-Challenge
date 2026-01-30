from fastapi import FastAPI

from src.routers.train import train_router

app = FastAPI(title="Desafio Detecção de Anomalias")
app.include_router(train_router)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API de Detecção de Anomalias!"}
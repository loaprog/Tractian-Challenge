from fastapi import FastAPI


app = FastAPI(title="Desafio Detecção de Anomalias")

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API de Detecção de Anomalias!"}
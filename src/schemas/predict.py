from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    timestamp: str = Field(..., description="Timestamp do ponto de dados")
    value: float = Field(..., description="Valor observado")

class PredictResponse(BaseModel):
    anomaly: bool
    model_version: str

from pydantic import BaseModel
from typing import List

class DataPoint(BaseModel):
    timestamp: int
    value: float

class TrainRequest(BaseModel):
    series_id: str
    data: List[DataPoint]

class TrainResponse(BaseModel):
    series_id: str
    model_version: int

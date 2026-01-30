from pydantic import BaseModel
from typing import List
from datetime import datetime

class DataPoint(BaseModel):
    timestamp: int
    value: float

class TrainRequest(BaseModel):
    series_id: str
    data: List[DataPoint]

class TrainResponse(BaseModel):
    series_id: str
    model_version: int

class TimeSeriesSchema(BaseModel):
    id: str
    series_id: str
    created_at: datetime

    class Config:
        orm_mode = True

class ModelSchema(BaseModel):
    id: int
    time_series_id: int
    series_name: str  
    version: int
    mean: float
    std: float
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True
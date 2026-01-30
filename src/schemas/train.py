from pydantic import BaseModel
from typing import List
from datetime import datetime
from datetime import date

class DataPoint(BaseModel):
    timestamp: int
    value: float

class TrainRequest(BaseModel):
    series_id: str
    data: List[DataPoint]

class TrainResponse(BaseModel):
    series_id: str
    model_version: int


class ModelSchema(BaseModel):
    id: int
    time_series_id: int
    series_name: str  
    version: int
    mean: float
    std: float
    is_active: bool
    created_at: datetime

class SeriesModelInfoSchema(BaseModel):
    time_series_id: int
    series_id: str
    current_version: int
    first_model_created_at: date | None
    last_model_created_at: date | None
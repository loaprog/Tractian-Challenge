from pydantic import BaseModel, Field
from typing import List, Sequence
from datetime import datetime
from datetime import date

class DataPoint(BaseModel):
    timestamp: int = Field(..., description="Unix timestamp of the time the data point was collected")
    value: float = Field(..., description="Value of the time series measured at timestamp")

class TimeSeries(BaseModel):
    data: Sequence[DataPoint] = Field(..., description="Ordered list of datapoints")

class TrainResponse(BaseModel):
    series_id: str
    model_version: int

class TrainFitRequest(BaseModel):
    timestamps: List[int] = Field(...)
    values: List[float] = Field(...)

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
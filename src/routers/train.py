from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from src.schemas.train import TrainRequest, TrainResponse, ModelSchema, SeriesModelInfoSchema
from src.database.postgresql import get_db  
from src.services.train import train_model, list_models, delete_series_and_models, get_series_with_model_info

train_router = APIRouter()

@train_router.post("/fit", response_model=TrainResponse, tags=["Train"])
def train(payload: TrainRequest, db: Session = Depends(get_db)):
    series_id, model_version = train_model(payload.series_id, payload.data, db)
    return TrainResponse(series_id=series_id, model_version=model_version)

@train_router.get("/series/", response_model=list[SeriesModelInfoSchema], tags=["TimeSeries"])
def get_series(db: Session = Depends(get_db)):
    return get_series_with_model_info(db)

@train_router.get("/models/", response_model=list[ModelSchema], tags=["Models"])
def get_models(db: Session = Depends(get_db)):
    return list_models(db)

@train_router.delete("/series/", tags=["TimeSeries"])
def delete_series(series_ids: List[int] = Query(..., description="IDs das séries"),db: Session = Depends(get_db)):
    return delete_series_and_models(series_ids, db)
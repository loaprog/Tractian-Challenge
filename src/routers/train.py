from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import numpy as np

from src.models.train import Model, TimeSeries
from src.schemas.train import TrainRequest, TrainResponse, ModelSchema
from src.database.postgresql import get_db  
from src.services.train import train_model, list_models, delete_series_and_models

train_router = APIRouter()

@train_router.post("/fit", response_model=TrainResponse, tags=["Train"])
def train(payload: TrainRequest, db: Session = Depends(get_db)):
    series_id, model_version = train_model(payload.series_id, payload.data, db)
    return TrainResponse(series_id=series_id, model_version=model_version)

@train_router.get("/models/", response_model=list[ModelSchema], tags=["Models"])
def get_models(db: Session = Depends(get_db)):
    return list_models(db)

@train_router.delete("/series/{series_id}", tags=["TimeSeries"])
def delete_series(series_id: str, db: Session = Depends(get_db)):
    return delete_series_and_models(series_id, db)
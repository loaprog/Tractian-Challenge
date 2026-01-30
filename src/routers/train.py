from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import numpy as np

from src.models.train import TimeSeries, Model
from src.schemas.train import TrainRequest, TrainResponse
from src.database.postgresql import get_db  
from src.services.train import train_model

train_router = APIRouter()

@train_router.post("/fit", response_model=TrainResponse, tags=["Train"])
def train(payload: TrainRequest, db: Session = Depends(get_db)):
    series_id, model_version = train_model(payload.series_id, payload.data, db)
    return TrainResponse(series_id=series_id, model_version=model_version)

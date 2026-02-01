from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.schemas.train import TrainResponse, SeriesModelInfoSchema, TrainFitRequest
from src.database.postgresql import get_db  
from src.services.train import train_model, delete_series_and_models, get_series_with_model_info

train_router = APIRouter()

@train_router.post("/fit/{series_id}", response_model=TrainResponse, tags=["Training"])
def train(series_id: str, payload: TrainFitRequest,db: Session = Depends(get_db)):
    series_id, model_version = train_model(series_id=series_id,payload=payload,db=db)
    return TrainResponse(series_id=series_id,model_version=model_version)

@train_router.get("/series/", response_model=list[SeriesModelInfoSchema], tags=["track"])
def get_series(db: Session = Depends(get_db)):
    return get_series_with_model_info(db)

@train_router.delete("/series/", tags=["track"])
def delete_series(series_ids: List[int] = Query(..., description="IDs das séries"),db: Session = Depends(get_db)):
    return delete_series_and_models(series_ids, db)
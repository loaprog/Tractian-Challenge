from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.schemas.predict import PredictRequest, PredictResponse
from src.services.predict import predict_point
from src.database.postgresql import get_db

predict_router = APIRouter()

@predict_router.post("/predict/{series_id}",response_model=PredictResponse,tags=["Prediction"])
def predict(series_id: str,payload: PredictRequest,version: str | None = Query(default=None),db: Session = Depends(get_db),):
    return predict_point(series_id=series_id,payload=payload,version=version,db=db,)

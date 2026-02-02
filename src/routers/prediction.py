from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from src.schemas.predict import PredictRequest, PredictResponse
from src.services.predict import predict_point, get_predictions_for_series_service
from src.database.postgresql import get_db
from src.models.train import TimeSeries, Model
from src.models.prediction import Prediction

predict_router = APIRouter()

@predict_router.post("/predict/{series_id}",response_model=PredictResponse,tags=["Prediction"])
def predict(series_id: str,payload: PredictRequest,version: str | None = Query(default=None),db: Session = Depends(get_db),):
    return predict_point(series_id=series_id,payload=payload,version=version,db=db,)

@predict_router.get("/series/{series_id}/predictions", tags=["Prediction"])
def get_predictions_for_series(series_id: str, db: Session = Depends(get_db)):
    return get_predictions_for_series_service(series_id, db)
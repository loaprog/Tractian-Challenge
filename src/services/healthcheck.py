from sqlalchemy.orm import Session
import numpy as np

from src.models.train import TimeSeries, Model
from src.models.prediction import Prediction
from src.schemas.healthcheck import HealthCheckResponse, Metrics


def get_health_metrics(db: Session) -> HealthCheckResponse:

    series_trained = db.query(TimeSeries).count()


    pred_latencies = db.query(Prediction.latency_ms).filter(Prediction.latency_ms.isnot(None)).all()
    pred_values = [l[0] for l in pred_latencies]
    if pred_values:
        inference_metrics = Metrics(
            avg=float(np.mean(pred_values)),
            p95=float(np.percentile(pred_values, 95))
        )
    else:
        inference_metrics = Metrics(avg=None, p95=None)


    train_latencies = db.query(Model.training_latency_ms).filter(Model.training_latency_ms.isnot(None)).all()
    train_values = [l[0] for l in train_latencies]
    if train_values:
        training_metrics = Metrics(
            avg=float(np.mean(train_values)),
            p95=float(np.percentile(train_values, 95))
        )
    else:
        training_metrics = Metrics(avg=None, p95=None)


    return HealthCheckResponse(
        series_trained=series_trained,
        inference_latency_ms=inference_metrics,
        training_latency_ms=training_metrics
    )
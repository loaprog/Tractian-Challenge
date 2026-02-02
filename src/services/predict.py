from fastapi import HTTPException
from sqlalchemy.orm import Session
import time

from src.models.train import TimeSeries, Model
from src.models.prediction import Prediction
from src.schemas.predict import PredictRequest


def predict_point(
    series_id: str,
    payload: PredictRequest,
    db: Session,
    version: str | None = None
):
    try:
        timestamp_int = int(payload.timestamp)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="timestamp deve ser string representando Unix timestamp"
        )

    if timestamp_int < 0:
        raise HTTPException(
            status_code=400,
            detail="timestamp deve ser >= 0"
        )

    ts = db.query(TimeSeries).filter_by(series_id=series_id).first()

    if not ts:
        raise HTTPException(
            status_code=404,
            detail="Série não encontrada"
        )

    model_query = db.query(Model).filter_by(time_series_id=ts.id)

    if version:
        try:
            version_int = int(version.replace("v", ""))
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Formato de versão inválido. Use v<number>"
            )
        model = model_query.filter_by(version=version_int).first()
    else:
        model = model_query.filter_by(is_active=True).first()

    if not model:
        raise HTTPException(
            status_code=404,
            detail="Modelo não encontrado para a série"
        )

    start = time.perf_counter()

    threshold = model.mean + 3 * model.std
    is_anomaly = payload.value > threshold

    latency_ms = (time.perf_counter() - start) * 1000

    prediction = Prediction(
        model_id=model.id,
        timestamp=timestamp_int,
        value=payload.value,
        is_anomaly=is_anomaly,
        latency_ms=latency_ms
    )

    db.add(prediction)
    db.commit()

    return {
        "anomaly": is_anomaly,
        "model_version": f"v{model.version}"
    }

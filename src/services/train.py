from sqlalchemy.orm import Session
import numpy as np
from fastapi import HTTPException

from src.models.train import TimeSeries, Model

def train_model(series_id: str, data: list, db: Session):
    series = db.query(TimeSeries).filter_by(series_id=series_id).first()
    if not series:
        series = TimeSeries(series_id=series_id)
        db.add(series)
        db.commit()
        db.refresh(series)

    values = [p.value for p in data]
    if len(values) < 2:
        raise HTTPException(status_code=400, detail="Dados insuficientes")
    mean = float(np.mean(values))
    std = float(np.std(values))

    last_model = (
        db.query(Model)
        .filter_by(time_series_id=series.id)
        .order_by(Model.version.desc())
        .first()
    )
    new_version = 1 if not last_model else last_model.version + 1

    db.query(Model).filter_by(time_series_id=series.id, is_active=True).update({"is_active": False})

    model = Model(
        time_series_id=series.id,
        version=new_version,
        mean=mean,
        std=std,
        is_active=True
    )
    db.add(model)
    db.commit()

    return series.series_id, new_version

def list_models(db: Session):
    return db.query(Model).all()

def delete_series_and_models(series_id: str, db: Session):
    series = db.query(TimeSeries).filter(TimeSeries.id == series_id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Série não encontrada")
    db.query(Model).filter(Model.time_series_id == series.id).delete()
    db.delete(series)
    db.commit()
    return {"detail": "Série e modelos vinculados deletados com sucesso"}
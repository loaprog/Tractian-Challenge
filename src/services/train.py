from sqlalchemy.orm import Session
import numpy as np
from fastapi import HTTPException
from sqlalchemy import func

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

def delete_series_and_models(series_ids: list[int], db: Session):
    series_list = (
        db.query(TimeSeries)
        .filter(TimeSeries.id.in_(series_ids))
        .all()
    )

    if not series_list:
        raise HTTPException(status_code=404, detail="Nenhuma série encontrada")

    series_db_ids = [s.id for s in series_list]

    db.query(Model).filter(
        Model.time_series_id.in_(series_db_ids)
    ).delete(synchronize_session=False)

    db.query(TimeSeries).filter(
        TimeSeries.id.in_(series_db_ids)
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "detail": f"{len(series_db_ids)} série(s) e modelos vinculados deletados com sucesso"
    }

def get_series_with_model_info(db: Session):
    results = (
        db.query(
            TimeSeries.id.label("time_series_id"),
            TimeSeries.series_id.label("series_id"),
            func.max(Model.version).label("current_version"),
            func.min(Model.created_at).label("first_model_created_at"),
            func.max(Model.created_at).label("last_model_created_at"),
        )
        .join(Model, Model.time_series_id == TimeSeries.id)
        .group_by(TimeSeries.id, TimeSeries.series_id)
        .all()
    )

    return [
        {
            "time_series_id": r.time_series_id,
            "series_id": r.series_id,
            "current_version": r.current_version,
            "first_model_created_at": (
                r.first_model_created_at.date()
                if r.first_model_created_at else None
            ),
            "last_model_created_at": (
                r.last_model_created_at.date()
                if r.last_model_created_at else None
            ),
        }
        for r in results
    ]
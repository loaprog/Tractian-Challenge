from sqlalchemy.orm import Session
import numpy as np
from fastapi import HTTPException
from sqlalchemy import func

from src.models.train import TimeSeries as TimeSeriesDB, Model
from src.schemas.train import TimeSeries, DataPoint, TrainFitRequest

def train_model(
    series_id: str,
    payload: TrainFitRequest,
    db: Session
):
    if len(payload.timestamps) != len(payload.values):
        raise HTTPException(
            status_code=400,
            detail="timestamps e values devem ter o mesmo tamanho"
        )

    timestamps = payload.timestamps
    if any(t < 0 for t in payload.timestamps):
        raise HTTPException(
            status_code=400,
            detail="timestamps devem ser Unix timestamp válido (>= 0)"
        )

    if timestamps != sorted(timestamps):
        raise HTTPException(
            status_code=400,
            detail="timestamps devem estar em ordem crescente"
        )
    
    if len(set(timestamps)) != len(timestamps):
        raise HTTPException(
            status_code=400,
            detail="timestamps não devem conter valores duplicados"
        )

    if len(payload.values) < 2:
        raise HTTPException(
            status_code=400,
            detail="Dados insuficientes para treino"
        )

    MAX_POINTS = 100_000 
    if len(payload.values) > MAX_POINTS:
        raise HTTPException(
            status_code=413,
            detail=f"Série excede limite de {MAX_POINTS} pontos"
        )

    series = TimeSeries(
        data=[
            DataPoint(timestamp=t, value=v)
            for t, v in zip(payload.timestamps, payload.values)
        ]
    )

    values = [p.value for p in series.data]

    mean = float(np.mean(values))
    std = float(np.std(values))

    if std == 0:
        raise HTTPException(
            status_code=400,
            detail="Não é válido treinar modelo com desvio padrão zero"
        )

    with db.begin():
        ts_db = (
            db.query(TimeSeriesDB)
            .filter_by(series_id=series_id)
            .first()
        )

        if not ts_db:
            ts_db = TimeSeriesDB(series_id=series_id)
            db.add(ts_db)
            db.flush()

        last_model = (
            db.query(Model)
            .filter_by(time_series_id=ts_db.id)
            .order_by(Model.version.desc())
            .first()
        )

        new_version = 1 if not last_model else last_model.version + 1

        db.query(Model).filter_by(
            time_series_id=ts_db.id,
            is_active=True
        ).update({"is_active": False})

        db.add(
            Model(
                time_series_id=ts_db.id,
                version=new_version,
                mean=mean,
                std=std,
                is_active=True
            )
        )

    return ts_db.series_id, new_version


def delete_series_and_models(series_ids: list[int], db: Session):
    series_list = (
        db.query(TimeSeriesDB)
        .filter(TimeSeriesDB.id.in_(series_ids))
        .all()
    )

    if not series_list:
        raise HTTPException(status_code=404, detail="Nenhuma série encontrada")

    series_db_ids = [s.id for s in series_list]

    db.query(Model).filter(
        Model.time_series_id.in_(series_db_ids)
    ).delete(synchronize_session=False)

    db.query(TimeSeriesDB).filter(
        TimeSeriesDB.id.in_(series_db_ids)
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "detail": f"{len(series_db_ids)} série(s) e modelos vinculados deletados com sucesso"
    }

def get_series_with_model_info(db: Session):
    results = (
        db.query(
            TimeSeriesDB.id.label("time_series_id"),
            TimeSeriesDB.series_id.label("series_id"),
            func.max(Model.version).label("current_version"),
            func.min(Model.created_at).label("first_model_created_at"),
            func.max(Model.created_at).label("last_model_created_at"),
        )
        .join(Model, Model.time_series_id == TimeSeriesDB.id)
        .group_by(TimeSeriesDB.id, TimeSeriesDB.series_id)
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
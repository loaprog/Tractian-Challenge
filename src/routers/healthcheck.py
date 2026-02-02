from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database.postgresql import get_db
from src.services.healthcheck import get_health_metrics
from src.schemas.healthcheck import HealthCheckResponse

healthcheck_router = APIRouter()


@healthcheck_router.get("/healthcheck", response_model=HealthCheckResponse, tags=["Health Check"])
def healthcheck(db: Session = Depends(get_db)) -> HealthCheckResponse:
    return get_health_metrics(db)
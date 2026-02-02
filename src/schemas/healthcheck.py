from pydantic import BaseModel
from typing import Optional

class Metrics(BaseModel):
    avg: Optional[float] = None
    p95: Optional[float] = None


class HealthCheckResponse(BaseModel):
    series_trained: int
    inference_latency_ms: Metrics
    training_latency_ms: Metrics
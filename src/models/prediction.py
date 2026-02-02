from sqlalchemy import Column, Integer, Float, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from sqlalchemy.orm import relationship

from src.configs.environments import Base


class Prediction(Base):
    __tablename__ = "predictions"
    __table_args__ = {'schema': 'anomalias'}

    id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey("anomalias.models.id"), nullable=False)
    timestamp = Column(Integer, nullable=False)
    value = Column(Float, nullable=False)
    is_anomaly = Column(Boolean, nullable=False)
    latency_ms = Column(Float, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    model = relationship("Model")  

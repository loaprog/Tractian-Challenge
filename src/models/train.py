# models/train.py
from sqlalchemy import Column, String, Boolean, Integer, Float, TIMESTAMP, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class TimeSeries(Base):
    __tablename__ = "time_series"
    __table_args__ = {'schema': 'anomalias'}

    id = Column(Integer, primary_key=True, autoincrement=True) 
    series_id = Column(String, unique=True, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    models = relationship("Model", back_populates="time_series", cascade="all, delete-orphan")

class Model(Base):
    __tablename__ = "models"
    __table_args__ = (
        UniqueConstraint('time_series_id', 'version', name='uix_model_version'),
        {'schema': 'anomalias'}
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    time_series_id = Column(Integer, ForeignKey("anomalias.time_series.id"), nullable=False)  
    version = Column(Integer, nullable=False)
    mean = Column(Float, nullable=False)
    std = Column(Float, nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    time_series = relationship("TimeSeries", back_populates="models")

    @property
    def series_name(self):
        return self.time_series.series_id if self.time_series else None
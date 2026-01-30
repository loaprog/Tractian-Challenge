from sqlalchemy import Column, String, Boolean, Integer, Float, TIMESTAMP, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class TimeSeries(Base):
    __tablename__ = "time_series"
    __table_args__ = {'schema': 'anomalias'}

    id = Column(Integer, primary_key=True, autoincrement=True) 
    series_id = Column(String, unique=True, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class Model(Base):
    __tablename__ = "models"
    __table_args__ = {'schema': 'anomalias'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    time_series_id = Column(Integer, ForeignKey("anomalias.time_series.id"), nullable=False)  
    version = Column(Integer, nullable=False)
    mean = Column(Float, nullable=False)
    std = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


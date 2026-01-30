CREATE SCHEMA IF NOT EXISTS anomalias;
SET search_path TO anomalias;

CREATE TABLE IF NOT EXISTS anomalias.time_series (
    id SERIAL PRIMARY KEY,
    series_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anomalias.models (
    id SERIAL PRIMARY KEY,
    time_series_id INT NOT NULL,
    version INTEGER NOT NULL,
    mean DOUBLE PRECISION NOT NULL,
    std DOUBLE PRECISION NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_models_time_series
        FOREIGN KEY (time_series_id)
        REFERENCES anomalias.time_series(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_models_series_version
        UNIQUE (time_series_id, version)
);

CREATE TABLE IF NOT EXISTS anomalias.predictions (
    id SERIAL PRIMARY KEY,
    model_id INT NOT NULL,
    timestamp BIGINT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    is_anomaly BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_predictions_models
        FOREIGN KEY (model_id)
        REFERENCES anomalias.models(id)
        ON DELETE CASCADE
);

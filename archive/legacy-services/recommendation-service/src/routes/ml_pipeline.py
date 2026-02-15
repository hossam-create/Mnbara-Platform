"""
API Routes for ML Pipeline Management
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from src.ml_pipeline import FeatureStore, RetrainingPipeline, ModelMonitor
from src.ml_pipeline.retraining_pipeline import (
    RetrainingConfig, TriggerType, PipelineStatus
)
from src.ml_pipeline.model_monitor import MetricType, AlertSeverity

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize components
feature_store = FeatureStore()
retraining_pipeline = RetrainingPipeline()
model_monitor = ModelMonitor()


# Request/Response Models
class FeatureRequest(BaseModel):
    """Request for feature retrieval"""
    entity_type: str
    entity_id: str
    feature_names: Optional[List[str]] = None


class FeatureResponse(BaseModel):
    """Response with feature values"""
    entity_id: str
    features: Dict[str, Any]


class RetrainingRequest(BaseModel):
    """Request to trigger retraining"""
    model_name: str
    trigger_type: str = "manual"


class RetrainingResponse(BaseModel):
    """Response from retraining trigger"""
    run_id: str
    model_name: str
    status: str
    started_at: datetime


class MetricRecordRequest(BaseModel):
    """Request to record a metric"""
    model_name: str
    model_version: str
    metric_type: str
    value: float
    metadata: Optional[Dict[str, Any]] = None


class MetricSummaryResponse(BaseModel):
    """Response with metric summary"""
    model_name: str
    summaries: Dict[str, Dict[str, Any]]


# Feature Store Endpoints
@router.post("/features/get", response_model=FeatureResponse)
async def get_features(request: FeatureRequest):
    """Get features for an entity"""
    try:
        features = await feature_store.get_features_for_entity(
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            feature_names=request.feature_names
        )
        
        return FeatureResponse(
            entity_id=request.entity_id,
            features=features
        )
    except Exception as e:
        logger.error(f"Feature retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/features/schema")
async def get_feature_schema():
    """Get schema of all registered features"""
    return feature_store.get_feature_schema()


@router.post("/features/batch")
async def batch_get_features(
    entity_type: str,
    entity_ids: List[str],
    feature_names: List[str]
):
    """Batch get features for multiple entities"""
    try:
        result = await feature_store.batch_get_features(
            entity_type=entity_type,
            entity_ids=entity_ids,
            feature_names=feature_names
        )
        return {"entities": result}
    except Exception as e:
        logger.error(f"Batch feature retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Retraining Pipeline Endpoints
@router.post("/retraining/trigger", response_model=RetrainingResponse)
async def trigger_retraining(request: RetrainingRequest):
    """Trigger model retraining"""
    try:
        trigger_type = TriggerType(request.trigger_type)
    except ValueError:
        trigger_type = TriggerType.MANUAL
    
    try:
        run = await retraining_pipeline.trigger_retraining(
            model_name=request.model_name,
            trigger_type=trigger_type
        )
        
        return RetrainingResponse(
            run_id=run.run_id,
            model_name=run.model_name,
            status=run.status.value,
            started_at=run.started_at
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Retraining trigger error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/retraining/status/{run_id}")
async def get_retraining_status(run_id: str):
    """Get status of a retraining run"""
    run = retraining_pipeline.get_run_status(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return {
        "run_id": run.run_id,
        "model_name": run.model_name,
        "status": run.status.value,
        "started_at": run.started_at,
        "completed_at": run.completed_at,
        "metrics": run.metrics,
        "error_message": run.error_message,
        "model_version": run.model_version
    }


@router.get("/retraining/history")
async def get_retraining_history(
    model_name: Optional[str] = None,
    limit: int = 10
):
    """Get recent retraining runs"""
    runs = retraining_pipeline.get_recent_runs(model_name, limit)
    
    return {
        "runs": [
            {
                "run_id": r.run_id,
                "model_name": r.model_name,
                "status": r.status.value,
                "trigger_type": r.trigger_type.value,
                "started_at": r.started_at,
                "completed_at": r.completed_at
            }
            for r in runs
        ]
    }


# Model Monitoring Endpoints
@router.post("/monitoring/record")
async def record_metric(request: MetricRecordRequest):
    """Record a model performance metric"""
    try:
        metric_type = MetricType(request.metric_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid metric type: {request.metric_type}"
        )
    
    alert = model_monitor.record_metric(
        model_name=request.model_name,
        model_version=request.model_version,
        metric_type=metric_type,
        value=request.value,
        metadata=request.metadata
    )
    
    return {
        "recorded": True,
        "alert": {
            "alert_id": alert.alert_id,
            "severity": alert.severity.value,
            "message": alert.message
        } if alert else None
    }


@router.get("/monitoring/summary/{model_name}", response_model=MetricSummaryResponse)
async def get_metrics_summary(
    model_name: str,
    window_minutes: int = 60
):
    """Get metrics summary for a model"""
    summaries = model_monitor.get_all_metrics_summary(
        model_name, window_minutes
    )
    
    return MetricSummaryResponse(
        model_name=model_name,
        summaries=summaries
    )


@router.get("/monitoring/alerts")
async def get_alerts(
    model_name: Optional[str] = None,
    severity: Optional[str] = None
):
    """Get active alerts"""
    sev = None
    if severity:
        try:
            sev = AlertSeverity(severity)
        except ValueError:
            pass
    
    alerts = model_monitor.get_active_alerts(model_name, sev)
    
    return {
        "alerts": [
            {
                "alert_id": a.alert_id,
                "model_name": a.model_name,
                "metric_type": a.metric_type.value,
                "severity": a.severity.value,
                "message": a.message,
                "current_value": a.current_value,
                "threshold_value": a.threshold_value,
                "created_at": a.created_at
            }
            for a in alerts
        ]
    }


@router.post("/monitoring/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Acknowledge an alert"""
    success = model_monitor.acknowledge_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"acknowledged": True}


@router.get("/monitoring/drift/{model_name}")
async def detect_drift(
    model_name: str,
    metric_type: str,
    baseline_hours: int = 24,
    current_hours: int = 1
):
    """Detect performance drift for a model"""
    try:
        mt = MetricType(metric_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid metric type: {metric_type}"
        )
    
    drift = model_monitor.detect_drift(
        model_name=model_name,
        metric_type=mt,
        baseline_window_hours=baseline_hours,
        current_window_hours=current_hours
    )
    
    if drift is None:
        return {"message": "Insufficient data for drift detection"}
    
    return drift

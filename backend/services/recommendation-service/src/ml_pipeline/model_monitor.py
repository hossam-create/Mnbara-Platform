"""
Model Performance Monitoring
Tracks model performance metrics and detects degradation
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
import os
import logging
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict
from enum import Enum
import statistics

logger = logging.getLogger(__name__)


class AlertSeverity(str, Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class MetricType(str, Enum):
    """Types of metrics to monitor"""
    ACCURACY = "accuracy"
    LATENCY = "latency"
    THROUGHPUT = "throughput"
    ERROR_RATE = "error_rate"
    CLICK_THROUGH_RATE = "click_through_rate"
    CONVERSION_RATE = "conversion_rate"
    COVERAGE = "coverage"
    DIVERSITY = "diversity"


@dataclass
class MetricThreshold:
    """Threshold configuration for a metric"""
    metric_type: MetricType
    warning_threshold: float
    critical_threshold: float
    comparison: str = "lt"  # lt, gt, eq
    window_minutes: int = 60


@dataclass
class MetricDataPoint:
    """A single metric data point"""
    metric_type: MetricType
    value: float
    model_name: str
    model_version: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Alert:
    """A monitoring alert"""
    alert_id: str
    model_name: str
    metric_type: MetricType
    severity: AlertSeverity
    message: str
    current_value: float
    threshold_value: float
    created_at: datetime = field(default_factory=datetime.utcnow)
    acknowledged: bool = False


class ModelMonitor:
    """
    Model Performance Monitor
    Tracks metrics, detects anomalies, and triggers alerts
    """
    
    def __init__(
        self,
        retention_hours: int = 168,  # 7 days
        alert_cooldown_minutes: int = 30
    ):
        """
        Initialize Model Monitor
        
        Args:
            retention_hours: How long to retain metric data
            alert_cooldown_minutes: Cooldown between repeated alerts
        """
        self.retention = timedelta(hours=retention_hours)
        self.alert_cooldown = timedelta(minutes=alert_cooldown_minutes)
        
        # Metric storage
        self.metrics: Dict[str, List[MetricDataPoint]] = defaultdict(list)
        
        # Threshold configurations
        self.thresholds: Dict[str, List[MetricThreshold]] = {}
        
        # Active alerts
        self.alerts: Dict[str, Alert] = {}
        
        # Last alert time per metric
        self._last_alert_time: Dict[str, datetime] = {}
        
        # Alert callbacks
        self._alert_callbacks: List[Callable] = []
        
        # Register default thresholds
        self._register_default_thresholds()
        
        logger.info("Model Monitor initialized")
    
    def _register_default_thresholds(self) -> None:
        """Register default monitoring thresholds"""
        default_thresholds = [
            MetricThreshold(
                metric_type=MetricType.ACCURACY,
                warning_threshold=0.80,
                critical_threshold=0.70,
                comparison="lt"
            ),
            MetricThreshold(
                metric_type=MetricType.LATENCY,
                warning_threshold=100,  # ms
                critical_threshold=500,
                comparison="gt"
            ),
            MetricThreshold(
                metric_type=MetricType.ERROR_RATE,
                warning_threshold=0.01,
                critical_threshold=0.05,
                comparison="gt"
            ),
            MetricThreshold(
                metric_type=MetricType.CLICK_THROUGH_RATE,
                warning_threshold=0.02,
                critical_threshold=0.01,
                comparison="lt"
            ),
        ]
        
        self.thresholds["default"] = default_thresholds
    
    def set_thresholds(
        self,
        model_name: str,
        thresholds: List[MetricThreshold]
    ) -> None:
        """Set custom thresholds for a model"""
        self.thresholds[model_name] = thresholds
    
    def register_alert_callback(self, callback: Callable) -> None:
        """Register a callback for alerts"""
        self._alert_callbacks.append(callback)
    
    def record_metric(
        self,
        model_name: str,
        model_version: str,
        metric_type: MetricType,
        value: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Alert]:
        """
        Record a metric data point
        
        Args:
            model_name: Name of the model
            model_version: Version of the model
            metric_type: Type of metric
            value: Metric value
            metadata: Additional metadata
        
        Returns:
            Alert if threshold violated, None otherwise
        """
        data_point = MetricDataPoint(
            metric_type=metric_type,
            value=value,
            model_name=model_name,
            model_version=model_version,
            metadata=metadata or {}
        )
        
        key = f"{model_name}:{metric_type.value}"
        self.metrics[key].append(data_point)
        
        # Cleanup old data
        self._cleanup_old_metrics(key)
        
        # Check thresholds
        alert = self._check_thresholds(model_name, metric_type, value)
        
        return alert
    
    def _cleanup_old_metrics(self, key: str) -> None:
        """Remove metrics older than retention period"""
        cutoff = datetime.utcnow() - self.retention
        self.metrics[key] = [
            m for m in self.metrics[key]
            if m.timestamp > cutoff
        ]
    
    def _check_thresholds(
        self,
        model_name: str,
        metric_type: MetricType,
        value: float
    ) -> Optional[Alert]:
        """Check if value violates any thresholds"""
        # Get thresholds for model or use defaults
        thresholds = self.thresholds.get(
            model_name,
            self.thresholds.get("default", [])
        )
        
        for threshold in thresholds:
            if threshold.metric_type != metric_type:
                continue
            
            violated = False
            severity = None
            threshold_value = None
            
            if threshold.comparison == "lt":
                if value < threshold.critical_threshold:
                    violated = True
                    severity = AlertSeverity.CRITICAL
                    threshold_value = threshold.critical_threshold
                elif value < threshold.warning_threshold:
                    violated = True
                    severity = AlertSeverity.WARNING
                    threshold_value = threshold.warning_threshold
            elif threshold.comparison == "gt":
                if value > threshold.critical_threshold:
                    violated = True
                    severity = AlertSeverity.CRITICAL
                    threshold_value = threshold.critical_threshold
                elif value > threshold.warning_threshold:
                    violated = True
                    severity = AlertSeverity.WARNING
                    threshold_value = threshold.warning_threshold
            
            if violated:
                return self._create_alert(
                    model_name, metric_type, severity,
                    value, threshold_value
                )
        
        return None
    
    def _create_alert(
        self,
        model_name: str,
        metric_type: MetricType,
        severity: AlertSeverity,
        current_value: float,
        threshold_value: float
    ) -> Optional[Alert]:
        """Create an alert if not in cooldown"""
        alert_key = f"{model_name}:{metric_type.value}"
        
        # Check cooldown
        last_alert = self._last_alert_time.get(alert_key)
        if last_alert and (datetime.utcnow() - last_alert) < self.alert_cooldown:
            return None
        
        alert_id = f"{alert_key}:{datetime.utcnow().timestamp()}"
        
        alert = Alert(
            alert_id=alert_id,
            model_name=model_name,
            metric_type=metric_type,
            severity=severity,
            message=f"{metric_type.value} is {current_value:.4f}, threshold is {threshold_value:.4f}",
            current_value=current_value,
            threshold_value=threshold_value
        )
        
        self.alerts[alert_id] = alert
        self._last_alert_time[alert_key] = datetime.utcnow()
        
        # Notify callbacks
        for callback in self._alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                logger.error(f"Alert callback error: {e}")
        
        logger.warning(f"Alert created: {alert.message}")
        return alert
    
    def get_metrics_summary(
        self,
        model_name: str,
        metric_type: MetricType,
        window_minutes: int = 60
    ) -> Dict[str, Any]:
        """
        Get summary statistics for a metric
        
        Args:
            model_name: Name of the model
            metric_type: Type of metric
            window_minutes: Time window for summary
        
        Returns:
            Summary statistics
        """
        key = f"{model_name}:{metric_type.value}"
        cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
        
        recent_metrics = [
            m.value for m in self.metrics.get(key, [])
            if m.timestamp > cutoff
        ]
        
        if not recent_metrics:
            return {
                "count": 0,
                "mean": None,
                "min": None,
                "max": None,
                "std": None
            }
        
        return {
            "count": len(recent_metrics),
            "mean": statistics.mean(recent_metrics),
            "min": min(recent_metrics),
            "max": max(recent_metrics),
            "std": statistics.stdev(recent_metrics) if len(recent_metrics) > 1 else 0
        }
    
    def get_all_metrics_summary(
        self,
        model_name: str,
        window_minutes: int = 60
    ) -> Dict[str, Dict[str, Any]]:
        """Get summary for all metrics of a model"""
        summaries = {}
        
        for metric_type in MetricType:
            summary = self.get_metrics_summary(
                model_name, metric_type, window_minutes
            )
            if summary["count"] > 0:
                summaries[metric_type.value] = summary
        
        return summaries
    
    def get_active_alerts(
        self,
        model_name: Optional[str] = None,
        severity: Optional[AlertSeverity] = None
    ) -> List[Alert]:
        """Get active (unacknowledged) alerts"""
        alerts = [
            a for a in self.alerts.values()
            if not a.acknowledged
        ]
        
        if model_name:
            alerts = [a for a in alerts if a.model_name == model_name]
        
        if severity:
            alerts = [a for a in alerts if a.severity == severity]
        
        return sorted(alerts, key=lambda a: a.created_at, reverse=True)
    
    def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge an alert"""
        if alert_id in self.alerts:
            self.alerts[alert_id].acknowledged = True
            return True
        return False
    
    def detect_drift(
        self,
        model_name: str,
        metric_type: MetricType,
        baseline_window_hours: int = 24,
        current_window_hours: int = 1
    ) -> Optional[Dict[str, Any]]:
        """
        Detect performance drift by comparing recent to baseline
        
        Args:
            model_name: Name of the model
            metric_type: Type of metric
            baseline_window_hours: Hours for baseline period
            current_window_hours: Hours for current period
        
        Returns:
            Drift analysis or None if insufficient data
        """
        key = f"{model_name}:{metric_type.value}"
        now = datetime.utcnow()
        
        baseline_start = now - timedelta(hours=baseline_window_hours)
        current_start = now - timedelta(hours=current_window_hours)
        
        all_metrics = self.metrics.get(key, [])
        
        baseline_values = [
            m.value for m in all_metrics
            if baseline_start <= m.timestamp < current_start
        ]
        
        current_values = [
            m.value for m in all_metrics
            if m.timestamp >= current_start
        ]
        
        if len(baseline_values) < 10 or len(current_values) < 5:
            return None
        
        baseline_mean = statistics.mean(baseline_values)
        current_mean = statistics.mean(current_values)
        
        drift_pct = (current_mean - baseline_mean) / baseline_mean if baseline_mean != 0 else 0
        
        return {
            "metric_type": metric_type.value,
            "baseline_mean": baseline_mean,
            "current_mean": current_mean,
            "drift_percentage": drift_pct,
            "drift_detected": abs(drift_pct) > 0.1,  # 10% threshold
            "baseline_samples": len(baseline_values),
            "current_samples": len(current_values)
        }


# Global instance
model_monitor = ModelMonitor()

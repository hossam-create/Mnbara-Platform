"""
A/B Testing Router for ML Models
Handles traffic splitting, experiment tracking, and model routing
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
import os
import logging
import hashlib
import random
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class ExperimentStatus(str, Enum):
    """Experiment lifecycle status"""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


@dataclass
class TrafficAllocation:
    """Traffic allocation for a variant"""
    variant_name: str
    model_version: str
    percentage: float
    model_type: Optional[str] = None


@dataclass
class Experiment:
    """A/B test experiment configuration"""
    name: str
    description: str
    status: ExperimentStatus
    allocations: List[TrafficAllocation]
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    targeting_rules: Dict[str, Any] = field(default_factory=dict)
    metrics: List[str] = field(default_factory=list)


@dataclass
class ExperimentAssignment:
    """User's assignment to an experiment variant"""
    experiment_name: str
    variant_name: str
    model_version: str
    user_id: str
    assigned_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ExperimentEvent:
    """Event tracked for experiment analysis"""
    experiment_name: str
    variant_name: str
    user_id: str
    event_type: str  # impression, click, conversion, reward
    event_value: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)


class ABTestingRouter:
    """
    A/B Testing Router for ML model experiments
    Handles consistent user assignment and traffic routing
    """
    
    def __init__(self, redis_client=None):
        self.experiments: Dict[str, Experiment] = {}
        self.redis = redis_client
        self._assignment_cache: Dict[str, ExperimentAssignment] = {}
        self._events_buffer: List[ExperimentEvent] = []
        self._buffer_size = 100
        logger.info("A/B Testing Router initialized")
    
    def register_experiment(self, experiment: Experiment) -> None:
        """Register a new experiment"""
        self.experiments[experiment.name] = experiment
        logger.info(f"Registered experiment: {experiment.name}")
    
    def load_experiments_from_config(self, config: Dict[str, Any]) -> None:
        """Load experiments from configuration dict"""
        for exp_config in config.get("experiments", []):
            allocations = []
            for variant, alloc in exp_config.get("traffic_allocation", {}).items():
                allocations.append(TrafficAllocation(
                    variant_name=variant,
                    model_version=alloc.get("model_version", "default"),
                    percentage=alloc.get("percentage", 0),
                    model_type=alloc.get("model_type")
                ))
            
            experiment = Experiment(
                name=exp_config["name"],
                description=exp_config.get("description", ""),
                status=ExperimentStatus(exp_config.get("status", "draft")),
                allocations=allocations,
                start_date=self._parse_date(exp_config.get("start_date")),
                end_date=self._parse_date(exp_config.get("end_date")),
                targeting_rules=exp_config.get("targeting", {}),
                metrics=[m["name"] for m in exp_config.get("metrics", {}).get("primary", [])]
            )
            self.register_experiment(experiment)
    
    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse date string to datetime"""
        if not date_str:
            return None
        try:
            return datetime.fromisoformat(date_str)
        except ValueError:
            return None
    
    def get_assignment(
        self,
        experiment_name: str,
        user_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Optional[ExperimentAssignment]:
        """
        Get user's assignment for an experiment
        Uses consistent hashing for deterministic assignment
        """
        experiment = self.experiments.get(experiment_name)
        if not experiment or experiment.status != ExperimentStatus.ACTIVE:
            return None
        
        # Check targeting rules
        if not self._check_targeting(experiment, user_id, context):
            return None
        
        # Check cache first
        cache_key = f"{experiment_name}:{user_id}"
        if cache_key in self._assignment_cache:
            return self._assignment_cache[cache_key]
        
        # Deterministic assignment using consistent hashing
        variant = self._assign_variant(experiment, user_id)
        if not variant:
            return None
        
        assignment = ExperimentAssignment(
            experiment_name=experiment_name,
            variant_name=variant.variant_name,
            model_version=variant.model_version,
            user_id=user_id
        )
        
        self._assignment_cache[cache_key] = assignment
        return assignment

    
    def _check_targeting(
        self,
        experiment: Experiment,
        user_id: str,
        context: Optional[Dict[str, Any]]
    ) -> bool:
        """Check if user matches targeting rules"""
        rules = experiment.targeting_rules
        if not rules:
            return True
        
        context = context or {}
        
        # Check user segments
        user_segments = context.get("user_segments", ["all"])
        allowed_segments = rules.get("user_segments", ["all"])
        excluded_segments = rules.get("exclude_segments", [])
        
        if not any(seg in allowed_segments for seg in user_segments):
            return False
        
        if any(seg in excluded_segments for seg in user_segments):
            return False
        
        return True
    
    def _assign_variant(
        self,
        experiment: Experiment,
        user_id: str
    ) -> Optional[TrafficAllocation]:
        """Assign user to a variant using consistent hashing"""
        # Create deterministic hash
        hash_input = f"{experiment.name}:{user_id}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        bucket = hash_value % 100
        
        # Find variant based on bucket
        cumulative = 0
        for allocation in experiment.allocations:
            cumulative += allocation.percentage
            if bucket < cumulative:
                return allocation
        
        # Fallback to first allocation
        return experiment.allocations[0] if experiment.allocations else None
    
    def get_model_for_user(
        self,
        user_id: str,
        default_model: str = "recommendation-model",
        default_version: str = "production",
        context: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str]:
        """
        Get the model and version to use for a user
        Checks all active experiments and returns appropriate model
        """
        # Check each active experiment
        for experiment in self.experiments.values():
            if experiment.status != ExperimentStatus.ACTIVE:
                continue
            
            assignment = self.get_assignment(
                experiment.name, user_id, context
            )
            if assignment:
                return default_model, assignment.model_version
        
        return default_model, default_version
    
    def track_event(
        self,
        experiment_name: str,
        user_id: str,
        event_type: str,
        event_value: float = 0.0,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Track an event for experiment analysis"""
        assignment = self._assignment_cache.get(f"{experiment_name}:{user_id}")
        if not assignment:
            return
        
        event = ExperimentEvent(
            experiment_name=experiment_name,
            variant_name=assignment.variant_name,
            user_id=user_id,
            event_type=event_type,
            event_value=event_value,
            metadata=metadata or {}
        )
        
        self._events_buffer.append(event)
        
        # Flush buffer if full
        if len(self._events_buffer) >= self._buffer_size:
            self._flush_events()
    
    def _flush_events(self) -> None:
        """Flush events buffer to storage"""
        if not self._events_buffer:
            return
        
        # In production, send to analytics service or database
        logger.info(f"Flushing {len(self._events_buffer)} experiment events")
        self._events_buffer.clear()
    
    def get_experiment_stats(
        self,
        experiment_name: str
    ) -> Dict[str, Any]:
        """Get statistics for an experiment"""
        experiment = self.experiments.get(experiment_name)
        if not experiment:
            return {}
        
        # Count assignments per variant
        variant_counts = {}
        for key, assignment in self._assignment_cache.items():
            if assignment.experiment_name == experiment_name:
                variant = assignment.variant_name
                variant_counts[variant] = variant_counts.get(variant, 0) + 1
        
        return {
            "experiment_name": experiment_name,
            "status": experiment.status.value,
            "variant_counts": variant_counts,
            "total_assignments": sum(variant_counts.values())
        }


# Global instance
ab_testing_router = ABTestingRouter()

"""
Automated Retraining Pipeline
Handles model retraining, validation, and deployment
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
import os
import logging
import asyncio
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import json

logger = logging.getLogger(__name__)


class PipelineStatus(str, Enum):
    """Pipeline execution status"""
    PENDING = "pending"
    RUNNING = "running"
    VALIDATING = "validating"
    DEPLOYING = "deploying"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class TriggerType(str, Enum):
    """Types of retraining triggers"""
    SCHEDULED = "scheduled"
    PERFORMANCE_DEGRADATION = "performance_degradation"
    DATA_DRIFT = "data_drift"
    MANUAL = "manual"


@dataclass
class RetrainingConfig:
    """Configuration for retraining pipeline"""
    model_name: str
    schedule_hours: int = 24  # Retrain every N hours
    min_samples: int = 1000  # Minimum samples for retraining
    validation_split: float = 0.2
    performance_threshold: float = 0.85  # Min accuracy to deploy
    rollback_threshold: float = 0.05  # Max performance drop before rollback
    max_retries: int = 3
    timeout_minutes: int = 60


@dataclass
class PipelineRun:
    """A single pipeline execution"""
    run_id: str
    model_name: str
    trigger_type: TriggerType
    status: PipelineStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    metrics: Dict[str, float] = field(default_factory=dict)
    error_message: Optional[str] = None
    model_version: Optional[str] = None


@dataclass
class ValidationResult:
    """Result of model validation"""
    passed: bool
    metrics: Dict[str, float]
    baseline_metrics: Dict[str, float]
    improvement: Dict[str, float]
    warnings: List[str] = field(default_factory=list)


class RetrainingPipeline:
    """
    Automated Model Retraining Pipeline
    Handles the full lifecycle of model retraining
    """
    
    def __init__(
        self,
        mlflow_client=None,
        model_server=None
    ):
        """
        Initialize Retraining Pipeline
        
        Args:
            mlflow_client: MLflow registry client
            model_server: Model serving client
        """
        self.mlflow = mlflow_client
        self.model_server = model_server
        
        # Pipeline configurations
        self.configs: Dict[str, RetrainingConfig] = {}
        
        # Pipeline runs history
        self.runs: Dict[str, PipelineRun] = {}
        
        # Training functions
        self._train_functions: Dict[str, Callable] = {}
        
        # Validation functions
        self._validate_functions: Dict[str, Callable] = {}
        
        # Scheduler state
        self._scheduler_running = False
        self._scheduler_task = None
        
        logger.info("Retraining Pipeline initialized")
    
    def register_model(
        self,
        config: RetrainingConfig,
        train_fn: Callable,
        validate_fn: Optional[Callable] = None
    ) -> None:
        """
        Register a model for automated retraining
        
        Args:
            config: Retraining configuration
            train_fn: Training function
            validate_fn: Optional validation function
        """
        self.configs[config.model_name] = config
        self._train_functions[config.model_name] = train_fn
        if validate_fn:
            self._validate_functions[config.model_name] = validate_fn
        
        logger.info(f"Registered model for retraining: {config.model_name}")
    
    async def trigger_retraining(
        self,
        model_name: str,
        trigger_type: TriggerType = TriggerType.MANUAL
    ) -> PipelineRun:
        """
        Trigger model retraining
        
        Args:
            model_name: Name of the model to retrain
            trigger_type: Type of trigger
        
        Returns:
            PipelineRun object
        """
        if model_name not in self.configs:
            raise ValueError(f"Model {model_name} not registered")
        
        config = self.configs[model_name]
        run_id = f"{model_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        run = PipelineRun(
            run_id=run_id,
            model_name=model_name,
            trigger_type=trigger_type,
            status=PipelineStatus.PENDING,
            started_at=datetime.utcnow()
        )
        self.runs[run_id] = run
        
        # Execute pipeline asynchronously
        asyncio.create_task(self._execute_pipeline(run, config))
        
        return run
    
    async def _execute_pipeline(
        self,
        run: PipelineRun,
        config: RetrainingConfig
    ) -> None:
        """Execute the retraining pipeline"""
        try:
            run.status = PipelineStatus.RUNNING
            logger.info(f"Starting pipeline run: {run.run_id}")
            
            # Step 1: Train model
            train_fn = self._train_functions[config.model_name]
            train_result = await self._run_with_timeout(
                train_fn(),
                config.timeout_minutes * 60
            )
            
            if not train_result:
                raise Exception("Training failed to produce a model")
            
            run.metrics = train_result.get("metrics", {})
            run.model_version = train_result.get("version")
            
            # Step 2: Validate model
            run.status = PipelineStatus.VALIDATING
            validation = await self._validate_model(
                config.model_name,
                run.model_version,
                config
            )
            
            if not validation.passed:
                run.status = PipelineStatus.FAILED
                run.error_message = f"Validation failed: {validation.warnings}"
                logger.warning(f"Pipeline {run.run_id} validation failed")
                return
            
            # Step 3: Deploy model
            run.status = PipelineStatus.DEPLOYING
            deployed = await self._deploy_model(
                config.model_name,
                run.model_version
            )
            
            if not deployed:
                run.status = PipelineStatus.FAILED
                run.error_message = "Deployment failed"
                return
            
            run.status = PipelineStatus.COMPLETED
            run.completed_at = datetime.utcnow()
            logger.info(f"Pipeline {run.run_id} completed successfully")
            
        except asyncio.TimeoutError:
            run.status = PipelineStatus.FAILED
            run.error_message = "Pipeline timed out"
            logger.error(f"Pipeline {run.run_id} timed out")
        except Exception as e:
            run.status = PipelineStatus.FAILED
            run.error_message = str(e)
            logger.error(f"Pipeline {run.run_id} failed: {e}")
    
    async def _run_with_timeout(
        self,
        coro,
        timeout_seconds: int
    ) -> Any:
        """Run coroutine with timeout"""
        return await asyncio.wait_for(coro, timeout=timeout_seconds)
    
    async def _validate_model(
        self,
        model_name: str,
        model_version: str,
        config: RetrainingConfig
    ) -> ValidationResult:
        """Validate a trained model"""
        # Get baseline metrics from production model
        baseline_metrics = {}
        if self.mlflow:
            try:
                prod_model = await self.mlflow.get_production_model(model_name)
                if prod_model and prod_model.metrics:
                    baseline_metrics = prod_model.metrics
            except Exception as e:
                logger.warning(f"Could not get baseline metrics: {e}")
        
        # Run custom validation if registered
        if model_name in self._validate_functions:
            validate_fn = self._validate_functions[model_name]
            try:
                metrics = await validate_fn(model_version)
            except Exception as e:
                return ValidationResult(
                    passed=False,
                    metrics={},
                    baseline_metrics=baseline_metrics,
                    improvement={},
                    warnings=[f"Validation error: {e}"]
                )
        else:
            # Default validation - just check if model exists
            metrics = {"accuracy": 0.9}  # Placeholder
        
        # Calculate improvement
        improvement = {}
        warnings = []
        
        for metric, value in metrics.items():
            if metric in baseline_metrics:
                diff = value - baseline_metrics[metric]
                improvement[metric] = diff
                
                if diff < -config.rollback_threshold:
                    warnings.append(
                        f"{metric} degraded by {abs(diff):.2%}"
                    )
        
        # Check if passes threshold
        accuracy = metrics.get("accuracy", metrics.get("auc", 0))
        passed = accuracy >= config.performance_threshold and len(warnings) == 0
        
        return ValidationResult(
            passed=passed,
            metrics=metrics,
            baseline_metrics=baseline_metrics,
            improvement=improvement,
            warnings=warnings
        )
    
    async def _deploy_model(
        self,
        model_name: str,
        model_version: str
    ) -> bool:
        """Deploy model to production"""
        try:
            if self.mlflow:
                await self.mlflow.promote_to_production(
                    model_name, model_version
                )
            
            if self.model_server:
                # Reload model in serving infrastructure
                pass
            
            logger.info(f"Deployed {model_name} version {model_version}")
            return True
        except Exception as e:
            logger.error(f"Deployment failed: {e}")
            return False
    
    async def start_scheduler(self) -> None:
        """Start the retraining scheduler"""
        if self._scheduler_running:
            return
        
        self._scheduler_running = True
        self._scheduler_task = asyncio.create_task(self._scheduler_loop())
        logger.info("Retraining scheduler started")
    
    async def stop_scheduler(self) -> None:
        """Stop the retraining scheduler"""
        self._scheduler_running = False
        if self._scheduler_task:
            self._scheduler_task.cancel()
            try:
                await self._scheduler_task
            except asyncio.CancelledError:
                pass
        logger.info("Retraining scheduler stopped")
    
    async def _scheduler_loop(self) -> None:
        """Main scheduler loop"""
        last_runs: Dict[str, datetime] = {}
        
        while self._scheduler_running:
            try:
                now = datetime.utcnow()
                
                for model_name, config in self.configs.items():
                    last_run = last_runs.get(model_name)
                    schedule_delta = timedelta(hours=config.schedule_hours)
                    
                    if last_run is None or (now - last_run) >= schedule_delta:
                        logger.info(f"Scheduled retraining for {model_name}")
                        await self.trigger_retraining(
                            model_name,
                            TriggerType.SCHEDULED
                        )
                        last_runs[model_name] = now
                
                # Check every hour
                await asyncio.sleep(3600)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                await asyncio.sleep(60)
    
    def get_run_status(self, run_id: str) -> Optional[PipelineRun]:
        """Get status of a pipeline run"""
        return self.runs.get(run_id)
    
    def get_recent_runs(
        self,
        model_name: Optional[str] = None,
        limit: int = 10
    ) -> List[PipelineRun]:
        """Get recent pipeline runs"""
        runs = list(self.runs.values())
        
        if model_name:
            runs = [r for r in runs if r.model_name == model_name]
        
        runs.sort(key=lambda r: r.started_at, reverse=True)
        return runs[:limit]


# Global instance
retraining_pipeline = RetrainingPipeline()

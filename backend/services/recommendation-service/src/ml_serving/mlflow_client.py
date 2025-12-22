"""
MLflow Model Registry Client
Handles model registration, versioning, and lifecycle management
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
import os
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)


class ModelStage(str, Enum):
    """Model lifecycle stages"""
    NONE = "None"
    STAGING = "Staging"
    PRODUCTION = "Production"
    ARCHIVED = "Archived"


@dataclass
class ModelVersion:
    """Represents a model version in the registry"""
    name: str
    version: str
    stage: ModelStage
    run_id: str
    artifact_uri: str
    creation_timestamp: datetime
    last_updated_timestamp: datetime
    description: Optional[str] = None
    tags: Optional[Dict[str, str]] = None
    metrics: Optional[Dict[str, float]] = None


@dataclass
class RegisteredModel:
    """Represents a registered model"""
    name: str
    creation_timestamp: datetime
    last_updated_timestamp: datetime
    description: Optional[str] = None
    tags: Optional[Dict[str, str]] = None
    latest_versions: Optional[List[ModelVersion]] = None


class MLflowModelRegistry:
    """
    Client for MLflow Model Registry
    Provides model registration, versioning, and stage transitions
    """
    
    def __init__(
        self,
        tracking_uri: Optional[str] = None,
        timeout: float = 30.0
    ):
        self.tracking_uri = tracking_uri or os.getenv(
            "MLFLOW_TRACKING_URI", 
            "http://mlflow-server:5000"
        )
        self.timeout = timeout
        self._client = httpx.AsyncClient(
            base_url=self.tracking_uri,
            timeout=timeout
        )
        logger.info(f"MLflow client initialized with URI: {self.tracking_uri}")
    
    async def close(self):
        """Close the HTTP client"""
        await self._client.aclose()
    
    async def health_check(self) -> bool:
        """Check if MLflow server is healthy"""
        try:
            response = await self._client.get("/health")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"MLflow health check failed: {e}")
            return False
    
    async def create_registered_model(
        self,
        name: str,
        description: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None
    ) -> RegisteredModel:
        """Create a new registered model"""
        payload = {"name": name}
        if description:
            payload["description"] = description
        if tags:
            payload["tags"] = [{"key": k, "value": v} for k, v in tags.items()]
        
        try:
            response = await self._client.post(
                "/api/2.0/mlflow/registered-models/create",
                json=payload
            )
            response.raise_for_status()
            data = response.json()["registered_model"]
            
            return RegisteredModel(
                name=data["name"],
                creation_timestamp=datetime.fromtimestamp(
                    int(data.get("creation_timestamp", 0)) / 1000
                ),
                last_updated_timestamp=datetime.fromtimestamp(
                    int(data.get("last_updated_timestamp", 0)) / 1000
                ),
                description=data.get("description"),
                tags={t["key"]: t["value"] for t in data.get("tags", [])}
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 400:
                # Model might already exist
                logger.warning(f"Model {name} may already exist: {e}")
                return await self.get_registered_model(name)
            raise
    
    async def get_registered_model(self, name: str) -> Optional[RegisteredModel]:
        """Get a registered model by name"""
        try:
            response = await self._client.get(
                "/api/2.0/mlflow/registered-models/get",
                params={"name": name}
            )
            response.raise_for_status()
            data = response.json()["registered_model"]
            
            latest_versions = []
            for v in data.get("latest_versions", []):
                latest_versions.append(self._parse_model_version(v))
            
            return RegisteredModel(
                name=data["name"],
                creation_timestamp=datetime.fromtimestamp(
                    int(data.get("creation_timestamp", 0)) / 1000
                ),
                last_updated_timestamp=datetime.fromtimestamp(
                    int(data.get("last_updated_timestamp", 0)) / 1000
                ),
                description=data.get("description"),
                tags={t["key"]: t["value"] for t in data.get("tags", [])},
                latest_versions=latest_versions
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise
    
    async def create_model_version(
        self,
        name: str,
        source: str,
        run_id: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None
    ) -> ModelVersion:
        """Create a new model version"""
        payload = {
            "name": name,
            "source": source
        }
        if run_id:
            payload["run_id"] = run_id
        if description:
            payload["description"] = description
        if tags:
            payload["tags"] = [{"key": k, "value": v} for k, v in tags.items()]
        
        response = await self._client.post(
            "/api/2.0/mlflow/model-versions/create",
            json=payload
        )
        response.raise_for_status()
        data = response.json()["model_version"]
        
        return self._parse_model_version(data)
    
    async def get_model_version(
        self,
        name: str,
        version: str
    ) -> Optional[ModelVersion]:
        """Get a specific model version"""
        try:
            response = await self._client.get(
                "/api/2.0/mlflow/model-versions/get",
                params={"name": name, "version": version}
            )
            response.raise_for_status()
            data = response.json()["model_version"]
            return self._parse_model_version(data)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise
    
    async def get_latest_versions(
        self,
        name: str,
        stages: Optional[List[str]] = None
    ) -> List[ModelVersion]:
        """Get latest versions for each stage"""
        params = {"name": name}
        if stages:
            params["stages"] = stages
        
        response = await self._client.get(
            "/api/2.0/mlflow/registered-models/get-latest-versions",
            params=params
        )
        response.raise_for_status()
        
        versions = []
        for v in response.json().get("model_versions", []):
            versions.append(self._parse_model_version(v))
        
        return versions
    
    async def transition_model_version_stage(
        self,
        name: str,
        version: str,
        stage: ModelStage,
        archive_existing: bool = True
    ) -> ModelVersion:
        """Transition a model version to a new stage"""
        payload = {
            "name": name,
            "version": version,
            "stage": stage.value,
            "archive_existing_versions": archive_existing
        }
        
        response = await self._client.post(
            "/api/2.0/mlflow/model-versions/transition-stage",
            json=payload
        )
        response.raise_for_status()
        data = response.json()["model_version"]
        
        logger.info(f"Model {name} version {version} transitioned to {stage.value}")
        return self._parse_model_version(data)
    
    async def get_production_model(self, name: str) -> Optional[ModelVersion]:
        """Get the current production model version"""
        versions = await self.get_latest_versions(name, stages=["Production"])
        return versions[0] if versions else None
    
    async def get_staging_model(self, name: str) -> Optional[ModelVersion]:
        """Get the current staging model version"""
        versions = await self.get_latest_versions(name, stages=["Staging"])
        return versions[0] if versions else None
    
    async def promote_to_production(
        self,
        name: str,
        version: str
    ) -> ModelVersion:
        """Promote a model version to production"""
        return await self.transition_model_version_stage(
            name=name,
            version=version,
            stage=ModelStage.PRODUCTION,
            archive_existing=True
        )
    
    async def log_model_metrics(
        self,
        run_id: str,
        metrics: Dict[str, float]
    ) -> None:
        """Log metrics for a model run"""
        timestamp = int(datetime.now().timestamp() * 1000)
        
        for key, value in metrics.items():
            payload = {
                "run_id": run_id,
                "key": key,
                "value": value,
                "timestamp": timestamp
            }
            
            response = await self._client.post(
                "/api/2.0/mlflow/runs/log-metric",
                json=payload
            )
            response.raise_for_status()
    
    async def search_model_versions(
        self,
        filter_string: Optional[str] = None,
        max_results: int = 100
    ) -> List[ModelVersion]:
        """Search for model versions"""
        params = {"max_results": max_results}
        if filter_string:
            params["filter"] = filter_string
        
        response = await self._client.get(
            "/api/2.0/mlflow/model-versions/search",
            params=params
        )
        response.raise_for_status()
        
        versions = []
        for v in response.json().get("model_versions", []):
            versions.append(self._parse_model_version(v))
        
        return versions
    
    def _parse_model_version(self, data: Dict[str, Any]) -> ModelVersion:
        """Parse model version from API response"""
        return ModelVersion(
            name=data["name"],
            version=data["version"],
            stage=ModelStage(data.get("current_stage", "None")),
            run_id=data.get("run_id", ""),
            artifact_uri=data.get("source", ""),
            creation_timestamp=datetime.fromtimestamp(
                int(data.get("creation_timestamp", 0)) / 1000
            ),
            last_updated_timestamp=datetime.fromtimestamp(
                int(data.get("last_updated_timestamp", 0)) / 1000
            ),
            description=data.get("description"),
            tags={t["key"]: t["value"] for t in data.get("tags", [])}
        )


# Global instance
mlflow_registry = MLflowModelRegistry()

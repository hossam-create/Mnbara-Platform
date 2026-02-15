"""
Model Server Client for TorchServe/TensorFlow Serving
Handles model inference requests and model management
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
import os
import logging
from typing import Optional, Dict, Any, List, Union
from dataclasses import dataclass
from enum import Enum
import asyncio

import httpx
import numpy as np

logger = logging.getLogger(__name__)


class ModelServerType(str, Enum):
    """Supported model server types"""
    TORCHSERVE = "torchserve"
    TENSORFLOW_SERVING = "tensorflow_serving"


@dataclass
class ModelInfo:
    """Information about a loaded model"""
    name: str
    version: str
    status: str
    workers: int
    batch_size: int
    max_batch_delay: int
    loaded_at: Optional[str] = None


@dataclass
class InferenceResult:
    """Result from model inference"""
    predictions: List[Any]
    model_name: str
    model_version: str
    latency_ms: float
    metadata: Optional[Dict[str, Any]] = None


class ModelServer:
    """
    Client for model serving infrastructure
    Supports TorchServe and TensorFlow Serving
    """
    
    def __init__(
        self,
        inference_url: Optional[str] = None,
        management_url: Optional[str] = None,
        server_type: ModelServerType = ModelServerType.TORCHSERVE,
        timeout: float = 30.0
    ):
        self.server_type = server_type
        self.timeout = timeout
        
        if server_type == ModelServerType.TORCHSERVE:
            self.inference_url = inference_url or os.getenv(
                "TORCHSERVE_INFERENCE_URL",
                "http://torchserve:8080"
            )
            self.management_url = management_url or os.getenv(
                "TORCHSERVE_MANAGEMENT_URL",
                "http://torchserve:8081"
            )
        else:
            self.inference_url = inference_url or os.getenv(
                "TF_SERVING_URL",
                "http://tensorflow-serving:8501"
            )
            self.management_url = self.inference_url
        
        self._inference_client = httpx.AsyncClient(
            base_url=self.inference_url,
            timeout=timeout
        )
        self._management_client = httpx.AsyncClient(
            base_url=self.management_url,
            timeout=timeout
        )
        
        logger.info(
            f"Model server client initialized: {server_type.value} "
            f"at {self.inference_url}"
        )
    
    async def close(self):
        """Close HTTP clients"""
        await self._inference_client.aclose()
        await self._management_client.aclose()
    
    async def health_check(self) -> bool:
        """Check if model server is healthy"""
        try:
            if self.server_type == ModelServerType.TORCHSERVE:
                response = await self._inference_client.get("/ping")
            else:
                response = await self._inference_client.get("/v1/models")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Model server health check failed: {e}")
            return False
    
    async def predict(
        self,
        model_name: str,
        inputs: Union[Dict[str, Any], List[Any], np.ndarray],
        model_version: Optional[str] = None
    ) -> InferenceResult:
        """
        Make a prediction using a model
        
        Args:
            model_name: Name of the model
            inputs: Input data for prediction
            model_version: Optional specific version to use
        
        Returns:
            InferenceResult with predictions
        """
        import time
        start_time = time.time()
        
        # Convert numpy arrays to lists
        if isinstance(inputs, np.ndarray):
            inputs = inputs.tolist()
        
        try:
            if self.server_type == ModelServerType.TORCHSERVE:
                result = await self._torchserve_predict(
                    model_name, inputs, model_version
                )
            else:
                result = await self._tf_serving_predict(
                    model_name, inputs, model_version
                )
            
            latency_ms = (time.time() - start_time) * 1000
            
            return InferenceResult(
                predictions=result["predictions"],
                model_name=model_name,
                model_version=model_version or "default",
                latency_ms=latency_ms,
                metadata=result.get("metadata")
            )
        except Exception as e:
            logger.error(f"Prediction failed for model {model_name}: {e}")
            raise
    
    async def _torchserve_predict(
        self,
        model_name: str,
        inputs: Any,
        model_version: Optional[str] = None
    ) -> Dict[str, Any]:
        """Make prediction using TorchServe"""
        url = f"/predictions/{model_name}"
        if model_version:
            url += f"/{model_version}"
        
        # TorchServe expects JSON body
        payload = {"data": inputs} if isinstance(inputs, dict) else inputs
        
        response = await self._inference_client.post(
            url,
            json=payload
        )
        response.raise_for_status()
        
        result = response.json()
        
        # Normalize response format
        if isinstance(result, list):
            return {"predictions": result}
        elif isinstance(result, dict) and "predictions" not in result:
            return {"predictions": [result]}
        return result
    
    async def _tf_serving_predict(
        self,
        model_name: str,
        inputs: Any,
        model_version: Optional[str] = None
    ) -> Dict[str, Any]:
        """Make prediction using TensorFlow Serving"""
        version_path = f"/versions/{model_version}" if model_version else ""
        url = f"/v1/models/{model_name}{version_path}:predict"
        
        # TF Serving expects instances or inputs format
        if isinstance(inputs, dict):
            payload = {"inputs": inputs}
        else:
            payload = {"instances": inputs if isinstance(inputs, list) else [inputs]}
        
        response = await self._inference_client.post(
            url,
            json=payload
        )
        response.raise_for_status()
        
        result = response.json()
        return {"predictions": result.get("predictions", result.get("outputs", []))}
    
    async def batch_predict(
        self,
        model_name: str,
        batch_inputs: List[Any],
        model_version: Optional[str] = None,
        batch_size: int = 32
    ) -> List[InferenceResult]:
        """
        Make batch predictions
        
        Args:
            model_name: Name of the model
            batch_inputs: List of inputs
            model_version: Optional specific version
            batch_size: Size of each batch
        
        Returns:
            List of InferenceResults
        """
        results = []
        
        # Process in batches
        for i in range(0, len(batch_inputs), batch_size):
            batch = batch_inputs[i:i + batch_size]
            result = await self.predict(model_name, batch, model_version)
            results.append(result)
        
        return results
    
    async def list_models(self) -> List[ModelInfo]:
        """List all loaded models"""
        if self.server_type == ModelServerType.TORCHSERVE:
            return await self._torchserve_list_models()
        else:
            return await self._tf_serving_list_models()
    
    async def _torchserve_list_models(self) -> List[ModelInfo]:
        """List models in TorchServe"""
        response = await self._management_client.get("/models")
        response.raise_for_status()
        
        models = []
        for model_data in response.json().get("models", []):
            # Get detailed info for each model
            detail_response = await self._management_client.get(
                f"/models/{model_data['modelName']}"
            )
            if detail_response.status_code == 200:
                detail = detail_response.json()[0]
                models.append(ModelInfo(
                    name=detail.get("modelName", ""),
                    version=detail.get("modelVersion", "1.0"),
                    status=detail.get("status", "unknown"),
                    workers=detail.get("workers", [{}])[0].get("id", 0),
                    batch_size=detail.get("batchSize", 1),
                    max_batch_delay=detail.get("maxBatchDelay", 100),
                    loaded_at=detail.get("loadedAtStartup")
                ))
        
        return models
    
    async def _tf_serving_list_models(self) -> List[ModelInfo]:
        """List models in TensorFlow Serving"""
        response = await self._inference_client.get("/v1/models")
        response.raise_for_status()
        
        models = []
        for model_data in response.json().get("model_version_status", []):
            models.append(ModelInfo(
                name=model_data.get("model_name", ""),
                version=str(model_data.get("version", "1")),
                status=model_data.get("state", "unknown"),
                workers=1,
                batch_size=1,
                max_batch_delay=0
            ))
        
        return models
    
    async def load_model(
        self,
        model_name: str,
        model_url: str,
        handler: Optional[str] = None,
        initial_workers: int = 1,
        batch_size: int = 1
    ) -> bool:
        """
        Load a model into the server
        
        Args:
            model_name: Name for the model
            model_url: URL to model artifact
            handler: Handler class (TorchServe only)
            initial_workers: Number of workers
            batch_size: Batch size for inference
        
        Returns:
            True if successful
        """
        if self.server_type != ModelServerType.TORCHSERVE:
            logger.warning("Dynamic model loading only supported for TorchServe")
            return False
        
        params = {
            "url": model_url,
            "initial_workers": initial_workers,
            "batch_size": batch_size
        }
        if handler:
            params["handler"] = handler
        
        try:
            response = await self._management_client.post(
                f"/models?model_name={model_name}",
                params=params
            )
            response.raise_for_status()
            logger.info(f"Model {model_name} loaded successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            return False
    
    async def unload_model(self, model_name: str) -> bool:
        """Unload a model from the server"""
        if self.server_type != ModelServerType.TORCHSERVE:
            logger.warning("Dynamic model unloading only supported for TorchServe")
            return False
        
        try:
            response = await self._management_client.delete(
                f"/models/{model_name}"
            )
            response.raise_for_status()
            logger.info(f"Model {model_name} unloaded successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to unload model {model_name}: {e}")
            return False
    
    async def scale_workers(
        self,
        model_name: str,
        min_workers: int = 1,
        max_workers: int = 4
    ) -> bool:
        """Scale the number of workers for a model"""
        if self.server_type != ModelServerType.TORCHSERVE:
            logger.warning("Worker scaling only supported for TorchServe")
            return False
        
        try:
            response = await self._management_client.put(
                f"/models/{model_name}",
                params={
                    "min_worker": min_workers,
                    "max_worker": max_workers
                }
            )
            response.raise_for_status()
            logger.info(
                f"Model {model_name} scaled to {min_workers}-{max_workers} workers"
            )
            return True
        except Exception as e:
            logger.error(f"Failed to scale model {model_name}: {e}")
            return False
    
    async def get_model_metrics(self, model_name: str) -> Dict[str, Any]:
        """Get metrics for a specific model"""
        if self.server_type == ModelServerType.TORCHSERVE:
            try:
                response = await self._inference_client.get(
                    "/metrics",
                    headers={"Accept": "application/json"}
                )
                if response.status_code == 200:
                    # Parse Prometheus metrics
                    return self._parse_prometheus_metrics(
                        response.text, model_name
                    )
            except Exception as e:
                logger.warning(f"Failed to get metrics: {e}")
        
        return {}
    
    def _parse_prometheus_metrics(
        self,
        metrics_text: str,
        model_name: str
    ) -> Dict[str, Any]:
        """Parse Prometheus format metrics"""
        metrics = {}
        for line in metrics_text.split("\n"):
            if line.startswith("#") or not line.strip():
                continue
            if model_name in line:
                parts = line.split()
                if len(parts) >= 2:
                    metric_name = parts[0].split("{")[0]
                    try:
                        metrics[metric_name] = float(parts[-1])
                    except ValueError:
                        pass
        return metrics


# Global instance
model_server = ModelServer()

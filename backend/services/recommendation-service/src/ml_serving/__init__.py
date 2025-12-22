"""
ML Serving Infrastructure Module
Provides integration with MLflow, TorchServe, and A/B testing
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
from .mlflow_client import MLflowModelRegistry
from .model_server import ModelServer
from .ab_testing import ABTestingRouter

__all__ = ["MLflowModelRegistry", "ModelServer", "ABTestingRouter"]

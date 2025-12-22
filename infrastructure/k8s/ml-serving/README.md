# ML Serving Infrastructure

This directory contains Kubernetes configurations for the MNBARA ML serving infrastructure.

## Components

### 1. MLflow Model Registry (`mlflow/`)

MLflow provides model versioning, tracking, and registry capabilities.

**Features:**
- Model versioning with lifecycle stages (Development, Staging, Production)
- Experiment tracking with metrics and parameters
- Artifact storage in MinIO/S3
- PostgreSQL backend for metadata

**Deployment:**
```bash
kubectl apply -f mlflow/mlflow-deployment.yaml
```

**Access:**
- Internal: `http://mlflow-server.ml-serving:5000`
- External: `https://mlflow.mnbara.internal` (requires auth)

### 2. TorchServe Model Server (`torchserve/`)

TorchServe provides high-performance model inference.

**Features:**
- Dynamic model loading/unloading
- Batch inference support
- Auto-scaling based on load
- Prometheus metrics export

**Deployment:**
```bash
kubectl apply -f torchserve/torchserve-deployment.yaml
```

**Endpoints:**
- Inference: `http://torchserve.ml-serving:8080`
- Management: `http://torchserve.ml-serving:8081`
- Metrics: `http://torchserve.ml-serving:8082`

### 3. A/B Testing & Model Versioning (`model-versioning/`)

Configuration for A/B testing and canary deployments.

**Features:**
- Traffic splitting between model versions
- Consistent user assignment (sticky sessions)
- Experiment tracking and metrics
- Canary rollout with automatic rollback

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ML Serving Infrastructure                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   MLflow     │    │  TorchServe  │    │  A/B Router  │      │
│  │   Registry   │───▶│   Server     │◀───│              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  PostgreSQL  │    │    MinIO     │    │    Redis     │      │
│  │  (metadata)  │    │  (artifacts) │    │   (cache)    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Model Lifecycle

1. **Development**: Models are trained and logged to MLflow
2. **Staging**: Models are promoted for validation testing
3. **Production**: Validated models serve live traffic
4. **A/B Testing**: New versions tested against production

## Usage Examples

### Register a Model
```python
from ml_serving import MLflowModelRegistry

registry = MLflowModelRegistry()
await registry.create_registered_model(
    name="recommendation-model",
    description="Product recommendation model"
)
```

### Make Predictions
```python
from ml_serving import ModelServer

server = ModelServer()
result = await server.predict(
    model_name="recommendation-model",
    inputs={"user_id": 123, "context": {...}}
)
```

### A/B Testing
```python
from ml_serving import ABTestingRouter

router = ABTestingRouter()
model, version = router.get_model_for_user(
    user_id="user123",
    context={"user_segments": ["premium"]}
)
```

## Monitoring

- Grafana dashboards: `ml-serving-dashboard`
- Prometheus metrics: `/metrics` endpoint on each service
- MLflow UI: Model performance tracking

### 4. ML Pipeline (`pipeline/`)

Continuous learning pipeline components.

**Components:**
- Feature Store Worker: Computes and caches ML features
- Retraining Scheduler: Triggers automated model retraining
- Model Monitor: Tracks performance and triggers alerts

**Deployment:**
```bash
kubectl apply -f pipeline/ml-pipeline-deployment.yaml
```

## API Endpoints

### Bandits API (`/api/v1/bandits`)
- `POST /select` - Select arms using Thompson Sampling
- `POST /select/contextual` - Select arms with context features
- `POST /reward` - Track reward events
- `GET /stats` - Get bandit statistics

### ML Pipeline API (`/api/v1/ml`)
- `POST /features/get` - Get features for an entity
- `GET /features/schema` - Get feature schema
- `POST /retraining/trigger` - Trigger model retraining
- `GET /retraining/status/{run_id}` - Get retraining status
- `POST /monitoring/record` - Record performance metric
- `GET /monitoring/alerts` - Get active alerts

## Requirements

- Kubernetes 1.24+
- Helm 3.x
- MinIO or S3-compatible storage
- PostgreSQL 15+
- Redis 7+

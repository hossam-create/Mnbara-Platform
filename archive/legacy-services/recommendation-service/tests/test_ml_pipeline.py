"""
ML Pipeline Tests
Tests for model serving latency and recommendation quality metrics
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
import pytest
import asyncio
import time
import numpy as np
from typing import List, Dict, Any
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta

# Import ML pipeline components
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from ml_serving.model_server import ModelServer, ModelServerType, InferenceResult
from ml_pipeline.model_monitor import (
    ModelMonitor, MetricType, MetricThreshold, AlertSeverity
)
from bandits.contextual_bandit import ContextualBandit, ContextFeatures
from bandits.thompson_sampling import ThompsonSamplingBandit


class TestModelServingLatency:
    """Tests for model serving latency requirements"""
    
    @pytest.fixture
    def model_server(self):
        """Create a model server instance for testing"""
        return ModelServer(
            inference_url="http://localhost:8080",
            management_url="http://localhost:8081",
            server_type=ModelServerType.TORCHSERVE,
            timeout=5.0
        )
    
    @pytest.fixture
    def mock_httpx_response(self):
        """Create mock HTTP response"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"predictions": [[0.8, 0.1, 0.1]]}
        return mock_response
    
    @pytest.mark.asyncio
    async def test_inference_result_contains_latency(self, model_server, mock_httpx_response):
        """Test that inference results include latency measurement"""
        with patch.object(model_server._inference_client, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_httpx_response
            
            result = await model_server.predict(
                model_name="test-model",
                inputs={"features": [1.0, 2.0, 3.0]}
            )
            
            assert isinstance(result, InferenceResult)
            assert hasattr(result, 'latency_ms')
            assert result.latency_ms >= 0
            assert result.model_name == "test-model"
    
    @pytest.mark.asyncio
    async def test_latency_measurement_accuracy(self, model_server, mock_httpx_response):
        """Test that latency measurement is accurate"""
        async def delayed_response(*args, **kwargs):
            await asyncio.sleep(0.05)  # 50ms delay
            return mock_httpx_response
        
        with patch.object(model_server._inference_client, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = delayed_response
            
            result = await model_server.predict(
                model_name="test-model",
                inputs=[1.0, 2.0, 3.0]
            )
            
            # Latency should be at least 50ms due to simulated delay
            assert result.latency_ms >= 50
            # But not unreasonably high (allow some overhead)
            assert result.latency_ms < 200
    
    @pytest.mark.asyncio
    async def test_batch_prediction_latency(self, model_server, mock_httpx_response):
        """Test batch prediction latency tracking"""
        with patch.object(model_server._inference_client, 'post', new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_httpx_response
            
            batch_inputs = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]]
            results = await model_server.batch_predict(
                model_name="test-model",
                batch_inputs=batch_inputs,
                batch_size=2
            )
            
            assert len(results) == 2  # 3 items with batch_size=2 = 2 batches
            for result in results:
                assert result.latency_ms >= 0


class TestRecommendationQualityMetrics:
    """Tests for recommendation quality metrics"""
    
    @pytest.fixture
    def model_monitor(self):
        """Create a model monitor instance"""
        return ModelMonitor(retention_hours=24, alert_cooldown_minutes=1)
    
    def test_record_accuracy_metric(self, model_monitor):
        """Test recording accuracy metrics"""
        alert = model_monitor.record_metric(
            model_name="recommendation-model",
            model_version="v1",
            metric_type=MetricType.ACCURACY,
            value=0.85
        )
        
        # 0.85 is above warning threshold (0.80), no alert
        assert alert is None
        
        summary = model_monitor.get_metrics_summary(
            model_name="recommendation-model",
            metric_type=MetricType.ACCURACY,
            window_minutes=60
        )
        
        assert summary["count"] == 1
        assert summary["mean"] == 0.85
    
    def test_click_through_rate_metric(self, model_monitor):
        """Test CTR metric tracking"""
        # Record multiple CTR values
        ctr_values = [0.05, 0.04, 0.06, 0.03, 0.05]
        
        for ctr in ctr_values:
            model_monitor.record_metric(
                model_name="recommendation-model",
                model_version="v1",
                metric_type=MetricType.CLICK_THROUGH_RATE,
                value=ctr
            )
        
        summary = model_monitor.get_metrics_summary(
            model_name="recommendation-model",
            metric_type=MetricType.CLICK_THROUGH_RATE,
            window_minutes=60
        )
        
        assert summary["count"] == 5
        assert abs(summary["mean"] - np.mean(ctr_values)) < 0.001
        assert summary["min"] == min(ctr_values)
        assert summary["max"] == max(ctr_values)
    
    def test_low_accuracy_triggers_alert(self, model_monitor):
        """Test that low accuracy triggers an alert"""
        # Record accuracy below critical threshold (0.70)
        alert = model_monitor.record_metric(
            model_name="recommendation-model",
            model_version="v1",
            metric_type=MetricType.ACCURACY,
            value=0.65
        )
        
        assert alert is not None
        assert alert.severity == AlertSeverity.CRITICAL
        assert alert.metric_type == MetricType.ACCURACY
        assert alert.current_value == 0.65
    
    def test_high_latency_triggers_alert(self, model_monitor):
        """Test that high latency triggers an alert"""
        # Record latency above critical threshold (500ms)
        alert = model_monitor.record_metric(
            model_name="recommendation-model",
            model_version="v1",
            metric_type=MetricType.LATENCY,
            value=600
        )
        
        assert alert is not None
        assert alert.severity == AlertSeverity.CRITICAL
        assert alert.metric_type == MetricType.LATENCY
    
    def test_coverage_metric(self, model_monitor):
        """Test recommendation coverage metric"""
        # Coverage = unique items recommended / total items
        model_monitor.record_metric(
            model_name="recommendation-model",
            model_version="v1",
            metric_type=MetricType.COVERAGE,
            value=0.75  # 75% of catalog covered
        )
        
        summary = model_monitor.get_metrics_summary(
            model_name="recommendation-model",
            metric_type=MetricType.COVERAGE,
            window_minutes=60
        )
        
        assert summary["count"] == 1
        assert summary["mean"] == 0.75
    
    def test_diversity_metric(self, model_monitor):
        """Test recommendation diversity metric"""
        # Diversity = average pairwise distance between recommended items
        model_monitor.record_metric(
            model_name="recommendation-model",
            model_version="v1",
            metric_type=MetricType.DIVERSITY,
            value=0.6
        )
        
        summary = model_monitor.get_metrics_summary(
            model_name="recommendation-model",
            metric_type=MetricType.DIVERSITY,
            window_minutes=60
        )
        
        assert summary["count"] == 1
        assert summary["mean"] == 0.6
    
    def test_all_metrics_summary(self, model_monitor):
        """Test getting summary of all metrics for a model"""
        # Record various metrics
        model_monitor.record_metric("test-model", "v1", MetricType.ACCURACY, 0.85)
        model_monitor.record_metric("test-model", "v1", MetricType.LATENCY, 50)
        model_monitor.record_metric("test-model", "v1", MetricType.CLICK_THROUGH_RATE, 0.05)
        
        all_summaries = model_monitor.get_all_metrics_summary(
            model_name="test-model",
            window_minutes=60
        )
        
        assert "accuracy" in all_summaries
        assert "latency" in all_summaries
        assert "click_through_rate" in all_summaries
        assert all_summaries["accuracy"]["mean"] == 0.85


class TestContextualBanditQuality:
    """Tests for contextual bandit recommendation quality"""
    
    @pytest.fixture
    def bandit(self):
        """Create a contextual bandit instance"""
        return ContextualBandit(
            feature_names=["time_of_day", "session_depth"],
            alpha=1.0,
            use_thompson=True
        )
    
    def test_arm_selection_returns_valid_result(self, bandit):
        """Test that arm selection returns valid arm and score"""
        bandit.add_arm("product_1")
        bandit.add_arm("product_2")
        bandit.add_arm("product_3")
        
        context = ContextFeatures(
            time_of_day=14,
            session_depth=3
        )
        
        selected_arm, score = bandit.select_arm(context)
        
        assert selected_arm in ["product_1", "product_2", "product_3"]
        assert isinstance(score, float)
    
    def test_top_k_selection(self, bandit):
        """Test top-K arm selection"""
        for i in range(10):
            bandit.add_arm(f"product_{i}")
        
        context = ContextFeatures(time_of_day=10, session_depth=2)
        
        top_k = bandit.select_top_k(context, k=5)
        
        assert len(top_k) == 5
        for arm_id, score in top_k:
            assert arm_id.startswith("product_")
            assert isinstance(score, float)
    
    def test_learning_from_rewards(self, bandit):
        """Test that bandit learns from reward feedback"""
        bandit.add_arm("good_product")
        bandit.add_arm("bad_product")
        
        context = ContextFeatures(time_of_day=12, session_depth=1)
        
        # Simulate rewards - good_product always gets reward 1, bad_product gets 0
        for _ in range(20):
            bandit.update("good_product", context, reward=1.0)
            bandit.update("bad_product", context, reward=0.0)
        
        # After learning, good_product should be selected more often
        selections = {"good_product": 0, "bad_product": 0}
        for _ in range(100):
            selected, _ = bandit.select_arm(context, ["good_product", "bad_product"])
            selections[selected] += 1
        
        # Good product should be selected significantly more often
        assert selections["good_product"] > selections["bad_product"]
    
    def test_state_persistence(self, bandit):
        """Test saving and loading bandit state"""
        bandit.add_arm("arm_1")
        bandit.add_arm("arm_2")
        
        context = ContextFeatures(time_of_day=15, session_depth=5)
        bandit.update("arm_1", context, reward=1.0)
        
        # Save state
        state = bandit.save_state()
        
        # Create new bandit and load state
        new_bandit = ContextualBandit(
            feature_names=["time_of_day", "session_depth"],
            alpha=1.0
        )
        new_bandit.load_state(state)
        
        # Verify state was restored
        assert "arm_1" in new_bandit.arms
        assert new_bandit.arms["arm_1"].total_pulls == 1


class TestThompsonSamplingQuality:
    """Tests for Thompson Sampling bandit quality"""
    
    @pytest.fixture
    def ts_bandit(self):
        """Create a Thompson Sampling bandit"""
        return ThompsonSamplingBandit()
    
    def test_exploration_exploitation_balance(self, ts_bandit):
        """Test that Thompson Sampling balances exploration and exploitation"""
        ts_bandit.add_arm("arm_a")
        ts_bandit.add_arm("arm_b")
        ts_bandit.add_arm("arm_c")
        
        # Give arm_a a clear advantage
        for _ in range(10):
            ts_bandit.update("arm_a", 1.0)
            ts_bandit.update("arm_b", 0.3)
            ts_bandit.update("arm_c", 0.1)
        
        # Sample many times
        selections = {"arm_a": 0, "arm_b": 0, "arm_c": 0}
        for _ in range(1000):
            selected = ts_bandit.select_arm()
            selections[selected] += 1
        
        # arm_a should be selected most often
        assert selections["arm_a"] > selections["arm_b"]
        assert selections["arm_a"] > selections["arm_c"]
        
        # But other arms should still be explored sometimes
        assert selections["arm_b"] > 0
        assert selections["arm_c"] > 0


class TestModelMonitorDriftDetection:
    """Tests for model performance drift detection"""
    
    @pytest.fixture
    def monitor_with_data(self):
        """Create monitor with historical data"""
        monitor = ModelMonitor(retention_hours=168, alert_cooldown_minutes=1)
        
        # Simulate baseline data (older)
        base_time = datetime.utcnow() - timedelta(hours=12)
        for i in range(20):
            dp = monitor.record_metric(
                model_name="test-model",
                model_version="v1",
                metric_type=MetricType.ACCURACY,
                value=0.85 + np.random.normal(0, 0.02)
            )
            # Manually adjust timestamp for testing
            key = "test-model:accuracy"
            if monitor.metrics[key]:
                monitor.metrics[key][-1].timestamp = base_time + timedelta(minutes=i*30)
        
        return monitor
    
    def test_drift_detection_no_drift(self, monitor_with_data):
        """Test drift detection when no drift present"""
        # Add recent data similar to baseline
        for _ in range(10):
            monitor_with_data.record_metric(
                model_name="test-model",
                model_version="v1",
                metric_type=MetricType.ACCURACY,
                value=0.85 + np.random.normal(0, 0.02)
            )
        
        drift = monitor_with_data.detect_drift(
            model_name="test-model",
            metric_type=MetricType.ACCURACY,
            baseline_window_hours=24,
            current_window_hours=1
        )
        
        # May return None if insufficient data, or drift_detected should be False
        if drift:
            assert abs(drift["drift_percentage"]) < 0.1


class TestAlertManagement:
    """Tests for alert management functionality"""
    
    @pytest.fixture
    def monitor(self):
        return ModelMonitor(alert_cooldown_minutes=0)  # No cooldown for testing
    
    def test_alert_callback_invoked(self, monitor):
        """Test that alert callbacks are invoked"""
        callback_invoked = []
        
        def alert_callback(alert):
            callback_invoked.append(alert)
        
        monitor.register_alert_callback(alert_callback)
        
        # Trigger an alert
        monitor.record_metric(
            model_name="test-model",
            model_version="v1",
            metric_type=MetricType.ACCURACY,
            value=0.5  # Below critical threshold
        )
        
        assert len(callback_invoked) == 1
        assert callback_invoked[0].severity == AlertSeverity.CRITICAL
    
    def test_acknowledge_alert(self, monitor):
        """Test acknowledging alerts"""
        alert = monitor.record_metric(
            model_name="test-model",
            model_version="v1",
            metric_type=MetricType.ACCURACY,
            value=0.5
        )
        
        assert alert is not None
        assert not alert.acknowledged
        
        # Acknowledge the alert
        result = monitor.acknowledge_alert(alert.alert_id)
        assert result is True
        
        # Verify it's acknowledged
        active_alerts = monitor.get_active_alerts(model_name="test-model")
        assert len(active_alerts) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

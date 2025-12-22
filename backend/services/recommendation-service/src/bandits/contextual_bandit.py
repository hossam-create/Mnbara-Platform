"""
Contextual Bandit Implementation
Uses context features to make personalized arm selections
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import logging

from .thompson_sampling import ThompsonSamplingBandit, ArmStats

logger = logging.getLogger(__name__)


@dataclass
class ContextFeatures:
    """Context features for contextual bandit"""
    user_id: Optional[str] = None
    user_segment: Optional[str] = None
    time_of_day: Optional[int] = None  # 0-23
    day_of_week: Optional[int] = None  # 0-6
    device_type: Optional[str] = None
    location: Optional[str] = None
    session_depth: int = 0
    previous_actions: List[str] = field(default_factory=list)
    custom_features: Dict[str, float] = field(default_factory=dict)
    
    def to_vector(self, feature_names: List[str]) -> np.ndarray:
        """Convert context to feature vector"""
        vector = []
        for name in feature_names:
            if name == "time_of_day" and self.time_of_day is not None:
                # Cyclical encoding for time
                vector.append(np.sin(2 * np.pi * self.time_of_day / 24))
                vector.append(np.cos(2 * np.pi * self.time_of_day / 24))
            elif name == "day_of_week" and self.day_of_week is not None:
                vector.append(np.sin(2 * np.pi * self.day_of_week / 7))
                vector.append(np.cos(2 * np.pi * self.day_of_week / 7))
            elif name == "session_depth":
                vector.append(min(self.session_depth / 10.0, 1.0))
            elif name in self.custom_features:
                vector.append(self.custom_features[name])
            else:
                vector.append(0.0)
        return np.array(vector)


@dataclass
class ContextualArmStats:
    """Statistics for a contextual arm with linear model"""
    arm_id: str
    n_features: int
    # Linear model parameters (for LinUCB-style updates)
    A: np.ndarray = None  # Feature covariance matrix
    b: np.ndarray = None  # Reward-weighted feature sum
    theta: np.ndarray = None  # Model weights
    total_pulls: int = 0
    total_reward: float = 0.0
    
    def __post_init__(self):
        if self.A is None:
            self.A = np.eye(self.n_features)
        if self.b is None:
            self.b = np.zeros(self.n_features)
        if self.theta is None:
            self.theta = np.zeros(self.n_features)


class ContextualBandit:
    """
    Contextual Multi-Armed Bandit using LinUCB algorithm
    Combines Thompson Sampling with linear context models
    """
    
    def __init__(
        self,
        feature_names: List[str],
        alpha: float = 1.0,
        use_thompson: bool = True
    ):
        """
        Initialize Contextual Bandit
        
        Args:
            feature_names: Names of context features
            alpha: Exploration parameter (higher = more exploration)
            use_thompson: Use Thompson Sampling for exploration
        """
        self.feature_names = feature_names
        self.n_features = self._compute_feature_dim()
        self.alpha = alpha
        self.use_thompson = use_thompson
        
        self.arms: Dict[str, ContextualArmStats] = {}
        
        # Fallback Thompson Sampling bandit for cold start
        self.ts_bandit = ThompsonSamplingBandit()
        
        logger.info(
            f"Contextual Bandit initialized with {self.n_features} features"
        )
    
    def _compute_feature_dim(self) -> int:
        """Compute actual feature dimension (some features expand)"""
        dim = 0
        for name in self.feature_names:
            if name in ["time_of_day", "day_of_week"]:
                dim += 2  # Cyclical encoding
            else:
                dim += 1
        return max(dim, 1)
    
    def add_arm(self, arm_id: str) -> None:
        """Add a new arm to the bandit"""
        if arm_id not in self.arms:
            self.arms[arm_id] = ContextualArmStats(
                arm_id=arm_id,
                n_features=self.n_features
            )
            self.ts_bandit.add_arm(arm_id)
    
    def select_arm(
        self,
        context: ContextFeatures,
        available_arms: Optional[List[str]] = None
    ) -> Tuple[str, float]:
        """
        Select an arm given context
        
        Args:
            context: Context features
            available_arms: List of arm IDs to choose from
        
        Returns:
            Tuple of (selected_arm_id, expected_reward)
        """
        if available_arms is None:
            available_arms = list(self.arms.keys())
        
        if not available_arms:
            raise ValueError("No arms available for selection")
        
        # Ensure all arms exist
        for arm_id in available_arms:
            self.add_arm(arm_id)
        
        # Convert context to feature vector
        x = context.to_vector(self.feature_names)
        
        # Compute UCB score for each arm
        scores = {}
        for arm_id in available_arms:
            arm = self.arms[arm_id]
            
            if arm.total_pulls < 5:
                # Cold start: use Thompson Sampling
                scores[arm_id] = self.ts_bandit.arms[arm_id].sample()
            else:
                # LinUCB score
                A_inv = np.linalg.inv(arm.A)
                theta = A_inv @ arm.b
                
                # Expected reward
                expected = x @ theta
                
                # Uncertainty bonus
                uncertainty = self.alpha * np.sqrt(x @ A_inv @ x)
                
                if self.use_thompson:
                    # Add Thompson Sampling noise
                    noise = np.random.normal(0, uncertainty)
                    scores[arm_id] = expected + noise
                else:
                    # Pure UCB
                    scores[arm_id] = expected + uncertainty
        
        # Select arm with highest score
        selected = max(scores, key=scores.get)
        return selected, scores[selected]
    
    def select_top_k(
        self,
        context: ContextFeatures,
        k: int,
        available_arms: Optional[List[str]] = None
    ) -> List[Tuple[str, float]]:
        """
        Select top K arms given context
        
        Args:
            context: Context features
            k: Number of arms to select
            available_arms: List of arm IDs to choose from
        
        Returns:
            List of (arm_id, score) tuples
        """
        if available_arms is None:
            available_arms = list(self.arms.keys())
        
        # Ensure all arms exist
        for arm_id in available_arms:
            self.add_arm(arm_id)
        
        x = context.to_vector(self.feature_names)
        
        # Compute scores for all arms
        scores = []
        for arm_id in available_arms:
            arm = self.arms[arm_id]
            
            if arm.total_pulls < 5:
                score = self.ts_bandit.arms[arm_id].sample()
            else:
                A_inv = np.linalg.inv(arm.A)
                theta = A_inv @ arm.b
                expected = x @ theta
                uncertainty = self.alpha * np.sqrt(x @ A_inv @ x)
                
                if self.use_thompson:
                    score = expected + np.random.normal(0, uncertainty)
                else:
                    score = expected + uncertainty
            
            scores.append((arm_id, score))
        
        # Sort and return top K
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:k]
    
    def update(
        self,
        arm_id: str,
        context: ContextFeatures,
        reward: float
    ) -> None:
        """
        Update arm with observed reward
        
        Args:
            arm_id: ID of the arm that was pulled
            context: Context when arm was pulled
            reward: Observed reward
        """
        self.add_arm(arm_id)
        arm = self.arms[arm_id]
        
        x = context.to_vector(self.feature_names)
        
        # Update linear model (Sherman-Morrison update)
        arm.A += np.outer(x, x)
        arm.b += reward * x
        arm.theta = np.linalg.inv(arm.A) @ arm.b
        
        arm.total_pulls += 1
        arm.total_reward += reward
        
        # Also update Thompson Sampling bandit
        self.ts_bandit.update(arm_id, reward)
        
        logger.debug(f"Updated contextual arm {arm_id} with reward {reward}")
    
    def get_arm_stats(self, arm_id: str) -> Optional[Dict[str, Any]]:
        """Get statistics for a specific arm"""
        arm = self.arms.get(arm_id)
        if not arm:
            return None
        
        return {
            "arm_id": arm_id,
            "total_pulls": arm.total_pulls,
            "total_reward": arm.total_reward,
            "mean_reward": arm.total_reward / max(arm.total_pulls, 1),
            "theta": arm.theta.tolist() if arm.theta is not None else None
        }
    
    def save_state(self) -> Dict[str, Any]:
        """Serialize bandit state for persistence"""
        return {
            "feature_names": self.feature_names,
            "alpha": self.alpha,
            "use_thompson": self.use_thompson,
            "arms": {
                arm_id: {
                    "A": arm.A.tolist(),
                    "b": arm.b.tolist(),
                    "total_pulls": arm.total_pulls,
                    "total_reward": arm.total_reward
                }
                for arm_id, arm in self.arms.items()
            },
            "ts_bandit": self.ts_bandit.save_state()
        }
    
    def load_state(self, state: Dict[str, Any]) -> None:
        """Load bandit state from serialized data"""
        self.feature_names = state.get("feature_names", self.feature_names)
        self.alpha = state.get("alpha", self.alpha)
        self.use_thompson = state.get("use_thompson", self.use_thompson)
        self.n_features = self._compute_feature_dim()
        
        self.arms = {}
        for arm_id, arm_data in state.get("arms", {}).items():
            self.arms[arm_id] = ContextualArmStats(
                arm_id=arm_id,
                n_features=self.n_features,
                A=np.array(arm_data["A"]),
                b=np.array(arm_data["b"]),
                total_pulls=arm_data["total_pulls"],
                total_reward=arm_data["total_reward"]
            )
            self.arms[arm_id].theta = np.linalg.inv(self.arms[arm_id].A) @ self.arms[arm_id].b
        
        if "ts_bandit" in state:
            self.ts_bandit.load_state(state["ts_bandit"])

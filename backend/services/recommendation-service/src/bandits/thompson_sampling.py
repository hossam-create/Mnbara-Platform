"""
Thompson Sampling Multi-Armed Bandit Implementation
Provides exploration/exploitation balance for product recommendations
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class ArmStats:
    """Statistics for a single arm (product/category)"""
    arm_id: str
    alpha: float = 1.0  # Success count + prior
    beta: float = 1.0   # Failure count + prior
    total_pulls: int = 0
    total_reward: float = 0.0
    last_updated: datetime = field(default_factory=datetime.utcnow)
    
    @property
    def mean_reward(self) -> float:
        """Expected reward (mean of Beta distribution)"""
        return self.alpha / (self.alpha + self.beta)
    
    @property
    def variance(self) -> float:
        """Variance of the Beta distribution"""
        ab = self.alpha + self.beta
        return (self.alpha * self.beta) / (ab * ab * (ab + 1))
    
    def sample(self) -> float:
        """Sample from Beta distribution"""
        return np.random.beta(self.alpha, self.beta)
    
    def update(self, reward: float) -> None:
        """Update arm statistics with observed reward"""
        self.total_pulls += 1
        self.total_reward += reward
        
        # For binary rewards (0 or 1)
        if reward > 0:
            self.alpha += reward
        else:
            self.beta += 1 - reward
        
        self.last_updated = datetime.utcnow()


class ThompsonSamplingBandit:
    """
    Thompson Sampling Multi-Armed Bandit
    Uses Beta-Bernoulli model for binary rewards (click/no-click)
    """
    
    def __init__(
        self,
        prior_alpha: float = 1.0,
        prior_beta: float = 1.0,
        decay_factor: float = 0.999
    ):
        """
        Initialize Thompson Sampling bandit
        
        Args:
            prior_alpha: Prior success count (optimistic prior > 1)
            prior_beta: Prior failure count
            decay_factor: Decay factor for old observations (for non-stationary)
        """
        self.prior_alpha = prior_alpha
        self.prior_beta = prior_beta
        self.decay_factor = decay_factor
        self.arms: Dict[str, ArmStats] = {}
        logger.info("Thompson Sampling Bandit initialized")
    
    def add_arm(self, arm_id: str) -> None:
        """Add a new arm to the bandit"""
        if arm_id not in self.arms:
            self.arms[arm_id] = ArmStats(
                arm_id=arm_id,
                alpha=self.prior_alpha,
                beta=self.prior_beta
            )
    
    def select_arm(self, available_arms: Optional[List[str]] = None) -> str:
        """
        Select an arm using Thompson Sampling
        
        Args:
            available_arms: List of arm IDs to choose from (None = all arms)
        
        Returns:
            Selected arm ID
        """
        if available_arms is None:
            available_arms = list(self.arms.keys())
        
        if not available_arms:
            raise ValueError("No arms available for selection")
        
        # Ensure all arms exist
        for arm_id in available_arms:
            self.add_arm(arm_id)
        
        # Sample from each arm's distribution
        samples = {
            arm_id: self.arms[arm_id].sample()
            for arm_id in available_arms
        }
        
        # Select arm with highest sample
        selected = max(samples, key=samples.get)
        return selected

    
    def select_top_k(
        self,
        k: int,
        available_arms: Optional[List[str]] = None
    ) -> List[Tuple[str, float]]:
        """
        Select top K arms using Thompson Sampling
        
        Args:
            k: Number of arms to select
            available_arms: List of arm IDs to choose from
        
        Returns:
            List of (arm_id, sampled_value) tuples
        """
        if available_arms is None:
            available_arms = list(self.arms.keys())
        
        # Ensure all arms exist
        for arm_id in available_arms:
            self.add_arm(arm_id)
        
        # Sample from each arm
        samples = [
            (arm_id, self.arms[arm_id].sample())
            for arm_id in available_arms
        ]
        
        # Sort by sampled value and return top K
        samples.sort(key=lambda x: x[1], reverse=True)
        return samples[:k]
    
    def update(self, arm_id: str, reward: float) -> None:
        """
        Update arm with observed reward
        
        Args:
            arm_id: ID of the arm that was pulled
            reward: Observed reward (0 to 1 for binary, can be continuous)
        """
        self.add_arm(arm_id)
        self.arms[arm_id].update(reward)
        logger.debug(f"Updated arm {arm_id} with reward {reward}")
    
    def batch_update(self, updates: List[Tuple[str, float]]) -> None:
        """
        Batch update multiple arms
        
        Args:
            updates: List of (arm_id, reward) tuples
        """
        for arm_id, reward in updates:
            self.update(arm_id, reward)
    
    def apply_decay(self) -> None:
        """Apply decay to all arm statistics (for non-stationary environments)"""
        for arm in self.arms.values():
            arm.alpha = self.prior_alpha + (arm.alpha - self.prior_alpha) * self.decay_factor
            arm.beta = self.prior_beta + (arm.beta - self.prior_beta) * self.decay_factor
    
    def get_arm_stats(self, arm_id: str) -> Optional[ArmStats]:
        """Get statistics for a specific arm"""
        return self.arms.get(arm_id)
    
    def get_all_stats(self) -> Dict[str, Dict[str, Any]]:
        """Get statistics for all arms"""
        return {
            arm_id: {
                "alpha": arm.alpha,
                "beta": arm.beta,
                "mean_reward": arm.mean_reward,
                "variance": arm.variance,
                "total_pulls": arm.total_pulls,
                "total_reward": arm.total_reward
            }
            for arm_id, arm in self.arms.items()
        }
    
    def get_exploitation_ranking(self) -> List[Tuple[str, float]]:
        """Get arms ranked by expected reward (pure exploitation)"""
        ranking = [
            (arm_id, arm.mean_reward)
            for arm_id, arm in self.arms.items()
        ]
        ranking.sort(key=lambda x: x[1], reverse=True)
        return ranking
    
    def save_state(self) -> Dict[str, Any]:
        """Serialize bandit state for persistence"""
        return {
            "prior_alpha": self.prior_alpha,
            "prior_beta": self.prior_beta,
            "decay_factor": self.decay_factor,
            "arms": {
                arm_id: {
                    "alpha": arm.alpha,
                    "beta": arm.beta,
                    "total_pulls": arm.total_pulls,
                    "total_reward": arm.total_reward
                }
                for arm_id, arm in self.arms.items()
            }
        }
    
    def load_state(self, state: Dict[str, Any]) -> None:
        """Load bandit state from serialized data"""
        self.prior_alpha = state.get("prior_alpha", 1.0)
        self.prior_beta = state.get("prior_beta", 1.0)
        self.decay_factor = state.get("decay_factor", 0.999)
        
        self.arms = {}
        for arm_id, arm_data in state.get("arms", {}).items():
            self.arms[arm_id] = ArmStats(
                arm_id=arm_id,
                alpha=arm_data["alpha"],
                beta=arm_data["beta"],
                total_pulls=arm_data["total_pulls"],
                total_reward=arm_data["total_reward"]
            )

"""
Contextual Bandits Module for Product Recommendations
Implements multi-armed bandit algorithms for exploration/exploitation
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
from .thompson_sampling import ThompsonSamplingBandit
from .contextual_bandit import ContextualBandit
from .reward_tracker import RewardTracker

__all__ = ["ThompsonSamplingBandit", "ContextualBandit", "RewardTracker"]

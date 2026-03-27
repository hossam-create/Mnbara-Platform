"""
Reward Tracker for Contextual Bandits
Handles real-time feedback loop for reward signals
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
import asyncio
import logging
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict
from enum import Enum

logger = logging.getLogger(__name__)


class RewardType(str, Enum):
    """Types of reward signals"""
    IMPRESSION = "impression"
    CLICK = "click"
    ADD_TO_CART = "add_to_cart"
    PURCHASE = "purchase"
    BID = "bid"
    WISHLIST = "wishlist"
    SHARE = "share"
    DWELL_TIME = "dwell_time"


# Reward weights for different actions
DEFAULT_REWARD_WEIGHTS = {
    RewardType.IMPRESSION: 0.0,
    RewardType.CLICK: 0.2,
    RewardType.ADD_TO_CART: 0.5,
    RewardType.PURCHASE: 1.0,
    RewardType.BID: 0.8,
    RewardType.WISHLIST: 0.3,
    RewardType.SHARE: 0.4,
    RewardType.DWELL_TIME: 0.1,  # Per 10 seconds
}


@dataclass
class RewardEvent:
    """A reward event from user interaction"""
    user_id: str
    arm_id: str  # Product ID, category ID, etc.
    reward_type: RewardType
    value: float = 1.0
    context: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    recommendation_id: Optional[str] = None


@dataclass
class PendingReward:
    """Tracks pending reward for a recommendation"""
    recommendation_id: str
    user_id: str
    arm_id: str
    context: Dict[str, Any]
    shown_at: datetime
    expires_at: datetime
    accumulated_reward: float = 0.0
    events: List[RewardEvent] = field(default_factory=list)


class RewardTracker:
    """
    Tracks and processes reward signals for bandit updates
    Implements delayed reward attribution and real-time feedback
    """
    
    def __init__(
        self,
        reward_weights: Optional[Dict[RewardType, float]] = None,
        attribution_window_minutes: int = 30,
        batch_size: int = 100,
        flush_interval_seconds: int = 60
    ):
        """
        Initialize Reward Tracker
        
        Args:
            reward_weights: Custom weights for reward types
            attribution_window_minutes: Time window for reward attribution
            batch_size: Batch size for processing rewards
            flush_interval_seconds: Interval for flushing pending rewards
        """
        self.reward_weights = reward_weights or DEFAULT_REWARD_WEIGHTS
        self.attribution_window = timedelta(minutes=attribution_window_minutes)
        self.batch_size = batch_size
        self.flush_interval = flush_interval_seconds
        
        # Pending rewards awaiting attribution
        self.pending_rewards: Dict[str, PendingReward] = {}
        
        # Event buffer for batch processing
        self.event_buffer: List[RewardEvent] = []
        
        # Callbacks for reward updates
        self.update_callbacks: List[Callable] = []
        
        # Statistics
        self.stats = {
            "total_events": 0,
            "total_rewards": 0.0,
            "events_by_type": defaultdict(int)
        }
        
        logger.info("Reward Tracker initialized")
    
    def register_callback(self, callback: Callable) -> None:
        """Register a callback for reward updates"""
        self.update_callbacks.append(callback)
    
    def track_impression(
        self,
        recommendation_id: str,
        user_id: str,
        arm_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Track when a recommendation is shown to user
        
        Args:
            recommendation_id: Unique ID for this recommendation
            user_id: User who saw the recommendation
            arm_id: The arm (product/category) that was shown
            context: Context when recommendation was made
        """
        now = datetime.utcnow()
        
        self.pending_rewards[recommendation_id] = PendingReward(
            recommendation_id=recommendation_id,
            user_id=user_id,
            arm_id=arm_id,
            context=context or {},
            shown_at=now,
            expires_at=now + self.attribution_window
        )
        
        # Track impression event
        self._add_event(RewardEvent(
            user_id=user_id,
            arm_id=arm_id,
            reward_type=RewardType.IMPRESSION,
            context=context or {},
            recommendation_id=recommendation_id
        ))
    
    def track_event(
        self,
        user_id: str,
        arm_id: str,
        reward_type: RewardType,
        value: float = 1.0,
        context: Optional[Dict[str, Any]] = None,
        recommendation_id: Optional[str] = None
    ) -> float:
        """
        Track a reward event
        
        Args:
            user_id: User who performed the action
            arm_id: The arm (product/category) involved
            reward_type: Type of reward event
            value: Event value (e.g., purchase amount, dwell time)
            context: Additional context
            recommendation_id: Optional recommendation to attribute to
        
        Returns:
            Computed reward value
        """
        event = RewardEvent(
            user_id=user_id,
            arm_id=arm_id,
            reward_type=reward_type,
            value=value,
            context=context or {},
            recommendation_id=recommendation_id
        )
        
        reward = self._compute_reward(event)
        self._add_event(event)
        
        # Attribute to pending recommendation if exists
        if recommendation_id and recommendation_id in self.pending_rewards:
            pending = self.pending_rewards[recommendation_id]
            pending.accumulated_reward += reward
            pending.events.append(event)
        
        return reward
    
    def _compute_reward(self, event: RewardEvent) -> float:
        """Compute reward value for an event"""
        base_weight = self.reward_weights.get(event.reward_type, 0.0)
        
        if event.reward_type == RewardType.DWELL_TIME:
            # Scale by dwell time (per 10 seconds)
            return base_weight * (event.value / 10.0)
        elif event.reward_type == RewardType.PURCHASE:
            # Could scale by purchase value
            return base_weight * min(event.value / 100.0, 1.0)
        else:
            return base_weight * event.value
    
    def _add_event(self, event: RewardEvent) -> None:
        """Add event to buffer"""
        self.event_buffer.append(event)
        self.stats["total_events"] += 1
        self.stats["events_by_type"][event.reward_type.value] += 1
        
        # Process batch if buffer is full
        if len(self.event_buffer) >= self.batch_size:
            self._process_batch()
    
    def _process_batch(self) -> None:
        """Process buffered events"""
        if not self.event_buffer:
            return
        
        # Group events by arm
        arm_rewards: Dict[str, List[float]] = defaultdict(list)
        
        for event in self.event_buffer:
            reward = self._compute_reward(event)
            arm_rewards[event.arm_id].append(reward)
        
        # Notify callbacks
        for callback in self.update_callbacks:
            try:
                callback(arm_rewards)
            except Exception as e:
                logger.error(f"Callback error: {e}")
        
        # Update stats
        total_reward = sum(sum(rewards) for rewards in arm_rewards.values())
        self.stats["total_rewards"] += total_reward
        
        # Clear buffer
        self.event_buffer.clear()
        logger.debug(f"Processed batch with {len(arm_rewards)} arms")
    
    async def flush_expired_rewards(self) -> List[PendingReward]:
        """
        Flush expired pending rewards and return them for processing
        
        Returns:
            List of expired pending rewards
        """
        now = datetime.utcnow()
        expired = []
        
        expired_ids = [
            rid for rid, pending in self.pending_rewards.items()
            if pending.expires_at <= now
        ]
        
        for rid in expired_ids:
            pending = self.pending_rewards.pop(rid)
            expired.append(pending)
        
        if expired:
            logger.info(f"Flushed {len(expired)} expired pending rewards")
        
        return expired
    
    async def run_flush_loop(self) -> None:
        """Run periodic flush loop"""
        while True:
            try:
                expired = await self.flush_expired_rewards()
                
                # Process expired rewards
                for pending in expired:
                    # Notify callbacks with final reward
                    for callback in self.update_callbacks:
                        try:
                            callback({
                                pending.arm_id: [pending.accumulated_reward]
                            })
                        except Exception as e:
                            logger.error(f"Callback error: {e}")
                
                await asyncio.sleep(self.flush_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Flush loop error: {e}")
                await asyncio.sleep(self.flush_interval)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get tracker statistics"""
        return {
            **self.stats,
            "pending_rewards": len(self.pending_rewards),
            "buffer_size": len(self.event_buffer)
        }
    
    def get_arm_performance(self, arm_id: str) -> Dict[str, Any]:
        """Get performance metrics for a specific arm"""
        arm_events = [
            e for e in self.event_buffer
            if e.arm_id == arm_id
        ]
        
        events_by_type = defaultdict(int)
        total_reward = 0.0
        
        for event in arm_events:
            events_by_type[event.reward_type.value] += 1
            total_reward += self._compute_reward(event)
        
        return {
            "arm_id": arm_id,
            "total_events": len(arm_events),
            "events_by_type": dict(events_by_type),
            "total_reward": total_reward
        }


# Global instance
reward_tracker = RewardTracker()

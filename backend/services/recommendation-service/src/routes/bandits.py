"""
API Routes for Contextual Bandit Recommendations
Requirements: 17.4 - Personalized recommendations based on browsing history
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
import uuid

from src.bandits import (
    ThompsonSamplingBandit,
    ContextualBandit,
    RewardTracker
)
from src.bandits.contextual_bandit import ContextFeatures
from src.bandits.reward_tracker import RewardType

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize bandits
product_bandit = ThompsonSamplingBandit(prior_alpha=1.0, prior_beta=1.0)
contextual_bandit = ContextualBandit(
    feature_names=["time_of_day", "day_of_week", "session_depth"],
    alpha=1.0,
    use_thompson=True
)
reward_tracker = RewardTracker()

# Register callback to update bandits on rewards
def update_bandits_callback(arm_rewards: Dict[str, List[float]]):
    for arm_id, rewards in arm_rewards.items():
        for reward in rewards:
            product_bandit.update(arm_id, reward)

reward_tracker.register_callback(update_bandits_callback)


class BanditSelectRequest(BaseModel):
    """Request for bandit arm selection"""
    user_id: str
    available_arms: List[str] = Field(..., min_length=1)
    limit: int = Field(default=10, ge=1, le=50)
    context: Optional[Dict[str, Any]] = None


class BanditSelectResponse(BaseModel):
    """Response from bandit arm selection"""
    recommendation_id: str
    selected_arms: List[Dict[str, Any]]
    user_id: str
    timestamp: datetime


class RewardEventRequest(BaseModel):
    """Request to track a reward event"""
    user_id: str
    arm_id: str
    event_type: str
    value: float = 1.0
    recommendation_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class RewardEventResponse(BaseModel):
    """Response from tracking a reward event"""
    success: bool
    computed_reward: float
    arm_id: str


class BanditStatsResponse(BaseModel):
    """Response with bandit statistics"""
    total_arms: int
    arm_stats: Dict[str, Any]
    tracker_stats: Dict[str, Any]


@router.post("/select", response_model=BanditSelectResponse)
async def select_arms(
    request: BanditSelectRequest,
    background_tasks: BackgroundTasks
):
    """
    Select arms using Thompson Sampling bandit
    
    Uses exploration/exploitation to balance between showing
    high-performing products and discovering new ones.
    """
    try:
        recommendation_id = str(uuid.uuid4())
        
        # Select top K arms
        selected = product_bandit.select_top_k(
            k=request.limit,
            available_arms=request.available_arms
        )
        
        # Build response
        selected_arms = [
            {
                "arm_id": arm_id,
                "score": score,
                "rank": i + 1
            }
            for i, (arm_id, score) in enumerate(selected)
        ]
        
        # Track impressions in background
        for arm in selected_arms:
            background_tasks.add_task(
                reward_tracker.track_impression,
                recommendation_id=recommendation_id,
                user_id=request.user_id,
                arm_id=arm["arm_id"],
                context=request.context
            )
        
        return BanditSelectResponse(
            recommendation_id=recommendation_id,
            selected_arms=selected_arms,
            user_id=request.user_id,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        logger.error(f"Bandit selection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/select/contextual", response_model=BanditSelectResponse)
async def select_arms_contextual(
    request: BanditSelectRequest,
    background_tasks: BackgroundTasks
):
    """
    Select arms using Contextual Bandit with LinUCB
    
    Uses context features (time, session depth, etc.) to make
    personalized selections.
    """
    try:
        recommendation_id = str(uuid.uuid4())
        
        # Build context features
        ctx = request.context or {}
        context = ContextFeatures(
            user_id=request.user_id,
            time_of_day=ctx.get("time_of_day"),
            day_of_week=ctx.get("day_of_week"),
            session_depth=ctx.get("session_depth", 0),
            custom_features=ctx.get("custom_features", {})
        )
        
        # Select top K arms with context
        selected = contextual_bandit.select_top_k(
            context=context,
            k=request.limit,
            available_arms=request.available_arms
        )
        
        selected_arms = [
            {
                "arm_id": arm_id,
                "score": score,
                "rank": i + 1
            }
            for i, (arm_id, score) in enumerate(selected)
        ]
        
        # Track impressions
        for arm in selected_arms:
            background_tasks.add_task(
                reward_tracker.track_impression,
                recommendation_id=recommendation_id,
                user_id=request.user_id,
                arm_id=arm["arm_id"],
                context=request.context
            )
        
        return BanditSelectResponse(
            recommendation_id=recommendation_id,
            selected_arms=selected_arms,
            user_id=request.user_id,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        logger.error(f"Contextual bandit selection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reward", response_model=RewardEventResponse)
async def track_reward(request: RewardEventRequest):
    """
    Track a reward event for bandit learning
    
    Call this when a user interacts with a recommended item
    (click, add to cart, purchase, etc.)
    """
    try:
        # Map event type to RewardType
        try:
            reward_type = RewardType(request.event_type)
        except ValueError:
            reward_type = RewardType.CLICK
        
        # Track the event
        computed_reward = reward_tracker.track_event(
            user_id=request.user_id,
            arm_id=request.arm_id,
            reward_type=reward_type,
            value=request.value,
            context=request.context,
            recommendation_id=request.recommendation_id
        )
        
        # Update contextual bandit if we have context
        if request.context:
            ctx = request.context
            context = ContextFeatures(
                user_id=request.user_id,
                time_of_day=ctx.get("time_of_day"),
                day_of_week=ctx.get("day_of_week"),
                session_depth=ctx.get("session_depth", 0)
            )
            contextual_bandit.update(
                arm_id=request.arm_id,
                context=context,
                reward=computed_reward
            )
        
        return RewardEventResponse(
            success=True,
            computed_reward=computed_reward,
            arm_id=request.arm_id
        )
    except Exception as e:
        logger.error(f"Reward tracking error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=BanditStatsResponse)
async def get_bandit_stats():
    """Get statistics for the bandit algorithms"""
    return BanditStatsResponse(
        total_arms=len(product_bandit.arms),
        arm_stats=product_bandit.get_all_stats(),
        tracker_stats=reward_tracker.get_stats()
    )


@router.get("/stats/{arm_id}")
async def get_arm_stats(arm_id: str):
    """Get statistics for a specific arm"""
    ts_stats = product_bandit.get_arm_stats(arm_id)
    ctx_stats = contextual_bandit.get_arm_stats(arm_id)
    perf_stats = reward_tracker.get_arm_performance(arm_id)
    
    if not ts_stats and not ctx_stats:
        raise HTTPException(status_code=404, detail="Arm not found")
    
    return {
        "arm_id": arm_id,
        "thompson_sampling": ts_stats,
        "contextual": ctx_stats,
        "performance": perf_stats
    }


@router.get("/ranking")
async def get_exploitation_ranking(limit: int = 20):
    """Get arms ranked by expected reward (pure exploitation)"""
    ranking = product_bandit.get_exploitation_ranking()
    return {
        "ranking": [
            {"arm_id": arm_id, "expected_reward": reward, "rank": i + 1}
            for i, (arm_id, reward) in enumerate(ranking[:limit])
        ]
    }

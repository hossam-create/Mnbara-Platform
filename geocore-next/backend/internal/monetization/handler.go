package monetization

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/geocore-next/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/customer"
	"github.com/stripe/stripe-go/v79/paymentintent"
	"gorm.io/gorm"
)

// ════════════════════════════════════════════════════════════════════════════
// Handler
// ════════════════════════════════════════════════════════════════════════════

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

// stripeEnabled reports whether the Stripe secret key has been configured.
func stripeEnabled() bool {
	return os.Getenv("STRIPE_SECRET_KEY") != ""
}

// ════════════════════════════════════════════════════════════════════════════
// POST /listings/:id/boost — create a Stripe PaymentIntent to feature a listing
// ════════════════════════════════════════════════════════════════════════════

func (h *Handler) BoostListing(c *gin.Context) {
	if !stripeEnabled() {
		c.AbortWithStatusJSON(http.StatusPaymentRequired, gin.H{
			"error":   "stripe_not_configured",
			"message": "Listing boosts require Stripe to be configured. Set STRIPE_SECRET_KEY.",
		})
		return
	}

	listingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid listing id")
		return
	}

	userID := c.GetString("user_id")

	// Verify listing exists and belongs to the requester
	var listing struct {
		ID     uuid.UUID
		UserID uuid.UUID
		Title  string
	}
	if err := h.db.Table("listings").
		Select("id, user_id, title").
		Where("id = ? AND deleted_at IS NULL", listingID).
		First(&listing).Error; err != nil {
		response.NotFound(c, "listing")
		return
	}
	if listing.UserID.String() != userID {
		response.Forbidden(c)
		return
	}

	settings := GetSettings(h.db)
	boostFee := settings.BoostFeeUSD
	if boostFee <= 0 {
		boostFee = BoostFee
	}

	stripeCustomerID, err := h.ensureStripeCustomer(userID)
	if err != nil {
		slog.Error("monetization: failed to ensure Stripe customer for boost",
			"user_id", userID, "error", err.Error())
		response.InternalError(c, err)
		return
	}

	// Create Stripe PaymentIntent for the boost fee
	amountSmallest := int64(boostFee * 100)
	piParams := &stripe.PaymentIntentParams{
		Amount:      stripe.Int64(amountSmallest),
		Currency:    stripe.String(BoostCurrency),
		Description: stripe.String(fmt.Sprintf("Listing boost: %s", listing.Title)),
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
	}
	if stripeCustomerID != "" {
		piParams.Customer = stripe.String(stripeCustomerID)
	}
	piParams.AddMetadata("listing_id", listingID.String())
	piParams.AddMetadata("user_id", userID)
	piParams.AddMetadata("kind", "boost")

	pi, err := paymentintent.New(piParams)
	if err != nil {
		slog.Error("monetization: Stripe boost payment intent failed",
			"listing_id", listingID, "user_id", userID, "error", err.Error())
		response.BadRequest(c, "Stripe error: "+err.Error())
		return
	}

	// Persist a payments record for the boost
	h.db.Table("payments").Create(map[string]interface{}{
		"id":                       uuid.New(),
		"user_id":                  userID,
		"listing_id":               listingID,
		"kind":                     "boost",
		"stripe_payment_intent_id": pi.ID,
		"stripe_client_secret":     pi.ClientSecret,
		"amount":                   boostFee,
		"currency":                 "USD",
		"status":                   "pending",
		"description":              fmt.Sprintf("Listing boost (%d days): %s", BoostDays, listing.Title),
		"created_at":               time.Now(),
		"updated_at":               time.Now(),
	})

	slog.Info("monetization: boost payment intent created",
		"listing_id", listingID, "user_id", userID, "amount", boostFee)

	response.Created(c, gin.H{
		"payment_intent_id": pi.ID,
		"client_secret":     pi.ClientSecret,
		"amount":            boostFee,
		"currency":          "USD",
		"boost_days":        BoostDays,
	})
}

// ════════════════════════════════════════════════════════════════════════════
// POST /listings/:id/boost/confirm — confirm boost payment, activate feature
// ════════════════════════════════════════════════════════════════════════════

type ConfirmBoostReq struct {
	PaymentIntentID string `json:"payment_intent_id" binding:"required"`
}

func (h *Handler) ConfirmBoost(c *gin.Context) {
	if !stripeEnabled() {
		c.AbortWithStatusJSON(http.StatusPaymentRequired, gin.H{
			"error":   "stripe_not_configured",
			"message": "Listing boosts require Stripe to be configured.",
		})
		return
	}

	listingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid listing id")
		return
	}

	var req ConfirmBoostReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	userID := c.GetString("user_id")

	// Verify ownership
	var ownerID string
	if err := h.db.Table("listings").Select("user_id").
		Where("id = ? AND deleted_at IS NULL", listingID).
		Pluck("user_id", &ownerID).Error; err != nil {
		response.NotFound(c, "listing")
		return
	}
	if ownerID != userID {
		response.Forbidden(c)
		return
	}

	// Validate PI belongs to this caller for this listing (prevents PI reuse)
	var pendingBoost struct {
		ID        string
		ListingID *string
	}
	if err := h.db.Table("payments").
		Select("id, listing_id").
		Where("stripe_payment_intent_id = ? AND user_id = ? AND kind = ? AND status = ?",
			req.PaymentIntentID, userID, "boost", "pending").
		First(&pendingBoost).Error; err != nil {
		c.AbortWithStatusJSON(403, gin.H{
			"error":   "payment_not_found",
			"message": "Payment not found or does not belong to you.",
		})
		return
	}
	if pendingBoost.ListingID == nil || *pendingBoost.ListingID != listingID.String() {
		c.AbortWithStatusJSON(403, gin.H{
			"error":   "payment_listing_mismatch",
			"message": "Payment was created for a different listing.",
		})
		return
	}

	// Retrieve PI status from Stripe
	pi, err := paymentintent.Get(req.PaymentIntentID, nil)
	if err != nil {
		response.BadRequest(c, "Stripe error: "+err.Error())
		return
	}

	if pi.Status != stripe.PaymentIntentStatusSucceeded {
		response.BadRequest(c, fmt.Sprintf("payment not yet succeeded (status: %s)", pi.Status))
		return
	}

	// Mark listing as featured with expiry
	featuredUntil := time.Now().Add(BoostDays * 24 * time.Hour)
	if err := h.db.Table("listings").
		Where("id = ?", listingID).
		Updates(map[string]interface{}{
			"is_featured":    true,
			"featured_until": featuredUntil,
		}).Error; err != nil {
		response.InternalError(c, err)
		return
	}

	// Mark the boost payment as succeeded
	h.db.Table("payments").
		Where("stripe_payment_intent_id = ?", req.PaymentIntentID).
		Updates(map[string]interface{}{"status": "succeeded"})

	slog.Info("monetization: listing boosted",
		"listing_id", listingID, "user_id", userID, "featured_until", featuredUntil)

	response.OK(c, gin.H{
		"listing_id":     listingID,
		"is_featured":    true,
		"featured_until": featuredUntil,
		"message":        fmt.Sprintf("Your listing is now featured for %d days.", BoostDays),
	})
}

// ════════════════════════════════════════════════════════════════════════════
// POST /subscriptions/upgrade — upgrade seller to Pro or Business tier
// ════════════════════════════════════════════════════════════════════════════

type UpgradeReq struct {
	Tier TierName `json:"tier" binding:"required"`
}

func (h *Handler) UpgradeSubscription(c *gin.Context) {
	if !stripeEnabled() {
		c.AbortWithStatusJSON(http.StatusPaymentRequired, gin.H{
			"error":   "stripe_not_configured",
			"message": "Seller subscriptions require Stripe to be configured. Set STRIPE_SECRET_KEY.",
		})
		return
	}

	var req UpgradeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	if req.Tier != TierPro && req.Tier != TierBusiness {
		response.BadRequest(c, "tier must be 'pro' or 'business'")
		return
	}

	userID := c.GetString("user_id")

	var fee float64
	switch req.Tier {
	case TierPro:
		fee = ProMonthlyFee
	case TierBusiness:
		fee = BusinessMonthlyFee
	}

	stripeCustomerID, err := h.ensureStripeCustomer(userID)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Create a one-time PaymentIntent representing the first month's fee.
	amountSmallest := int64(fee * 100)
	piParams := &stripe.PaymentIntentParams{
		Amount:      stripe.Int64(amountSmallest),
		Currency:    stripe.String("usd"),
		Description: stripe.String(fmt.Sprintf("GeoCore %s subscription (monthly)", req.Tier)),
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
	}
	if stripeCustomerID != "" {
		piParams.Customer = stripe.String(stripeCustomerID)
	}
	piParams.AddMetadata("user_id", userID)
	piParams.AddMetadata("tier", string(req.Tier))
	piParams.AddMetadata("kind", "subscription")

	pi, err := paymentintent.New(piParams)
	if err != nil {
		slog.Error("monetization: Stripe subscription payment intent failed",
			"user_id", userID, "tier", req.Tier, "error", err.Error())
		response.BadRequest(c, "Stripe error: "+err.Error())
		return
	}

	h.db.Table("payments").Create(map[string]interface{}{
		"id":                       uuid.New(),
		"user_id":                  userID,
		"kind":                     "subscription",
		"stripe_payment_intent_id": pi.ID,
		"stripe_client_secret":     pi.ClientSecret,
		"amount":                   fee,
		"currency":                 "USD",
		"status":                   "pending",
		"description":              fmt.Sprintf("Subscription upgrade to %s tier", req.Tier),
		"created_at":               time.Now(),
		"updated_at":               time.Now(),
	})

	slog.Info("monetization: subscription upgrade intent created",
		"user_id", userID, "tier", req.Tier, "fee", fee)

	response.Created(c, gin.H{
		"payment_intent_id": pi.ID,
		"client_secret":     pi.ClientSecret,
		"tier":              req.Tier,
		"amount":            fee,
		"currency":          "USD",
		"message":           "Complete payment to activate your subscription.",
	})
}

// ════════════════════════════════════════════════════════════════════════════
// POST /subscriptions/confirm — activate tier after payment succeeds
// ════════════════════════════════════════════════════════════════════════════

type ConfirmSubReq struct {
	PaymentIntentID string   `json:"payment_intent_id" binding:"required"`
	Tier            TierName `json:"tier" binding:"required"`
}

func (h *Handler) ConfirmSubscription(c *gin.Context) {
	if !stripeEnabled() {
		c.AbortWithStatusJSON(http.StatusPaymentRequired, gin.H{
			"error":   "stripe_not_configured",
			"message": "Seller subscriptions require Stripe to be configured.",
		})
		return
	}

	var req ConfirmSubReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	if req.Tier != TierPro && req.Tier != TierBusiness {
		response.BadRequest(c, "tier must be 'pro' or 'business'")
		return
	}

	userID := c.GetString("user_id")

	// Validate PI belongs to this caller with matching kind (prevents PI reuse)
	var pendingSub struct{ ID string }
	if err := h.db.Table("payments").
		Select("id").
		Where("stripe_payment_intent_id = ? AND user_id = ? AND kind = ? AND status = ?",
			req.PaymentIntentID, userID, "subscription", "pending").
		First(&pendingSub).Error; err != nil {
		c.AbortWithStatusJSON(403, gin.H{
			"error":   "payment_not_found",
			"message": "Payment not found or does not belong to you.",
		})
		return
	}

	pi, err := paymentintent.Get(req.PaymentIntentID, nil)
	if err != nil {
		response.BadRequest(c, "Stripe error: "+err.Error())
		return
	}
	// Verify tier from PI metadata matches requested tier
	if metaTier, ok := pi.Metadata["tier"]; ok && metaTier != string(req.Tier) {
		c.AbortWithStatusJSON(403, gin.H{
			"error":   "tier_mismatch",
			"message": "Payment was created for a different subscription tier.",
		})
		return
	}
	if pi.Status != stripe.PaymentIntentStatusSucceeded {
		response.BadRequest(c, fmt.Sprintf("payment not yet succeeded (status: %s)", pi.Status))
		return
	}

	now := time.Now()
	expiresAt := now.AddDate(0, 1, 0) // 1 month

	userUUID, _ := uuid.Parse(userID)

	// Upsert SellerSubscription
	var existing SellerSubscription
	if err := h.db.Where("user_id = ?", userUUID).First(&existing).Error; err != nil {
		h.db.Create(&SellerSubscription{
			UserID:    userUUID,
			Tier:      req.Tier,
			StartsAt:  now,
			ExpiresAt: &expiresAt,
		})
	} else {
		h.db.Model(&existing).Updates(map[string]interface{}{
			"tier":       req.Tier,
			"starts_at":  now,
			"expires_at": expiresAt,
		})
	}

	// Mirror tier and expiry on user record for fast lookup at listing-creation time
	h.db.Table("users").Where("id = ?", userID).
		Updates(map[string]interface{}{
			"subscription_tier":       string(req.Tier),
			"subscription_expires_at": expiresAt,
		})

	// Mark the payment as succeeded
	h.db.Table("payments").
		Where("stripe_payment_intent_id = ?", req.PaymentIntentID).
		Updates(map[string]interface{}{"status": "succeeded"})

	slog.Info("monetization: subscription activated",
		"user_id", userID, "tier", req.Tier, "expires_at", expiresAt)

	limits := Limits(req.Tier)
	response.OK(c, gin.H{
		"tier":       req.Tier,
		"starts_at":  now,
		"expires_at": expiresAt,
		"limits":     limits,
		"message":    fmt.Sprintf("Subscription upgraded to %s.", req.Tier),
	})
}

// ════════════════════════════════════════════════════════════════════════════
// GET /subscriptions/me — current user subscription info
// ════════════════════════════════════════════════════════════════════════════

func (h *Handler) GetMySubscription(c *gin.Context) {
	userID := c.GetString("user_id")

	var sub struct {
		SubscriptionTier      string
		SubscriptionExpiresAt *time.Time
	}
	h.db.Table("users").
		Select("subscription_tier, subscription_expires_at").
		Where("id = ? AND deleted_at IS NULL", userID).
		Scan(&sub)

	tier := TierName(sub.SubscriptionTier)
	if tier == "" {
		tier = TierBasic
	}
	limits := Limits(tier)

	isActive := true
	if sub.SubscriptionExpiresAt != nil && sub.SubscriptionExpiresAt.Before(time.Now()) && tier != TierBasic {
		isActive = false
		tier = TierBasic
		limits = Limits(TierBasic)
	}

	response.OK(c, gin.H{
		"tier":       tier,
		"expires_at": sub.SubscriptionExpiresAt,
		"is_active":  isActive,
		"limits":     limits,
	})
}

// ════════════════════════════════════════════════════════════════════════════
// Internal helpers
// ════════════════════════════════════════════════════════════════════════════

// ensureStripeCustomer returns the user's existing Stripe customer ID or creates
// a new one, persisting the result on the users table.
func (h *Handler) ensureStripeCustomer(userID string) (string, error) {
	var row struct {
		Email            string
		Name             string
		StripeCustomerID string
	}
	if err := h.db.Table("users").
		Select("email, name, stripe_customer_id").
		Where("id = ? AND deleted_at IS NULL", userID).
		Scan(&row).Error; err != nil {
		return "", fmt.Errorf("load user: %w", err)
	}
	if row.StripeCustomerID != "" {
		return row.StripeCustomerID, nil
	}

	cust, err := customer.New(&stripe.CustomerParams{
		Email: stripe.String(row.Email),
		Name:  stripe.String(row.Name),
	})
	if err != nil {
		return "", fmt.Errorf("stripe: create customer: %w", err)
	}

	h.db.Table("users").Where("id = ?", userID).
		Update("stripe_customer_id", cust.ID)
	return cust.ID, nil
}

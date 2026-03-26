package payments

  import (
  	"fmt"
  	"log/slog"
  	"strings"
  	"time"

  	"github.com/geocore-next/backend/internal/users"
  	"github.com/geocore-next/backend/pkg/response"
  	"github.com/gin-gonic/gin"
  	"github.com/google/uuid"
  	"github.com/stripe/stripe-go/v79"
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

  // ════════════════════════════════════════════════════════════════════════════
  // Request types
  // ════════════════════════════════════════════════════════════════════════════

  type CreatePaymentIntentReq struct {
  	ListingID   *string `json:"listing_id"`
  	AuctionID   *string `json:"auction_id"`
  	SellerID    string  `json:"seller_id"  binding:"required"`
  	Amount      float64 `json:"amount"     binding:"required,gt=0"`
  	Currency    string  `json:"currency"`
  	Description string  `json:"description"`
  }

  type ConfirmPaymentReq struct {
  	PaymentIntentID string `json:"payment_intent_id" binding:"required"`
  }

  type ReleaseEscrowReq struct {
  	EscrowID string `json:"escrow_id" binding:"required"`
  	Notes    string `json:"notes"`
  }

  type RefundReq struct {
  	PaymentID string `json:"payment_id" binding:"required"`
  	Reason    string `json:"reason"`
  }

  type AddPaymentMethodReq struct {
  	PaymentMethodID string `json:"payment_method_id" binding:"required"`
  	SetDefault      bool   `json:"set_default"`
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CreatePaymentIntent — POST /api/v1/payments/create-payment-intent
  // ════════════════════════════════════════════════════════════════════════════

  // CreatePaymentIntent creates a Stripe PaymentIntent and saves a pending Payment record.
  // The client_secret is returned to the frontend which uses Stripe.js to complete payment.
  func (h *Handler) CreatePaymentIntent(c *gin.Context) {
  	var req CreatePaymentIntentReq
  	if err := c.ShouldBindJSON(&req); err != nil {
  		response.BadRequest(c, err.Error())
  		return
  	}

  	// ── Load buyer ────────────────────────────────────────────────────────────
  	buyerID := c.GetString("user_id")
  	var buyer users.User
  	if err := h.db.First(&buyer, "id = ?", buyerID).Error; err != nil {
  		response.NotFound(c, "user")
  		return
  	}

  	// ── Validate seller ───────────────────────────────────────────────────────
  	if req.SellerID == buyerID {
  		response.BadRequest(c, "buyer and seller cannot be the same user")
  		return
  	}
  	var seller users.User
  	if err := h.db.First(&seller, "id = ?", req.SellerID).Error; err != nil {
  		response.NotFound(c, "seller")
  		return
  	}

  	// ── Ensure buyer has a Stripe customer record ─────────────────────────────
  	stripeCustomerID, err := h.ensureStripeCustomer(&buyer)
  	if err != nil {
  		slog.Error("failed to ensure Stripe customer",
  			"user_id", buyer.ID.String(), "error", err.Error())
  		response.InternalError(c, err)
  		return
  	}

  	// ── Normalise currency ────────────────────────────────────────────────────
  	currency := strings.ToLower(req.Currency)
  	if currency == "" {
  		currency = "aed"
  	}

  	// ── Build metadata ────────────────────────────────────────────────────────
  	meta := map[string]string{
  		"buyer_id":  buyer.ID.String(),
  		"seller_id": seller.ID.String(),
  		"platform":  "geocore",
  	}
  	if req.ListingID != nil {
  		meta["listing_id"] = *req.ListingID
  	}
  	if req.AuctionID != nil {
  		meta["auction_id"] = *req.AuctionID
  	}

  	desc := req.Description
  	if desc == "" {
  		desc = fmt.Sprintf("GeoCore payment — %.2f %s", req.Amount, strings.ToUpper(currency))
  	}

  	// ── Create Stripe PaymentIntent ───────────────────────────────────────────
  	pi, err := createPaymentIntent(req.Amount, currency, stripeCustomerID, desc, meta)
  	if err != nil {
  		slog.Error("Stripe: failed to create payment intent",
  			"user_id", buyer.ID.String(), "amount", req.Amount, "error", err.Error())
  		response.BadRequest(c, stripeErrMsg(err))
  		return
  	}

  	// ── Parse optional IDs ────────────────────────────────────────────────────
  	var listingID, auctionID *uuid.UUID
  	if req.ListingID != nil {
  		if id, e := uuid.Parse(*req.ListingID); e == nil {
  			listingID = &id
  		}
  	}
  	if req.AuctionID != nil {
  		if id, e := uuid.Parse(*req.AuctionID); e == nil {
  			auctionID = &id
  		}
  	}

  	// ── Persist pending payment record ────────────────────────────────────────
  	payment := Payment{
  		UserID:                buyer.ID,
  		ListingID:             listingID,
  		AuctionID:             auctionID,
  		StripePaymentIntentID: pi.ID,
  		StripeClientSecret:    pi.ClientSecret,
  		Amount:                req.Amount,
  		Currency:              strings.ToUpper(currency),
  		Status:                PaymentStatusPending,
  		Description:           desc,
  	}
  	if err := h.db.Create(&payment).Error; err != nil {
  		slog.Error("failed to save payment record",
  			"stripe_pi", pi.ID, "error", err.Error())
  		response.InternalError(c, err)
  		return
  	}

  	slog.Info("payment intent created",
  		"payment_id", payment.ID.String(),
  		"stripe_pi",  pi.ID,
  		"amount",     req.Amount,
  		"currency",   currency,
  		"buyer_id",   buyer.ID.String(),
  	)

  	response.Created(c, gin.H{
  		"payment_id":        payment.ID,
  		"payment_intent_id": pi.ID,
  		"client_secret":     pi.ClientSecret,
  		"amount":            req.Amount,
  		"currency":          strings.ToUpper(currency),
  	})
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ConfirmPayment — POST /api/v1/payments/confirm
  // ════════════════════════════════════════════════════════════════════════════

  // ConfirmPayment checks the latest PaymentIntent status from Stripe.
  // If the payment succeeded, it creates an EscrowAccount record and marks
  // the payment as succeeded.
  //
  // Note: For a production system, status should primarily be updated via
  // Stripe webhooks (Task 2.2).  This endpoint provides a fallback for clients
  // that want to poll status after the Stripe.js confirmation flow.
  func (h *Handler) ConfirmPayment(c *gin.Context) {
  	var req ConfirmPaymentReq
  	if err := c.ShouldBindJSON(&req); err != nil {
  		response.BadRequest(c, err.Error())
  		return
  	}

  	// ── Load local payment record ─────────────────────────────────────────────
  	var payment Payment
  	if err := h.db.Where("stripe_payment_intent_id = ?", req.PaymentIntentID).
  		First(&payment).Error; err != nil {
  		response.NotFound(c, "payment")
  		return
  	}

  	// Verify this payment belongs to the authenticated user
  	buyerID := c.GetString("user_id")
  	if payment.UserID.String() != buyerID {
  		response.Forbidden(c)
  		return
  	}

  	// If already processed, return current status
  	if payment.Status == PaymentStatusSucceeded {
  		response.OK(c, gin.H{"status": payment.Status, "payment_id": payment.ID})
  		return
  	}

  	// ── Fetch latest status from Stripe ──────────────────────────────────────
  	pi, err := retrievePaymentIntent(req.PaymentIntentID)
  	if err != nil {
  		response.InternalError(c, err)
  		return
  	}

  	switch pi.Status {
  	case stripe.PaymentIntentStatusSucceeded:
  		if err := h.handlePaymentSuccess(c, &payment, pi); err != nil {
  			response.InternalError(c, err)
  			return
  		}
  		response.OK(c, gin.H{
  			"status":     "succeeded",
  			"payment_id": payment.ID,
  			"message":    "Payment successful. Funds are held in escrow.",
  		})

  	case stripe.PaymentIntentStatusRequiresAction:
  		response.OK(c, gin.H{
  			"status":        "requires_action",
  			"client_secret": pi.ClientSecret,
  			"message":       "Additional authentication required (3D Secure).",
  		})

  	case stripe.PaymentIntentStatusRequiresPaymentMethod:
  		h.db.Model(&payment).Update("status", PaymentStatusFailed)
  		response.BadRequest(c, "Payment failed. Please try again with a different payment method.")

  	default:
  		response.OK(c, gin.H{
  			"status":  string(pi.Status),
  			"message": "Payment is being processed.",
  		})
  	}
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ReleaseEscrow — POST /api/v1/payments/release-escrow
  // ════════════════════════════════════════════════════════════════════════════

  // ReleaseEscrow marks an escrow account as released.
  // Only the buyer (the one who paid) can trigger a release.
  // After release, the seller receives their funds (handled by Stripe Connect
  // or manual payout — depending on the business model).
  func (h *Handler) ReleaseEscrow(c *gin.Context) {
  	var req ReleaseEscrowReq
  	if err := c.ShouldBindJSON(&req); err != nil {
  		response.BadRequest(c, err.Error())
  		return
  	}

  	buyerID := c.GetString("user_id")

  	var escrow EscrowAccount
  	if err := h.db.Preload("Payment").
  		First(&escrow, "id = ?", req.EscrowID).Error; err != nil {
  		response.NotFound(c, "escrow")
  		return
  	}

  	// Verify the requester is the buyer
  	if escrow.BuyerID.String() != buyerID {
  		response.Forbidden(c)
  		return
  	}

  	// Can only release "held" escrow
  	if escrow.Status != EscrowStatusHeld {
  		response.BadRequest(c, fmt.Sprintf("escrow is already %s", escrow.Status))
  		return
  	}

  	now := time.Now()
  	if err := h.db.Model(&escrow).Updates(map[string]any{
  		"status":      EscrowStatusReleased,
  		"released_at": now,
  		"notes":       req.Notes,
  	}).Error; err != nil {
  		response.InternalError(c, err)
  		return
  	}

  	slog.Info("escrow released",
  		"escrow_id", escrow.ID.String(),
  		"buyer_id",  buyerID,
  		"seller_id", escrow.SellerID.String(),
  		"amount",    escrow.Amount,
  	)

  	response.OK(c, gin.H{
  		"escrow_id":   escrow.ID,
  		"status":      EscrowStatusReleased,
  		"released_at": now,
  		"message":     "Funds released to seller.",
  	})
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RequestRefund — POST /api/v1/payments/request-refund
  // ════════════════════════════════════════════════════════════════════════════

  // RequestRefund issues a full refund for a payment via Stripe.
  // Only the buyer can request a refund, and only when escrow is still held.
  func (h *Handler) RequestRefund(c *gin.Context) {
  	var req RefundReq
  	if err := c.ShouldBindJSON(&req); err != nil {
  		response.BadRequest(c, err.Error())
  		return
  	}

  	buyerID := c.GetString("user_id")
  	paymentUUID, err := uuid.Parse(req.PaymentID)
  	if err != nil {
  		response.BadRequest(c, "invalid payment_id")
  		return
  	}

  	var payment Payment
  	if err := h.db.Preload("Escrow").First(&payment, "id = ?", paymentUUID).Error; err != nil {
  		response.NotFound(c, "payment")
  		return
  	}

  	if payment.UserID.String() != buyerID {
  		response.Forbidden(c)
  		return
  	}

  	if payment.Status != PaymentStatusSucceeded {
  		response.BadRequest(c, "only succeeded payments can be refunded")
  		return
  	}

  	// Check escrow is still held (not released)
  	if payment.Escrow != nil && payment.Escrow.Status != EscrowStatusHeld {
  		response.BadRequest(c, "cannot refund: escrow funds have already been released to the seller")
  		return
  	}

  	// ── Issue Stripe refund ───────────────────────────────────────────────────
  	_, refundErr := issueRefund(payment.StripePaymentIntentID, nil)
  	if refundErr != nil {
  		slog.Error("Stripe refund failed",
  			"payment_id", payment.ID.String(), "error", refundErr.Error())
  		response.BadRequest(c, stripeErrMsg(refundErr))
  		return
  	}

  	// ── Update local records ──────────────────────────────────────────────────
  	now := time.Now()
  	h.db.Model(&payment).Updates(map[string]any{
  		"status":      PaymentStatusRefunded,
  		"refunded_at": now,
  	})
  	if payment.Escrow != nil {
  		h.db.Model(payment.Escrow).Update("status", EscrowStatusRefunded)
  	}

  	slog.Info("payment refunded",
  		"payment_id", payment.ID.String(),
  		"buyer_id",   buyerID,
  		"amount",     payment.Amount,
  	)

  	response.OK(c, gin.H{
  		"payment_id":  payment.ID,
  		"status":      PaymentStatusRefunded,
  		"refunded_at": now,
  		"message":     "Refund initiated. It may take 5–10 business days to appear on your statement.",
  	})
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GetPaymentMethods — GET /api/v1/payments/payment-methods
  // ════════════════════════════════════════════════════════════════════════════

  func (h *Handler) GetPaymentMethods(c *gin.Context) {
  	buyerID := c.GetString("user_id")

  	var user users.User
  	if err := h.db.First(&user, "id = ?", buyerID).Error; err != nil {
  		response.NotFound(c, "user")
  		return
  	}

  	if user.StripeCustomerID == "" {
  		response.OK(c, gin.H{"payment_methods": []gin.H{}})
  		return
  	}

  	methods, err := listPaymentMethods(user.StripeCustomerID)
  	if err != nil {
  		response.InternalError(c, err)
  		return
  	}

  	// Also load saved methods from DB (includes is_default flag)
  	var saved []SavedPaymentMethod
  	h.db.Where("user_id = ?", buyerID).Find(&saved)
  	savedMap := make(map[string]SavedPaymentMethod, len(saved))
  	for _, s := range saved {
  		savedMap[s.StripeMethodID] = s
  	}

  	out := make([]gin.H, 0, len(methods))
  	for _, m := range methods {
  		entry := gin.H{
  			"id":        m.ID,
  			"brand":     string(m.Card.Brand),
  			"last4":     m.Card.Last4,
  			"exp_month": m.Card.ExpMonth,
  			"exp_year":  m.Card.ExpYear,
  			"is_default": false,
  		}
  		if db, ok := savedMap[m.ID]; ok {
  			entry["is_default"] = db.IsDefault
  		}
  		out = append(out, entry)
  	}

  	response.OK(c, gin.H{"payment_methods": out})
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AddPaymentMethod — POST /api/v1/payments/add-payment-method
  // ════════════════════════════════════════════════════════════════════════════

  func (h *Handler) AddPaymentMethod(c *gin.Context) {
  	var req AddPaymentMethodReq
  	if err := c.ShouldBindJSON(&req); err != nil {
  		response.BadRequest(c, err.Error())
  		return
  	}

  	buyerID := c.GetString("user_id")
  	var user users.User
  	if err := h.db.First(&user, "id = ?", buyerID).Error; err != nil {
  		response.NotFound(c, "user")
  		return
  	}

  	// Ensure Stripe customer exists
  	stripeCustomerID, err := h.ensureStripeCustomer(&user)
  	if err != nil {
  		response.InternalError(c, err)
  		return
  	}

  	// Attach payment method to customer in Stripe
  	pm, err := attachPaymentMethod(req.PaymentMethodID, stripeCustomerID)
  	if err != nil {
  		response.BadRequest(c, stripeErrMsg(err))
  		return
  	}

  	// If set as default, unset previous defaults
  	if req.SetDefault {
  		h.db.Model(&SavedPaymentMethod{}).
  			Where("user_id = ?", buyerID).
  			Update("is_default", false)
  	}

  	// Upsert saved payment method in DB
  	userUUID, _ := uuid.Parse(buyerID)
  	savedPM := SavedPaymentMethod{
  		UserID:         userUUID,
  		StripeMethodID: pm.ID,
  		Brand:          string(pm.Card.Brand),
  		Last4:          pm.Card.Last4,
  		ExpMonth:       int(pm.Card.ExpMonth),
  		ExpYear:        int(pm.Card.ExpYear),
  		IsDefault:      req.SetDefault,
  	}
  	h.db.Where("stripe_method_id = ?", pm.ID).FirstOrCreate(&savedPM)

  	response.Created(c, gin.H{
  		"id":        pm.ID,
  		"brand":     string(pm.Card.Brand),
  		"last4":     pm.Card.Last4,
  		"exp_month": pm.Card.ExpMonth,
  		"exp_year":  pm.Card.ExpYear,
  		"is_default": req.SetDefault,
  	})
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DeletePaymentMethod — DELETE /api/v1/payments/payment-methods/:id
  // ════════════════════════════════════════════════════════════════════════════

  func (h *Handler) DeletePaymentMethod(c *gin.Context) {
  	pmID := c.Param("id")
  	buyerID := c.GetString("user_id")

  	// Verify ownership in DB before detaching
  	var saved SavedPaymentMethod
  	if err := h.db.Where("stripe_method_id = ? AND user_id = ?", pmID, buyerID).
  		First(&saved).Error; err != nil {
  		response.NotFound(c, "payment method")
  		return
  	}

  	if err := detachPaymentMethod(pmID); err != nil {
  		response.BadRequest(c, stripeErrMsg(err))
  		return
  	}

  	h.db.Delete(&saved)

  	response.OK(c, gin.H{"message": "Payment method removed."})
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GetPaymentHistory — GET /api/v1/payments
  // ════════════════════════════════════════════════════════════════════════════

  func (h *Handler) GetPaymentHistory(c *gin.Context) {
  	buyerID := c.GetString("user_id")

  	var payments []Payment
  	query := h.db.Where("user_id = ?", buyerID).
  		Preload("Escrow").
  		Order("created_at DESC")

  	// Optional status filter
  	if status := c.Query("status"); status != "" {
  		query = query.Where("status = ?", status)
  	}

  	var total int64
  	query.Model(&Payment{}).Count(&total)

  	page, perPage := paginationParams(c)
  	query.Offset((page - 1) * perPage).Limit(perPage).Find(&payments)

  	response.OKMeta(c, payments, response.Meta{
  		Total:   total,
  		Page:    page,
  		PerPage: perPage,
  		Pages:   (total + int64(perPage) - 1) / int64(perPage),
  	})
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Internal helpers
  // ════════════════════════════════════════════════════════════════════════════

  // ensureStripeCustomer gets or creates a Stripe customer for the user.
  // If the user already has a stripe_customer_id, it returns it directly.
  func (h *Handler) ensureStripeCustomer(user *users.User) (string, error) {
  	if user.StripeCustomerID != "" {
  		return user.StripeCustomerID, nil
  	}

  	custID, err := createStripeCustomer(user.Email, user.Name, user.Phone)
  	if err != nil {
  		return "", err
  	}

  	if err := h.db.Model(user).Update("stripe_customer_id", custID).Error; err != nil {
  		slog.Warn("saved Stripe customer ID to DB failed",
  			"user_id", user.ID.String(), "cust_id", custID)
  	}
  	user.StripeCustomerID = custID
  	return custID, nil
  }

  // handlePaymentSuccess transitions a payment to succeeded and creates escrow.
  // Called both from ConfirmPayment and from the webhook handler (Task 2.2).
  func (h *Handler) handlePaymentSuccess(c *gin.Context, payment *Payment, pi *stripe.PaymentIntent) error {
  	if payment.Status == PaymentStatusSucceeded {
  		return nil // idempotent — already processed
  	}

  	// Parse seller from PI metadata
  	sellerIDStr := pi.Metadata["seller_id"]
  	sellerUUID, err := uuid.Parse(sellerIDStr)
  	if err != nil {
  		return fmt.Errorf("invalid seller_id in payment intent metadata")
  	}

  	// Update payment status
  	if err := h.db.Model(payment).Updates(map[string]any{
  		"status":         PaymentStatusSucceeded,
  		"payment_method": "card", // expanded later if needed
  	}).Error; err != nil {
  		return err
  	}

  	// Create escrow record
  	escrow := EscrowAccount{
  		PaymentID: payment.ID,
  		SellerID:  sellerUUID,
  		BuyerID:   payment.UserID,
  		Amount:    payment.Amount,
  		Currency:  payment.Currency,
  		Status:    EscrowStatusHeld,
  	}
  	if err := h.db.Where("payment_id = ?", payment.ID).
  		FirstOrCreate(&escrow).Error; err != nil {
  		return err
  	}

  	slog.Info("payment succeeded, escrow created",
  		"payment_id", payment.ID.String(),
  		"escrow_id",  escrow.ID.String(),
  		"amount",     payment.Amount,
  		"currency",   payment.Currency,
  	)
  	return nil
  }

  // paginationParams extracts page and per_page from query string.
  func paginationParams(c *gin.Context) (page, perPage int) {
  	page = 1
  	perPage = 20
  	if p := c.Query("page"); p != "" {
  		fmt.Sscan(p, &page)
  	}
  	if pp := c.Query("per_page"); pp != "" {
  		fmt.Sscan(pp, &perPage)
  	}
  	if page < 1 {
  		page = 1
  	}
  	if perPage < 1 || perPage > 100 {
  		perPage = 20
  	}
  	return
  }
  
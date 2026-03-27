package stores

import (
        "context"
        "encoding/json"
        "regexp"
        "strings"
        "time"

        "github.com/geocore-next/backend/internal/listings"
        "github.com/geocore-next/backend/pkg/response"
        "github.com/gin-gonic/gin"
        "github.com/google/uuid"
        "github.com/redis/go-redis/v9"
        "gorm.io/gorm"
)

type Handler struct {
        db  *gorm.DB
        rdb *redis.Client
}

func NewHandler(db *gorm.DB, rdb *redis.Client) *Handler {
        return &Handler{db, rdb}
}

const storeListCacheKey = "stores:list"
const storeListCacheTTL = 5 * time.Minute

// List — GET /api/v1/stores
// Returns all active storefronts, paginated. Results are cached in Redis for 5 minutes.
func (h *Handler) List(c *gin.Context) {
        // Try Redis cache
        if h.rdb != nil {
                if cached, err := h.rdb.Get(context.Background(), storeListCacheKey).Bytes(); err == nil {
                        var stores []Storefront
                        if json.Unmarshal(cached, &stores) == nil {
                                response.OK(c, stores)
                                return
                        }
                }
        }

        var stores []Storefront
        h.db.Where("is_active = true").
                Order("views DESC").
                Limit(50).
                Find(&stores)

        // Cache result
        if h.rdb != nil {
                if data, err := json.Marshal(stores); err == nil {
                        h.rdb.Set(context.Background(), storeListCacheKey, data, storeListCacheTTL)
                }
        }

        response.OK(c, stores)
}

// GetBySlug — GET /api/v1/stores/:slug
// Returns a storefront with its active listings.
func (h *Handler) GetBySlug(c *gin.Context) {
        slug := c.Param("slug")

        var store Storefront
        if err := h.db.Where("slug = ? AND is_active = true", slug).First(&store).Error; err != nil {
                response.NotFound(c, "Storefront")
                return
        }

        // Increment view count asynchronously
        go h.db.Model(&store).UpdateColumn("views", gorm.Expr("views + 1"))

        // Load seller's active listings
        var storeListings []listings.Listing
        h.db.Where("user_id = ? AND status = ?", store.UserID, "active").
                Preload("Images").
                Preload("Category").
                Order("created_at DESC").
                Limit(48).
                Find(&storeListings)

        // Refresh view count for response
        store.Views++

        c.JSON(200, gin.H{
                "success": true,
                "data": gin.H{
                        "storefront": store,
                        "listings":   storeListings,
                },
        })
}

// GetMyStore — GET /api/v1/stores/me (auth required)
func (h *Handler) GetMyStore(c *gin.Context) {
        userID, _ := uuid.Parse(c.MustGet("user_id").(string))
        var store Storefront
        if err := h.db.Where("user_id = ?", userID).First(&store).Error; err != nil {
                response.NotFound(c, "Storefront")
                return
        }
        response.OK(c, store)
}

// Create — POST /api/v1/stores (auth required)
func (h *Handler) Create(c *gin.Context) {
        userID, _ := uuid.Parse(c.MustGet("user_id").(string))

        // Check if user already has a storefront
        var existing Storefront
        if h.db.Where("user_id = ?", userID).First(&existing).Error == nil {
                response.Conflict(c, "You already have a storefront")
                return
        }

        var req struct {
                Name        string `json:"name" binding:"required,min=2,max=120"`
                Description string `json:"description"`
                WelcomeMsg  string `json:"welcome_msg"`
                LogoURL     string `json:"logo_url"`
                BannerURL   string `json:"banner_url"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
                response.BadRequest(c, err.Error())
                return
        }

        slug := generateSlug(req.Name)
        // Ensure slug uniqueness
        var count int64
        h.db.Model(&Storefront{}).Where("slug = ?", slug).Count(&count)
        if count > 0 {
                slug = slug + "-" + time.Now().Format("0601")
        }

        store := Storefront{
                UserID:      userID,
                Slug:        slug,
                Name:        req.Name,
                Description: req.Description,
                WelcomeMsg:  req.WelcomeMsg,
                LogoURL:     req.LogoURL,
                BannerURL:   req.BannerURL,
        }

        if err := h.db.Create(&store).Error; err != nil {
                response.InternalError(c, err)
                return
        }

        // Invalidate store list cache
        if h.rdb != nil {
                h.rdb.Del(context.Background(), storeListCacheKey)
        }

        response.Created(c, store)
}

// Update — PUT /api/v1/stores/me (auth required)
func (h *Handler) Update(c *gin.Context) {
        userID, _ := uuid.Parse(c.MustGet("user_id").(string))

        var store Storefront
        if err := h.db.Where("user_id = ?", userID).First(&store).Error; err != nil {
                response.NotFound(c, "Storefront")
                return
        }

        var req struct {
                Name        *string `json:"name"`
                Description *string `json:"description"`
                WelcomeMsg  *string `json:"welcome_msg"`
                LogoURL     *string `json:"logo_url"`
                BannerURL   *string `json:"banner_url"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
                response.BadRequest(c, err.Error())
                return
        }

        updates := map[string]interface{}{}
        if req.Name != nil {
                updates["name"] = *req.Name
        }
        if req.Description != nil {
                updates["description"] = *req.Description
        }
        if req.WelcomeMsg != nil {
                updates["welcome_msg"] = *req.WelcomeMsg
        }
        if req.LogoURL != nil {
                updates["logo_url"] = *req.LogoURL
        }
        if req.BannerURL != nil {
                updates["banner_url"] = *req.BannerURL
        }

        h.db.Model(&store).Updates(updates)

        // Invalidate store list cache
        if h.rdb != nil {
                h.rdb.Del(context.Background(), storeListCacheKey)
        }

        response.OK(c, store)
}

// ── helpers ──────────────────────────────────────────────────────────────────

var nonAlphanumRE = regexp.MustCompile(`[^a-z0-9]+`)

func generateSlug(name string) string {
        s := strings.ToLower(name)
        s = nonAlphanumRE.ReplaceAllString(s, "-")
        s = strings.Trim(s, "-")
        if len(s) > 60 {
                s = s[:60]
        }
        return s
}

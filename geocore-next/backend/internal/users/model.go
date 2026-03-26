package users

  import (
        "time"
        "github.com/google/uuid"
        "gorm.io/gorm"
  )

  type User struct {
        ID           uuid.UUID      `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
        Name         string         `gorm:"not null" json:"name"`
        Email        string         `gorm:"uniqueIndex" json:"email"`
        Phone        string         `gorm:"uniqueIndex" json:"phone,omitempty"`
        PasswordHash string         `json:"-"`
        AvatarURL    string         `json:"avatar_url,omitempty"`
        Bio          string         `json:"bio,omitempty"`
        Location     string         `json:"location,omitempty"`
        Rating       float64        `gorm:"default:0" json:"rating"`
        ReviewCount  int            `gorm:"default:0" json:"review_count"`
        SoldCount    int            `gorm:"default:0" json:"sold_count"`
        IsVerified   bool           `gorm:"default:false" json:"is_verified"`
        IsActive     bool           `gorm:"default:true" json:"is_active"`
        IsBanned     bool           `gorm:"default:false" json:"is_banned"`
        BanReason    string         `json:"-"`
        Role         string         `gorm:"default:'user'" json:"role"`
        Balance      float64        `gorm:"default:0" json:"balance"`
        CreatedAt    time.Time      `json:"created_at"`
        UpdatedAt    time.Time      `json:"updated_at"`
        DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

        // ── Email verification ────────────────────────────────────────────────────
        EmailVerified               bool       `gorm:"default:false" json:"email_verified"`
        VerificationToken          string     `gorm:"size:64;index" json:"-"`
        VerificationTokenExpiresAt *time.Time `json:"-"`

        // ── Social auth ───────────────────────────────────────────────────────────
        GoogleID     string `gorm:"size:128;index" json:"-"`
        AppleID      string `gorm:"size:128;index" json:"-"`
        FacebookID   string `gorm:"size:128;index" json:"-"`
        AuthProvider string `gorm:"size:32;default:'email'" json:"auth_provider"`

        // ── Password reset ────────────────────────────────────────────────────────
        PasswordResetToken      string     `gorm:"size:64;index" json:"-"`
        PasswordResetExpiresAt  *time.Time `json:"-"`
        PasswordChangedAt       *time.Time `json:"-"`

        // ── Stripe ────────────────────────────────────────────────────────────────
        StripeCustomerID string `gorm:"size:64;uniqueIndex" json:"-"`

        // ── Preferences ───────────────────────────────────────────────────────────
        Language string `gorm:"size:8;default:'en'" json:"language"`
        Currency string `gorm:"size:8;default:'USD'" json:"currency"`
  }

  type PublicUser struct {
        ID          uuid.UUID `json:"id"`
        Name        string    `json:"name"`
        AvatarURL   string    `json:"avatar_url,omitempty"`
        Bio         string    `json:"bio,omitempty"`
        Location    string    `json:"location,omitempty"`
        Rating      float64   `json:"rating"`
        ReviewCount int       `json:"review_count"`
        SoldCount   int       `json:"sold_count"`
        IsVerified  bool      `json:"is_verified"`
        Role        string    `json:"role"`
  }

  func (u *User) ToPublic() PublicUser {
        return PublicUser{
                ID:          u.ID,
                Name:        u.Name,
                AvatarURL:   u.AvatarURL,
                Bio:         u.Bio,
                Location:    u.Location,
                Rating:      u.Rating,
                ReviewCount: u.ReviewCount,
                SoldCount:   u.SoldCount,
                IsVerified:  u.IsVerified,
                Role:        u.Role,
        }
  }
  
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"github.com/redis/go-redis/v9"
)

var (
	dbPool      *pgxpool.Pool
	redisClient *redis.Client
	jwtSecret   = []byte(os.Getenv("JWT_SECRET"))
)

func main() {
	// Initialize database
	initDB()
	defer dbPool.Close()

	// Initialize Redis
	initRedis()
	defer redisClient.Close()

	// Create Gin router
	router := gin.Default()

	// Middleware
	router.Use(corsMiddleware())
	router.Use(rateLimitMiddleware())

	// Routes
	router.GET("/health", healthCheck)
	router.POST("/auth/login", loginHandler)
	router.POST("/auth/register", registerHandler)
	router.POST("/auth/google", googleOAuthHandler)
	router.POST("/auth/refresh", refreshTokenHandler)
	router.GET("/auth/verify", verifyTokenHandler)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	log.Printf("Auth Service starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

func initDB() {
	ctx := context.Background()
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgresql://mnbarh:mnbarh_dev_password@postgres-primary:5432/auth_db"
	}

	var err error
	dbPool, err = pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatal("Failed to create database pool:", err)
	}

	// Test connection
	if err := dbPool.Ping(ctx); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	log.Println("Database connected successfully")
}

func initRedis() {
	redisAddr := os.Getenv("REDIS_URL")
	if redisAddr == "" {
		redisAddr = "redis:6379"
	}

	redisClient = redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: "",
		DB:       0,
	})

	ctx := context.Background()
	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}

	log.Println("Redis connected successfully")
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func rateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Simple rate limiting using Redis
		ctx := context.Background()
		ip := c.ClientIP()
		key := fmt.Sprintf("ratelimit:%s", ip)
		
		count, err := redisClient.Incr(ctx, key).Result()
		if err != nil {
			c.Next()
			return
		}
		
		if count == 1 {
			redisClient.Expire(ctx, key, time.Minute)
		}
		
		if count > 100 {
			c.JSON(429, gin.H{"error": "Too many requests"})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

func healthCheck(c *gin.Context) {
	ctx := context.Background()
	
	// Check database
	if err := dbPool.Ping(ctx); err != nil {
		c.JSON(503, gin.H{
			"status": "unhealthy",
			"error":  "Database connection failed",
		})
		return
	}
	
	// Check Redis
	if err := redisClient.Ping(ctx).Err(); err != nil {
		c.JSON(503, gin.H{
			"status": "unhealthy",
			"error":  "Redis connection failed",
		})
		return
	}
	
	c.JSON(200, gin.H{
		"status":  "healthy",
		"service": "auth-service",
		"version": "1.0.0",
	})
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

type AuthResponse struct {
	Token     string `json:"token"`
	RefreshToken string `json:"refreshToken"`
	User      User   `json:"user"`
}

type User struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Role      string `json:"role"`
}

func loginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	ctx := context.Background()
	
	// Query user from database
	var user User
	err := dbPool.QueryRow(ctx,
		"SELECT id, email, first_name, last_name, role FROM users WHERE email = $1",
		req.Email,
	).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Role)
	
	if err != nil {
		c.JSON(401, gin.H{"error": "Invalid credentials"})
		return
	}

	// TODO: Verify password hash
	// if !verifyPassword(req.Password, user.PasswordHash) {
	//     c.JSON(401, gin.H{"error": "Invalid credentials"})
	//     return
	// }

	// Generate JWT token
	token, err := generateJWT(user)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to generate token"})
		return
	}

	// Generate refresh token
	refreshToken := generateRefreshToken(user.ID)

	// Store refresh token in Redis
	redisClient.Set(ctx, fmt.Sprintf("refresh:%s", user.ID), refreshToken, 7*24*time.Hour)

	c.JSON(200, AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	})
}

func registerHandler(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	ctx := context.Background()
	
	// Check if user exists
	var exists bool
	err := dbPool.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)",
		req.Email,
	).Scan(&exists)
	
	if err != nil {
		c.JSON(500, gin.H{"error": "Database error"})
		return
	}
	
	if exists {
		c.JSON(409, gin.H{"error": "User already exists"})
		return
	}

	// TODO: Hash password
	// passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

	// Insert new user
	var userID string
	err = dbPool.QueryRow(ctx,
		"INSERT INTO users (email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, 'user') RETURNING id",
		req.Email, req.Password, req.FirstName, req.LastName,
	).Scan(&userID)
	
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate JWT token
	user := User{
		ID:        userID,
		Email:     req.Email,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Role:      "user",
	}
	
	token, err := generateJWT(user)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to generate token"})
		return
	}

	// Generate refresh token
	refreshToken := generateRefreshToken(userID)

	// Store refresh token in Redis
	redisClient.Set(ctx, fmt.Sprintf("refresh:%s", userID), refreshToken, 7*24*time.Hour)

	c.JSON(201, AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	})
}

func googleOAuthHandler(c *gin.Context) {
	var req struct {
		Code  string `json:"code"`
		State string `json:"state"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	ctx := context.Background()
	
	// Exchange code for token
	oauthConfig := &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URI"),
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}

	token, err := oauthConfig.Exchange(ctx, req.Code)
	if err != nil {
		c.JSON(400, gin.H{"error": "Failed to exchange code for token"})
		return
	}

	// Get user info from Google
	// TODO: Implement Google API call to get user info

	// Create or update user
	// TODO: Implement user creation/update logic

	c.JSON(200, gin.H{"message": "OAuth successful"})
}

func refreshTokenHandler(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	ctx := context.Background()
	
	// Verify refresh token
	// TODO: Implement JWT verification for refresh token
	
	// Generate new access token
	// TODO: Implement new token generation

	c.JSON(200, gin.H{"message": "Token refreshed"})
}

func verifyTokenHandler(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if token == "" {
		c.JSON(401, gin.H{"error": "No token provided"})
		return
	}

	// Remove "Bearer " prefix
	token = token[7:]

	// Verify JWT
	claims, err := verifyJWT(token)
	if err != nil {
		c.JSON(401, gin.H{"error": "Invalid token"})
		return
	}

	c.JSON(200, gin.H{
		"valid": true,
		"user":  claims,
	})
}

func generateJWT(user User) (string, error) {
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(time.Hour).Unix(),
		"iat":   time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func generateRefreshToken(userID string) string {
	return fmt.Sprintf("%s-%d", userID, time.Now().Unix())
}

func verifyJWT(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

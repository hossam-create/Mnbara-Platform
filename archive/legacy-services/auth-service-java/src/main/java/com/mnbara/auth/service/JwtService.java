package com.mnbara.auth.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.mnbara.auth.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * JWT Service - eBay-Level Token Management
 * 
 * Features:
 * - Secure JWT token generation and validation
 * - Refresh token mechanism
 * - Token blacklisting with Redis
 * - Role and permission embedding
 * - Device fingerprinting
 * - Token rotation for security
 */
@Service
@Slf4j
public class JwtService {

    private final Algorithm jwtAlgorithm;
    private final Algorithm refreshAlgorithm;
    private final JWTVerifier jwtVerifier;
    private final JWTVerifier refreshVerifier;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    @Value("${jwt.issuer}")
    private String issuer;

    public JwtService(@Value("${jwt.secret}") String jwtSecret,
                     @Value("${jwt.refresh-secret}") String refreshSecret,
                     RedisTemplate<String, String> redisTemplate) {
        this.jwtAlgorithm = Algorithm.HMAC256(jwtSecret);
        this.refreshAlgorithm = Algorithm.HMAC256(refreshSecret);
        this.jwtVerifier = JWT.require(jwtAlgorithm).withIssuer(issuer).build();
        this.refreshVerifier = JWT.require(refreshAlgorithm).withIssuer(issuer).build();
        this.redisTemplate = redisTemplate;
    }

    /**
     * Generate access token with user information and permissions
     */
    public String generateAccessToken(User user, String deviceId, String ipAddress) {
        try {
            Instant now = Instant.now();
            Instant expiry = now.plusMillis(jwtExpiration);

            // Extract roles and permissions
            Set<String> roles = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toSet());

            Set<String> permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(permission -> permission.getName())
                .collect(Collectors.toSet());

            String token = JWT.create()
                .withIssuer(issuer)
                .withSubject(user.getId().toString())
                .withClaim("username", user.getUsername())
                .withClaim("email", user.getEmail())
                .withClaim("roles", roles.stream().collect(Collectors.toList()))
                .withClaim("permissions", permissions.stream().collect(Collectors.toList()))
                .withClaim("deviceId", deviceId)
                .withClaim("ipAddress", ipAddress)
                .withClaim("mfaEnabled", user.getMfaEnabled())
                .withClaim("emailVerified", user.getEmailVerified())
                .withClaim("kycVerified", user.getKycVerified())
                .withClaim("tokenType", "access")
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiry))
                .withJWTId(generateTokenId(user.getId(), deviceId, "access"))
                .sign(jwtAlgorithm);

            // Store token metadata in Redis for tracking
            storeTokenMetadata(token, user.getId(), deviceId, expiry);

            log.info("Generated access token for user: {} from device: {}", user.getUsername(), deviceId);
            return token;

        } catch (JWTCreationException e) {
            log.error("Error creating access token for user: {}", user.getUsername(), e);
            throw new RuntimeException("Failed to generate access token", e);
        }
    }

    /**
     * Generate refresh token
     */
    public String generateRefreshToken(User user, String deviceId, String ipAddress) {
        try {
            Instant now = Instant.now();
            Instant expiry = now.plusMillis(refreshExpiration);

            String token = JWT.create()
                .withIssuer(issuer)
                .withSubject(user.getId().toString())
                .withClaim("username", user.getUsername())
                .withClaim("deviceId", deviceId)
                .withClaim("ipAddress", ipAddress)
                .withClaim("tokenType", "refresh")
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiry))
                .withJWTId(generateTokenId(user.getId(), deviceId, "refresh"))
                .sign(refreshAlgorithm);

            // Store refresh token in Redis
            String redisKey = "refresh_token:" + user.getId() + ":" + deviceId;
            redisTemplate.opsForValue().set(redisKey, token, refreshExpiration, TimeUnit.MILLISECONDS);

            log.info("Generated refresh token for user: {} from device: {}", user.getUsername(), deviceId);
            return token;

        } catch (JWTCreationException e) {
            log.error("Error creating refresh token for user: {}", user.getUsername(), e);
            throw new RuntimeException("Failed to generate refresh token", e);
        }
    }

    /**
     * Validate access token
     */
    public DecodedJWT validateAccessToken(String token) {
        try {
            DecodedJWT decodedJWT = jwtVerifier.verify(token);
            
            // Check if token is blacklisted
            if (isTokenBlacklisted(token)) {
                throw new JWTVerificationException("Token is blacklisted");
            }

            return decodedJWT;

        } catch (JWTVerificationException e) {
            log.warn("Invalid access token: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Validate refresh token
     */
    public DecodedJWT validateRefreshToken(String token) {
        try {
            DecodedJWT decodedJWT = refreshVerifier.verify(token);
            
            // Check if refresh token exists in Redis
            String userId = decodedJWT.getSubject();
            String deviceId = decodedJWT.getClaim("deviceId").asString();
            String redisKey = "refresh_token:" + userId + ":" + deviceId;
            
            String storedToken = redisTemplate.opsForValue().get(redisKey);
            if (storedToken == null || !storedToken.equals(token)) {
                throw new JWTVerificationException("Refresh token not found or invalid");
            }

            return decodedJWT;

        } catch (JWTVerificationException e) {
            log.warn("Invalid refresh token: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Extract user ID from token
     */
    public Long extractUserId(String token) {
        try {
            DecodedJWT decodedJWT = validateAccessToken(token);
            return Long.parseLong(decodedJWT.getSubject());
        } catch (Exception e) {
            log.error("Error extracting user ID from token", e);
            return null;
        }
    }

    /**
     * Extract username from token
     */
    public String extractUsername(String token) {
        try {
            DecodedJWT decodedJWT = validateAccessToken(token);
            return decodedJWT.getClaim("username").asString();
        } catch (Exception e) {
            log.error("Error extracting username from token", e);
            return null;
        }
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        try {
            DecodedJWT decodedJWT = JWT.decode(token);
            return decodedJWT.getExpiresAt().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Blacklist token (logout)
     */
    public void blacklistToken(String token) {
        try {
            DecodedJWT decodedJWT = JWT.decode(token);
            String tokenId = decodedJWT.getId();
            Date expiry = decodedJWT.getExpiresAt();
            
            long ttl = expiry.getTime() - System.currentTimeMillis();
            if (ttl > 0) {
                redisTemplate.opsForValue().set("blacklist:" + tokenId, "true", ttl, TimeUnit.MILLISECONDS);
                log.info("Token blacklisted: {}", tokenId);
            }
        } catch (Exception e) {
            log.error("Error blacklisting token", e);
        }
    }

    /**
     * Revoke all tokens for user
     */
    public void revokeAllUserTokens(Long userId) {
        try {
            // Blacklist all active tokens for user
            String pattern = "token_metadata:" + userId + ":*";
            Set<String> keys = redisTemplate.keys(pattern);
            
            if (keys != null && !keys.isEmpty()) {
                for (String key : keys) {
                    String tokenId = key.substring(key.lastIndexOf(":") + 1);
                    redisTemplate.opsForValue().set("blacklist:" + tokenId, "true", jwtExpiration, TimeUnit.MILLISECONDS);
                }
                redisTemplate.delete(keys);
            }

            // Remove all refresh tokens for user
            String refreshPattern = "refresh_token:" + userId + ":*";
            Set<String> refreshKeys = redisTemplate.keys(refreshPattern);
            if (refreshKeys != null && !refreshKeys.isEmpty()) {
                redisTemplate.delete(refreshKeys);
            }

            log.info("Revoked all tokens for user: {}", userId);

        } catch (Exception e) {
            log.error("Error revoking tokens for user: {}", userId, e);
        }
    }

    /**
     * Revoke refresh token
     */
    public void revokeRefreshToken(Long userId, String deviceId) {
        String redisKey = "refresh_token:" + userId + ":" + deviceId;
        redisTemplate.delete(redisKey);
        log.info("Revoked refresh token for user: {} device: {}", userId, deviceId);
    }

    // Private helper methods

    private String generateTokenId(Long userId, String deviceId, String tokenType) {
        return userId + "_" + deviceId + "_" + tokenType + "_" + System.currentTimeMillis();
    }

    private void storeTokenMetadata(String token, Long userId, String deviceId, Instant expiry) {
        try {
            DecodedJWT decodedJWT = JWT.decode(token);
            String tokenId = decodedJWT.getId();
            String redisKey = "token_metadata:" + userId + ":" + deviceId + ":" + tokenId;
            
            long ttl = expiry.toEpochMilli() - System.currentTimeMillis();
            redisTemplate.opsForValue().set(redisKey, "active", ttl, TimeUnit.MILLISECONDS);
            
        } catch (Exception e) {
            log.error("Error storing token metadata", e);
        }
    }

    private boolean isTokenBlacklisted(String token) {
        try {
            DecodedJWT decodedJWT = JWT.decode(token);
            String tokenId = decodedJWT.getId();
            return redisTemplate.hasKey("blacklist:" + tokenId);
        } catch (Exception e) {
            return true;
        }
    }
}
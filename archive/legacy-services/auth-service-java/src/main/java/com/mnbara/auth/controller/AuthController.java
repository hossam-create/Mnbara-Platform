package com.mnbara.auth.controller;

import com.mnbara.auth.dto.*;
import com.mnbara.auth.service.AuthService;
import com.mnbara.auth.service.MfaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Auth Controller - eBay-Level Authentication APIs
 * 
 * Features:
 * - User registration and login
 * - Multi-factor authentication
 * - Social login (OAuth 2.0)
 * - Token refresh and logout
 * - Password management
 * - Account verification
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"${app.cors.allowed-origins}"})
public class AuthController {

    private final AuthService authService;
    private final MfaService mfaService;

    /**
     * User Registration - eBay-style signup
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        
        log.info("Registration attempt for email: {}", request.getEmail());
        
        try {
            String ipAddress = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            
            AuthResponse response = authService.register(request, ipAddress, userAgent);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
                
        } catch (Exception e) {
            log.error("Registration failed for email: {}", request.getEmail(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Registration failed: " + e.getMessage()));
        }
    }

    /**
     * User Login - eBay-style authentication
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        
        log.info("Login attempt for: {}", request.getUsername());
        
        try {
            String ipAddress = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            String deviceId = request.getDeviceId();
            
            AuthResponse response = authService.login(request, ipAddress, userAgent, deviceId);
            
            return ResponseEntity.ok(ApiResponse.success("Login successful", response));
            
        } catch (Exception e) {
            log.error("Login failed for: {}", request.getUsername(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Login failed: " + e.getMessage()));
        }
    }

    /**
     * MFA Verification - Second step authentication
     */
    @PostMapping("/verify-mfa")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyMfa(
            @Valid @RequestBody MfaVerificationRequest request,
            HttpServletRequest httpRequest) {
        
        log.info("MFA verification attempt for user: {}", request.getUserId());
        
        try {
            String ipAddress = getClientIpAddress(httpRequest);
            AuthResponse response = authService.verifyMfa(request, ipAddress);
            
            return ResponseEntity.ok(ApiResponse.success("MFA verification successful", response));
            
        } catch (Exception e) {
            log.error("MFA verification failed for user: {}", request.getUserId(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("MFA verification failed: " + e.getMessage()));
        }
    }

    /**
     * Token Refresh - Get new access token
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            String ipAddress = getClientIpAddress(httpRequest);
            TokenResponse response = authService.refreshToken(request.getRefreshToken(), ipAddress);
            
            return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
            
        } catch (Exception e) {
            log.error("Token refresh failed", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Token refresh failed: " + e.getMessage()));
        }
    }

    /**
     * Logout - Invalidate tokens
     */
    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody LogoutRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            String authHeader = httpRequest.getHeader("Authorization");
            String token = authHeader != null && authHeader.startsWith("Bearer ") 
                ? authHeader.substring(7) : null;
                
            authService.logout(token, request.getRefreshToken(), request.isLogoutAllDevices());
            
            return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
            
        } catch (Exception e) {
            log.error("Logout failed", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Logout failed: " + e.getMessage()));
        }
    }

    /**
     * Forgot Password - Send reset email
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        
        log.info("Password reset requested for: {}", request.getEmail());
        
        try {
            String ipAddress = getClientIpAddress(httpRequest);
            authService.forgotPassword(request.getEmail(), ipAddress);
            
            return ResponseEntity.ok(ApiResponse.success("Password reset email sent", null));
            
        } catch (Exception e) {
            log.error("Password reset failed for: {}", request.getEmail(), e);
            // Don't reveal if email exists or not
            return ResponseEntity.ok(ApiResponse.success("Password reset email sent", null));
        }
    }

    /**
     * Reset Password - Set new password with token
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            String ipAddress = getClientIpAddress(httpRequest);
            authService.resetPassword(request.getToken(), request.getNewPassword(), ipAddress);
            
            return ResponseEntity.ok(ApiResponse.success("Password reset successful", null));
            
        } catch (Exception e) {
            log.error("Password reset failed", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Password reset failed: " + e.getMessage()));
        }
    }

    /**
     * Change Password - For authenticated users
     */
    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            String authHeader = httpRequest.getHeader("Authorization");
            String token = authHeader.substring(7);
            String ipAddress = getClientIpAddress(httpRequest);
            
            authService.changePassword(token, request.getCurrentPassword(), 
                request.getNewPassword(), ipAddress);
            
            return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
            
        } catch (Exception e) {
            log.error("Password change failed", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Password change failed: " + e.getMessage()));
        }
    }

    /**
     * Verify Email - Email verification
     */
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(
            @Valid @RequestBody EmailVerificationRequest request) {
        
        try {
            authService.verifyEmail(request.getToken());
            
            return ResponseEntity.ok(ApiResponse.success("Email verified successfully", null));
            
        } catch (Exception e) {
            log.error("Email verification failed", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Email verification failed: " + e.getMessage()));
        }
    }

    /**
     * Resend Verification Email
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerificationEmail(
            @Valid @RequestBody ResendVerificationRequest request) {
        
        try {
            authService.resendVerificationEmail(request.getEmail());
            
            return ResponseEntity.ok(ApiResponse.success("Verification email sent", null));
            
        } catch (Exception e) {
            log.error("Resend verification failed for: {}", request.getEmail(), e);
            // Don't reveal if email exists or not
            return ResponseEntity.ok(ApiResponse.success("Verification email sent", null));
        }
    }

    /**
     * Enable MFA - Setup multi-factor authentication
     */
    @PostMapping("/enable-mfa")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MfaSetupResponse>> enableMfa(
            HttpServletRequest httpRequest) {
        
        try {
            String authHeader = httpRequest.getHeader("Authorization");
            String token = authHeader.substring(7);
            
            MfaSetupResponse response = mfaService.setupMfa(token);
            
            return ResponseEntity.ok(ApiResponse.success("MFA setup initiated", response));
            
        } catch (Exception e) {
            log.error("MFA setup failed", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("MFA setup failed: " + e.getMessage()));
        }
    }

    /**
     * Confirm MFA Setup - Verify TOTP code
     */
    @PostMapping("/confirm-mfa")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MfaConfirmResponse>> confirmMfa(
            @Valid @RequestBody MfaConfirmRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            String authHeader = httpRequest.getHeader("Authorization");
            String token = authHeader.substring(7);
            
            MfaConfirmResponse response = mfaService.confirmMfa(token, request.getTotpCode());
            
            return ResponseEntity.ok(ApiResponse.success("MFA enabled successfully", response));
            
        } catch (Exception e) {
            log.error("MFA confirmation failed", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("MFA confirmation failed: " + e.getMessage()));
        }
    }

    /**
     * Disable MFA - Turn off multi-factor authentication
     */
    @PostMapping("/disable-mfa")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> disableMfa(
            @Valid @RequestBody DisableMfaRequest request,
            HttpServletRequest httpRequest) {
        
        try {
            String authHeader = httpRequest.getHeader("Authorization");
            String token = authHeader.substring(7);
            
            mfaService.disableMfa(token, request.getTotpCode(), request.getPassword());
            
            return ResponseEntity.ok(ApiResponse.success("MFA disabled successfully", null));
            
        } catch (Exception e) {
            log.error("MFA disable failed", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("MFA disable failed: " + e.getMessage()));
        }
    }

    /**
     * Get User Profile - Current user information
     */
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            HttpServletRequest httpRequest) {
        
        try {
            String authHeader = httpRequest.getHeader("Authorization");
            String token = authHeader.substring(7);
            
            UserProfileResponse response = authService.getUserProfile(token);
            
            return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", response));
            
        } catch (Exception e) {
            log.error("Profile retrieval failed", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Profile retrieval failed: " + e.getMessage()));
        }
    }

    /**
     * Health Check - Service status
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<HealthResponse>> health() {
        HealthResponse response = HealthResponse.builder()
            .status("UP")
            .service("mnbara-auth-service")
            .version("1.0.0")
            .timestamp(System.currentTimeMillis())
            .build();
            
        return ResponseEntity.ok(ApiResponse.success("Service is healthy", response));
    }

    // Helper Methods
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}
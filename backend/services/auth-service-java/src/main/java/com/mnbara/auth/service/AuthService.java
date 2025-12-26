package com.mnbara.auth.service;

import com.mnbara.auth.dto.AuthRequest.*;
import com.mnbara.auth.dto.AuthResponse.*;
import com.mnbara.auth.model.User;
import com.mnbara.auth.model.Role;
import com.mnbara.auth.repository.UserRepository;
import com.mnbara.auth.repository.RoleRepository;
import com.mnbara.auth.exception.AuthenticationException;
import com.mnbara.auth.exception.UserAlreadyExistsException;
import com.mnbara.auth.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Auth Service - eBay-Level Authentication Business Logic
 * 
 * Features:
 * - User registration and login
 * - Password management
 * - Email verification
 * - Account security
 * - Session management
 * - Multi-factor authentication integration
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final RedisService redisService;

    /**
     * Register new user - eBay-style registration
     */
    public AuthResponse register(RegisterRequest request, String ipAddress, String userAgent) {
        log.info("Processing registration for email: {}", request.getEmail());

        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("User with email already exists");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already taken");
        }

        // Validate password strength
        validatePasswordStrength(request.getPassword());

        // Create new user
        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .displayName(request.getFirstName() + " " + request.getLastName())
            .phoneNumber(request.getPhoneNumber())
            .language(request.getLanguage() != null ? request.getLanguage() : "en")
            .timezone(request.getTimezone() != null ? request.getTimezone() : "UTC")
            .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
            .marketingEmailsEnabled(request.getMarketingEmailsEnabled() != null ? 
                request.getMarketingEmailsEnabled() : true)
            .accountStatus(User.AccountStatus.PENDING_VERIFICATION)
            .emailVerified(false)
            .phoneVerified(false)
            .kycVerified(false)
            .mfaEnabled(false)
            .failedLoginAttempts(0)
            .passwordChangedAt(LocalDateTime.now())
            .build();

        // Assign default role
        Role userRole = roleRepository.findByName(Role.USER)
            .orElseThrow(() -> new RuntimeException("Default user role not found"));
        user.setRoles(Set.of(userRole));

        // Save user
        user = userRepository.save(user);

        // Send verification email
        sendVerificationEmail(user);

        // Generate tokens
        String deviceId = generateDeviceId(userAgent);
        String accessToken = jwtService.generateAccessToken(user, deviceId, ipAddress);
        String refreshToken = jwtService.generateRefreshToken(user, deviceId, ipAddress);

        // Update last login
        user.updateLastLogin(ipAddress);
        userRepository.save(user);

        log.info("User registered successfully: {}", user.getUsername());

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(3600) // 1 hour
            .user(mapToUserInfo(user))
            .mfaRequired(false)
            .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
            .permissions(user.getAuthorities().stream()
                .map(auth -> auth.getAuthority()).collect(Collectors.toList()))
            .build();
    }

    /**
     * User login - eBay-style authentication
     */
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent, String deviceId) {
        log.info("Processing login for: {}", request.getUsername());

        // Find user by username or email
        User user = userRepository.findByUsernameOrEmail(request.getUsername(), request.getUsername())
            .orElseThrow(() -> new AuthenticationException("Invalid credentials"));

        // Check account status
        if (user.getAccountStatus() == User.AccountStatus.BANNED) {
            throw new AuthenticationException("Account is banned");
        }

        if (user.getAccountStatus() == User.AccountStatus.SUSPENDED) {
            throw new AuthenticationException("Account is suspended");
        }

        // Check if account is locked
        if (!user.isAccountNonLocked()) {
            throw new AuthenticationException("Account is temporarily locked due to failed login attempts");
        }

        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            // Reset failed login attempts on successful authentication
            user.resetFailedLoginAttempts();

            // Check if MFA is enabled
            if (user.getMfaEnabled()) {
                // Generate temporary MFA token
                String mfaToken = generateMfaToken(user.getId(), deviceId);
                
                return AuthResponse.builder()
                    .mfaRequired(true)
                    .mfaToken(mfaToken)
                    .user(mapToUserInfo(user))
                    .build();
            }

            // Generate tokens
            if (deviceId == null) {
                deviceId = generateDeviceId(userAgent);
            }
            
            String accessToken = jwtService.generateAccessToken(user, deviceId, ipAddress);
            String refreshToken = jwtService.generateRefreshToken(user, deviceId, ipAddress);

            // Update last login
            user.updateLastLogin(ipAddress);
            userRepository.save(user);

            log.info("User logged in successfully: {}", user.getUsername());

            return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(3600) // 1 hour
                .user(mapToUserInfo(user))
                .mfaRequired(false)
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                .permissions(user.getAuthorities().stream()
                    .map(auth -> auth.getAuthority()).collect(Collectors.toList()))
                .build();

        } catch (Exception e) {
            // Increment failed login attempts
            user.incrementFailedLoginAttempts();
            userRepository.save(user);
            
            log.warn("Login failed for user: {} from IP: {}", request.getUsername(), ipAddress);
            throw new AuthenticationException("Invalid credentials");
        }
    }

    /**
     * Verify MFA and complete login
     */
    public AuthResponse verifyMfa(MfaVerificationRequest request, String ipAddress) {
        log.info("Processing MFA verification for user: {}", request.getUserId());

        // Validate MFA token
        if (!validateMfaToken(request.getUserId(), request.getDeviceId())) {
            throw new AuthenticationException("Invalid or expired MFA token");
        }

        // Find user
        User user = userRepository.findById(Long.parseLong(request.getUserId()))
            .orElseThrow(() -> new UserNotFoundException("User not found"));

        // Verify TOTP code
        if (!verifyTotpCode(user, request.getTotpCode())) {
            throw new AuthenticationException("Invalid TOTP code");
        }

        // Generate tokens
        String deviceId = request.getDeviceId();
        String accessToken = jwtService.generateAccessToken(user, deviceId, ipAddress);
        String refreshToken = jwtService.generateRefreshToken(user, deviceId, ipAddress);

        // Update last login
        user.updateLastLogin(ipAddress);
        userRepository.save(user);

        // Clear MFA token
        clearMfaToken(request.getUserId(), deviceId);

        log.info("MFA verification successful for user: {}", user.getUsername());

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(3600) // 1 hour
            .user(mapToUserInfo(user))
            .mfaRequired(false)
            .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
            .permissions(user.getAuthorities().stream()
                .map(auth -> auth.getAuthority()).collect(Collectors.toList()))
            .build();
    }

    /**
     * Refresh access token
     */
    public TokenResponse refreshToken(String refreshToken, String ipAddress) {
        log.info("Processing token refresh");

        try {
            // Validate refresh token
            var decodedJWT = jwtService.validateRefreshToken(refreshToken);
            Long userId = Long.parseLong(decodedJWT.getSubject());
            String deviceId = decodedJWT.getClaim("deviceId").asString();

            // Find user
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

            // Check account status
            if (!user.isEnabled()) {
                throw new AuthenticationException("Account is disabled");
            }

            // Generate new access token
            String newAccessToken = jwtService.generateAccessToken(user, deviceId, ipAddress);

            log.info("Token refreshed successfully for user: {}", user.getUsername());

            return TokenResponse.builder()
                .accessToken(newAccessToken)
                .tokenType("Bearer")
                .expiresIn(3600) // 1 hour
                .refreshToken(refreshToken) // Keep same refresh token
                .build();

        } catch (Exception e) {
            log.error("Token refresh failed", e);
            throw new AuthenticationException("Invalid refresh token");
        }
    }

    /**
     * Logout user
     */
    public void logout(String accessToken, String refreshToken, boolean logoutAllDevices) {
        log.info("Processing logout");

        try {
            if (accessToken != null) {
                Long userId = jwtService.extractUserId(accessToken);
                
                if (logoutAllDevices && userId != null) {
                    // Revoke all tokens for user
                    jwtService.revokeAllUserTokens(userId);
                    log.info("Logged out all devices for user: {}", userId);
                } else {
                    // Blacklist current access token
                    jwtService.blacklistToken(accessToken);
                    
                    // Revoke refresh token if provided
                    if (refreshToken != null && userId != null) {
                        var decodedJWT = jwtService.validateRefreshToken(refreshToken);
                        String deviceId = decodedJWT.getClaim("deviceId").asString();
                        jwtService.revokeRefreshToken(userId, deviceId);
                    }
                    
                    log.info("Logged out current device for user: {}", userId);
                }
            }
        } catch (Exception e) {
            log.error("Logout failed", e);
            // Don't throw exception for logout failures
        }
    }

    // Helper methods
    private void validatePasswordStrength(String password) {
        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }
        
        if (!password.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("Password must contain at least one uppercase letter");
        }
        
        if (!password.matches(".*[a-z].*")) {
            throw new IllegalArgumentException("Password must contain at least one lowercase letter");
        }
        
        if (!password.matches(".*[0-9].*")) {
            throw new IllegalArgumentException("Password must contain at least one number");
        }
        
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            throw new IllegalArgumentException("Password must contain at least one special character");
        }
    }

    private UserInfo mapToUserInfo(User user) {
        return UserInfo.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .displayName(user.getDisplayName())
            .profileImageUrl(user.getProfileImageUrl())
            .emailVerified(user.getEmailVerified())
            .phoneVerified(user.getPhoneVerified())
            .kycVerified(user.getKycVerified())
            .mfaEnabled(user.getMfaEnabled())
            .accountStatus(user.getAccountStatus().name())
            .lastLoginAt(user.getLastLoginAt())
            .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
            .build();
    }

    private String generateDeviceId(String userAgent) {
        return UUID.randomUUID().toString();
    }

    private void sendVerificationEmail(User user) {
        // Implementation for sending verification email
        // This would integrate with your email service
        log.info("Sending verification email to: {}", user.getEmail());
    }

    private String generateMfaToken(Long userId, String deviceId) {
        String mfaToken = UUID.randomUUID().toString();
        redisService.setWithExpiration("mfa_token:" + userId + ":" + deviceId, mfaToken, 300); // 5 minutes
        return mfaToken;
    }

    private boolean validateMfaToken(String userId, String deviceId) {
        String storedToken = redisService.get("mfa_token:" + userId + ":" + deviceId);
        return storedToken != null;
    }

    private void clearMfaToken(String userId, String deviceId) {
        redisService.delete("mfa_token:" + userId + ":" + deviceId);
    }

    private boolean verifyTotpCode(User user, String totpCode) {
        // Implementation for TOTP verification
        // This would integrate with your MFA service
        return true; // Placeholder
    }
}
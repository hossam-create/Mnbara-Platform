package com.mnbara.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Authentication Response DTOs - eBay-Level responses
 */
public class AuthResponse {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        
        private String accessToken;
        private String refreshToken;
        private String tokenType;
        private long expiresIn;
        private UserInfo user;
        private boolean mfaRequired;
        private String mfaToken;
        private List<String> roles;
        private List<String> permissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TokenResponse {
        
        private String accessToken;
        private String tokenType;
        private long expiresIn;
        private String refreshToken;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        
        private Long id;
        private String username;
        private String email;
        private String firstName;
        private String lastName;
        private String displayName;
        private String profileImageUrl;
        private boolean emailVerified;
        private boolean phoneVerified;
        private boolean kycVerified;
        private boolean mfaEnabled;
        private String accountStatus;
        private LocalDateTime lastLoginAt;
        private List<String> roles;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserProfileResponse {
        
        private Long id;
        private String username;
        private String email;
        private String phoneNumber;
        private String firstName;
        private String lastName;
        private String displayName;
        private String profileImageUrl;
        private String dateOfBirth;
        private String gender;
        private String language;
        private String timezone;
        private String currency;
        private boolean emailVerified;
        private boolean phoneVerified;
        private boolean kycVerified;
        private boolean mfaEnabled;
        private boolean marketingEmailsEnabled;
        private boolean pushNotificationsEnabled;
        private String accountStatus;
        private LocalDateTime createdAt;
        private LocalDateTime lastLoginAt;
        private String lastLoginIp;
        private List<String> roles;
        private List<String> permissions;
        private List<AddressInfo> addresses;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressInfo {
        
        private Long id;
        private String type;
        private String street;
        private String city;
        private String state;
        private String country;
        private String postalCode;
        private boolean isDefault;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MfaSetupResponse {
        
        private String secret;
        private String qrCodeUrl;
        private List<String> backupCodes;
        private String issuer;
        private String accountName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MfaConfirmResponse {
        
        private boolean success;
        private List<String> backupCodes;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthResponse {
        
        private String status;
        private String service;
        private String version;
        private long timestamp;
        private long uptime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionInfo {
        
        private String deviceId;
        private String deviceName;
        private String ipAddress;
        private String location;
        private String userAgent;
        private LocalDateTime createdAt;
        private LocalDateTime lastAccessedAt;
        private boolean current;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SecurityEventResponse {
        
        private String eventType;
        private String description;
        private String ipAddress;
        private String location;
        private LocalDateTime timestamp;
        private String severity;
    }
}

// Individual response classes for easier imports
class AuthResponse extends AuthResponse.AuthResponse {}
class TokenResponse extends AuthResponse.TokenResponse {}
class UserInfo extends AuthResponse.UserInfo {}
class UserProfileResponse extends AuthResponse.UserProfileResponse {}
class AddressInfo extends AuthResponse.AddressInfo {}
class MfaSetupResponse extends AuthResponse.MfaSetupResponse {}
class MfaConfirmResponse extends AuthResponse.MfaConfirmResponse {}
class HealthResponse extends AuthResponse.HealthResponse {}
class SessionInfo extends AuthResponse.SessionInfo {}
class SecurityEventResponse extends AuthResponse.SecurityEventResponse {}
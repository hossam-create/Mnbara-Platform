package com.mnbara.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Authentication Request DTOs - eBay-Level validation
 */
public class AuthRequest {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
        private String username;
        
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
        
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
        private String password;
        
        @NotBlank(message = "First name is required")
        @Size(max = 50, message = "First name must not exceed 50 characters")
        private String firstName;
        
        @NotBlank(message = "Last name is required")
        @Size(max = 50, message = "Last name must not exceed 50 characters")
        private String lastName;
        
        private String phoneNumber;
        private String dateOfBirth;
        private String gender;
        private String language;
        private String timezone;
        private String currency;
        private Boolean marketingEmailsEnabled;
        private Boolean termsAccepted;
        private Boolean privacyPolicyAccepted;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        
        @NotBlank(message = "Username or email is required")
        private String username; // Can be username or email
        
        @NotBlank(message = "Password is required")
        private String password;
        
        private String deviceId;
        private String deviceName;
        private Boolean rememberMe;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MfaVerificationRequest {
        
        @NotBlank(message = "User ID is required")
        private String userId;
        
        @NotBlank(message = "TOTP code is required")
        @Size(min = 6, max = 6, message = "TOTP code must be 6 digits")
        private String totpCode;
        
        private String deviceId;
        private Boolean trustDevice;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefreshTokenRequest {
        
        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LogoutRequest {
        
        private String refreshToken;
        private boolean logoutAllDevices;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForgotPasswordRequest {
        
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResetPasswordRequest {
        
        @NotBlank(message = "Reset token is required")
        private String token;
        
        @NotBlank(message = "New password is required")
        @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
        private String newPassword;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordRequest {
        
        @NotBlank(message = "Current password is required")
        private String currentPassword;
        
        @NotBlank(message = "New password is required")
        @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
        private String newPassword;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailVerificationRequest {
        
        @NotBlank(message = "Verification token is required")
        private String token;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResendVerificationRequest {
        
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MfaConfirmRequest {
        
        @NotBlank(message = "TOTP code is required")
        @Size(min = 6, max = 6, message = "TOTP code must be 6 digits")
        private String totpCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DisableMfaRequest {
        
        @NotBlank(message = "TOTP code is required")
        @Size(min = 6, max = 6, message = "TOTP code must be 6 digits")
        private String totpCode;
        
        @NotBlank(message = "Password is required")
        private String password;
    }
}

// Individual request classes for easier imports
class RegisterRequest extends AuthRequest.RegisterRequest {}
class LoginRequest extends AuthRequest.LoginRequest {}
class MfaVerificationRequest extends AuthRequest.MfaVerificationRequest {}
class RefreshTokenRequest extends AuthRequest.RefreshTokenRequest {}
class LogoutRequest extends AuthRequest.LogoutRequest {}
class ForgotPasswordRequest extends AuthRequest.ForgotPasswordRequest {}
class ResetPasswordRequest extends AuthRequest.ResetPasswordRequest {}
class ChangePasswordRequest extends AuthRequest.ChangePasswordRequest {}
class EmailVerificationRequest extends AuthRequest.EmailVerificationRequest {}
class ResendVerificationRequest extends AuthRequest.ResendVerificationRequest {}
class MfaConfirmRequest extends AuthRequest.MfaConfirmRequest {}
class DisableMfaRequest extends AuthRequest.DisableMfaRequest {}
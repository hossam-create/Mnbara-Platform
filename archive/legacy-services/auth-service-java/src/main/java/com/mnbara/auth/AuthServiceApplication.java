package com.mnbara.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Mnbara Auth Service - eBay-Level Authentication
 * 
 * Enterprise-grade authentication service with:
 * - JWT token management
 * - OAuth 2.0 social login
 * - Multi-factor authentication
 * - Session management with Redis
 * - Role-based access control (RBAC)
 * - Attribute-based access control (ABAC)
 */
@SpringBootApplication
@EnableCaching
@EnableAsync
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
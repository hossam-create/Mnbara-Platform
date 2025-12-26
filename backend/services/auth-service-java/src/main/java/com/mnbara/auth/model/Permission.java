package com.mnbara.auth.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Set;

/**
 * Permission Entity - eBay-Level Permission Management
 * 
 * Fine-grained permissions for enterprise-level access control
 */
@Entity
@Table(name = "permissions", indexes = {
    @Index(name = "idx_permission_name", columnList = "name"),
    @Index(name = "idx_permission_resource", columnList = "resource"),
    @Index(name = "idx_permission_action", columnList = "action")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class Permission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    @NotBlank(message = "Permission name is required")
    @Size(min = 2, max = 100, message = "Permission name must be between 2 and 100 characters")
    private String name;

    @Column(length = 100)
    private String displayName;

    @Column(length = 255)
    private String description;

    @Column(nullable = false, length = 50)
    private String resource; // e.g., "user", "product", "order", "auction"

    @Column(nullable = false, length = 50)
    private String action; // e.g., "create", "read", "update", "delete", "manage"

    @Enumerated(EnumType.STRING)
    @Column(name = "permission_type", nullable = false)
    private PermissionType permissionType = PermissionType.FUNCTIONAL;

    @Column(nullable = false)
    private Boolean active = true;

    // Relationships
    @ManyToMany(mappedBy = "permissions")
    private Set<Role> roles;

    // Enums
    public enum PermissionType {
        SYSTEM,      // System-level permissions
        FUNCTIONAL,  // Feature-based permissions
        DATA,        // Data access permissions
        API          // API access permissions
    }

    // Predefined Permissions - User Management
    public static final String USER_CREATE = "user:create";
    public static final String USER_READ = "user:read";
    public static final String USER_UPDATE = "user:update";
    public static final String USER_DELETE = "user:delete";
    public static final String USER_MANAGE = "user:manage";

    // Product Management
    public static final String PRODUCT_CREATE = "product:create";
    public static final String PRODUCT_READ = "product:read";
    public static final String PRODUCT_UPDATE = "product:update";
    public static final String PRODUCT_DELETE = "product:delete";
    public static final String PRODUCT_MANAGE = "product:manage";

    // Order Management
    public static final String ORDER_CREATE = "order:create";
    public static final String ORDER_READ = "order:read";
    public static final String ORDER_UPDATE = "order:update";
    public static final String ORDER_DELETE = "order:delete";
    public static final String ORDER_MANAGE = "order:manage";

    // Auction Management
    public static final String AUCTION_CREATE = "auction:create";
    public static final String AUCTION_READ = "auction:read";
    public static final String AUCTION_UPDATE = "auction:update";
    public static final String AUCTION_DELETE = "auction:delete";
    public static final String AUCTION_MANAGE = "auction:manage";
    public static final String AUCTION_BID = "auction:bid";

    // Payment Management
    public static final String PAYMENT_CREATE = "payment:create";
    public static final String PAYMENT_READ = "payment:read";
    public static final String PAYMENT_UPDATE = "payment:update";
    public static final String PAYMENT_REFUND = "payment:refund";
    public static final String PAYMENT_MANAGE = "payment:manage";

    // Admin Permissions
    public static final String ADMIN_DASHBOARD = "admin:dashboard";
    public static final String ADMIN_USERS = "admin:users";
    public static final String ADMIN_PRODUCTS = "admin:products";
    public static final String ADMIN_ORDERS = "admin:orders";
    public static final String ADMIN_ANALYTICS = "admin:analytics";
    public static final String ADMIN_SETTINGS = "admin:settings";

    // System Permissions
    public static final String SYSTEM_MANAGE = "system:manage";
    public static final String SYSTEM_MONITOR = "system:monitor";
    public static final String SYSTEM_BACKUP = "system:backup";
    public static final String SYSTEM_LOGS = "system:logs";

    // API Permissions
    public static final String API_READ = "api:read";
    public static final String API_WRITE = "api:write";
    public static final String API_ADMIN = "api:admin";
}
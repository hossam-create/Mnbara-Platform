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
 * Role Entity - eBay-Level Role Management
 * 
 * Supports both RBAC (Role-Based Access Control) and ABAC (Attribute-Based Access Control)
 */
@Entity
@Table(name = "roles", indexes = {
    @Index(name = "idx_role_name", columnList = "name"),
    @Index(name = "idx_role_status", columnList = "active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class Role extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    @NotBlank(message = "Role name is required")
    @Size(min = 2, max = 50, message = "Role name must be between 2 and 50 characters")
    private String name;

    @Column(length = 100)
    private String displayName;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    private Boolean active = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false)
    private RoleType roleType = RoleType.USER;

    @Column(name = "hierarchy_level", nullable = false)
    private Integer hierarchyLevel = 0;

    // Relationships
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions;

    @ManyToMany(mappedBy = "roles")
    private Set<User> users;

    // Helper Methods
    public boolean hasPermission(String permissionName) {
        return permissions.stream()
            .anyMatch(permission -> permission.getName().equals(permissionName));
    }

    public boolean canManageRole(Role targetRole) {
        return this.hierarchyLevel > targetRole.hierarchyLevel;
    }

    // Enums
    public enum RoleType {
        SYSTEM,     // System-level roles (SUPER_ADMIN)
        ADMIN,      // Administrative roles (ADMIN, MODERATOR)
        BUSINESS,   // Business roles (SELLER, PREMIUM_SELLER)
        USER,       // User roles (BUYER, TRAVELER)
        GUEST       // Guest roles (ANONYMOUS)
    }

    // Predefined Roles
    public static final String SUPER_ADMIN = "SUPER_ADMIN";
    public static final String ADMIN = "ADMIN";
    public static final String MODERATOR = "MODERATOR";
    public static final String SELLER = "SELLER";
    public static final String PREMIUM_SELLER = "PREMIUM_SELLER";
    public static final String BUYER = "BUYER";
    public static final String TRAVELER = "TRAVELER";
    public static final String USER = "USER";
    public static final String GUEST = "GUEST";
}
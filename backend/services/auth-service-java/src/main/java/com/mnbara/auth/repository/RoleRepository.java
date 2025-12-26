package com.mnbara.auth.repository;

import com.mnbara.auth.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Role Repository - eBay-Level Role Management
 * 
 * Features:
 * - Role hierarchy queries
 * - Permission-based lookups
 * - Performance optimized queries
 * - Role analytics
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    // Basic lookups
    Optional<Role> findByName(String name);
    
    List<Role> findByNameIn(Set<String> names);
    
    List<Role> findByActiveTrue();
    
    List<Role> findByActiveFalse();

    // Role type queries
    List<Role> findByRoleType(Role.RoleType roleType);
    
    List<Role> findByRoleTypeAndActiveTrue(Role.RoleType roleType);

    // Hierarchy queries
    List<Role> findByHierarchyLevelGreaterThan(Integer level);
    
    List<Role> findByHierarchyLevelLessThan(Integer level);
    
    @Query("SELECT r FROM Role r WHERE r.hierarchyLevel >= :minLevel AND r.hierarchyLevel <= :maxLevel")
    List<Role> findByHierarchyLevelBetween(@Param("minLevel") Integer minLevel, 
                                          @Param("maxLevel") Integer maxLevel);

    // Permission-based queries
    @Query("SELECT DISTINCT r FROM Role r JOIN r.permissions p WHERE p.name = :permissionName")
    List<Role> findByPermissionName(@Param("permissionName") String permissionName);
    
    @Query("SELECT DISTINCT r FROM Role r JOIN r.permissions p WHERE p.name IN :permissionNames")
    List<Role> findByPermissionNames(@Param("permissionNames") List<String> permissionNames);
    
    @Query("SELECT r FROM Role r WHERE SIZE(r.permissions) > :minPermissions")
    List<Role> findRolesWithMinimumPermissions(@Param("minPermissions") int minPermissions);

    // User assignment queries
    @Query("SELECT r FROM Role r WHERE SIZE(r.users) > 0")
    List<Role> findRolesWithUsers();
    
    @Query("SELECT r FROM Role r WHERE SIZE(r.users) = 0")
    List<Role> findRolesWithoutUsers();
    
    @Query("SELECT r FROM Role r WHERE SIZE(r.users) >= :minUsers")
    List<Role> findRolesWithMinimumUsers(@Param("minUsers") int minUsers);

    // Search queries
    @Query("SELECT r FROM Role r WHERE " +
           "LOWER(r.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(r.displayName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(r.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Role> searchRoles(@Param("searchTerm") String searchTerm);

    // Analytics queries
    @Query("SELECT r.roleType, COUNT(r) FROM Role r GROUP BY r.roleType")
    List<Object[]> getRoleTypeStatistics();
    
    @Query("SELECT r.name, SIZE(r.users) FROM Role r ORDER BY SIZE(r.users) DESC")
    List<Object[]> getRoleUserCounts();
    
    @Query("SELECT r.name, SIZE(r.permissions) FROM Role r ORDER BY SIZE(r.permissions) DESC")
    List<Object[]> getRolePermissionCounts();

    // Performance optimized queries with fetch joins
    @Query("SELECT r FROM Role r LEFT JOIN FETCH r.permissions WHERE r.id = :id")
    Optional<Role> findByIdWithPermissions(@Param("id") Long id);
    
    @Query("SELECT r FROM Role r LEFT JOIN FETCH r.permissions WHERE r.name = :name")
    Optional<Role> findByNameWithPermissions(@Param("name") String name);
    
    @Query("SELECT r FROM Role r LEFT JOIN FETCH r.users WHERE r.id = :id")
    Optional<Role> findByIdWithUsers(@Param("id") Long id);
    
    @Query("SELECT r FROM Role r LEFT JOIN FETCH r.permissions LEFT JOIN FETCH r.users WHERE r.id = :id")
    Optional<Role> findByIdWithPermissionsAndUsers(@Param("id") Long id);

    // Bulk operations
    @Query("UPDATE Role r SET r.active = :active WHERE r.roleType = :roleType")
    int bulkUpdateActiveStatusByRoleType(@Param("roleType") Role.RoleType roleType, 
                                        @Param("active") Boolean active);
    
    @Query("UPDATE Role r SET r.hierarchyLevel = :newLevel WHERE r.hierarchyLevel = :oldLevel")
    int bulkUpdateHierarchyLevel(@Param("oldLevel") Integer oldLevel, 
                                @Param("newLevel") Integer newLevel);

    // Validation queries
    boolean existsByName(String name);
    
    boolean existsByNameAndIdNot(String name, Long id);
    
    @Query("SELECT COUNT(r) > 0 FROM Role r WHERE r.name = :name AND r.active = true")
    boolean existsActiveRoleByName(@Param("name") String name);

    // Default role queries
    @Query("SELECT r FROM Role r WHERE r.name IN ('USER', 'BUYER', 'TRAVELER') AND r.active = true")
    List<Role> findDefaultUserRoles();
    
    @Query("SELECT r FROM Role r WHERE r.roleType = 'ADMIN' AND r.active = true ORDER BY r.hierarchyLevel DESC")
    List<Role> findAdminRolesByHierarchy();
    
    @Query("SELECT r FROM Role r WHERE r.roleType = 'BUSINESS' AND r.active = true")
    List<Role> findBusinessRoles();

    // Custom queries for role management
    @Query("SELECT r FROM Role r WHERE r.hierarchyLevel > " +
           "(SELECT ur.hierarchyLevel FROM Role ur WHERE ur.name = :userRoleName) " +
           "AND r.active = true")
    List<Role> findRolesUserCanManage(@Param("userRoleName") String userRoleName);
    
    @Query("SELECT DISTINCT r FROM Role r JOIN r.permissions p " +
           "WHERE p.resource = :resource AND p.action = :action")
    List<Role> findRolesByResourceAndAction(@Param("resource") String resource, 
                                           @Param("action") String action);
}
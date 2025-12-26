package com.mnbara.auth.repository;

import com.mnbara.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * User Repository - eBay-Level Data Access
 * 
 * Features:
 * - Advanced user queries
 * - Performance optimized queries
 * - Security-focused lookups
 * - Analytics support
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Basic lookups
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByUsernameOrEmail(String username, String email);
    
    // Existence checks
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    boolean existsByPhoneNumber(String phoneNumber);

    // Social login lookups
    Optional<User> findByGoogleId(String googleId);
    
    Optional<User> findByFacebookId(String facebookId);
    
    Optional<User> findByAppleId(String appleId);

    // Account status queries
    List<User> findByAccountStatus(User.AccountStatus accountStatus);
    
    @Query("SELECT u FROM User u WHERE u.accountStatus = :status AND u.createdAt >= :since")
    List<User> findByAccountStatusAndCreatedAtAfter(
        @Param("status") User.AccountStatus status, 
        @Param("since") LocalDateTime since
    );

    // Verification status queries
    List<User> findByEmailVerifiedFalse();
    
    List<User> findByPhoneVerifiedFalse();
    
    List<User> findByKycVerifiedFalse();

    // Security queries
    @Query("SELECT u FROM User u WHERE u.failedLoginAttempts >= :maxAttempts")
    List<User> findUsersWithFailedLoginAttempts(@Param("maxAttempts") Integer maxAttempts);
    
    @Query("SELECT u FROM User u WHERE u.accountLockedUntil IS NOT NULL AND u.accountLockedUntil > :now")
    List<User> findLockedUsers(@Param("now") LocalDateTime now);
    
    @Query("SELECT u FROM User u WHERE u.lastLoginAt < :cutoffDate")
    List<User> findInactiveUsers(@Param("cutoffDate") LocalDateTime cutoffDate);

    // MFA queries
    List<User> findByMfaEnabledTrue();
    
    List<User> findByMfaEnabledFalse();

    // Role-based queries
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    List<User> findByRoleName(@Param("roleName") String roleName);
    
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name IN :roleNames")
    List<User> findByRoleNames(@Param("roleNames") List<String> roleNames);

    // Permission-based queries
    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r JOIN r.permissions p WHERE p.name = :permissionName")
    List<User> findByPermissionName(@Param("permissionName") String permissionName);

    // Analytics queries
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :startDate AND u.createdAt <= :endDate")
    Long countUsersCreatedBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.lastLoginAt >= :startDate AND u.lastLoginAt <= :endDate")
    Long countActiveUsersBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT u.accountStatus, COUNT(u) FROM User u GROUP BY u.accountStatus")
    List<Object[]> getUserStatusStatistics();

    // Search queries
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<User> searchUsers(@Param("searchTerm") String searchTerm);

    // Bulk operations
    @Query("UPDATE User u SET u.accountStatus = :newStatus WHERE u.accountStatus = :oldStatus")
    int bulkUpdateAccountStatus(@Param("oldStatus") User.AccountStatus oldStatus, 
                               @Param("newStatus") User.AccountStatus newStatus);
    
    @Query("UPDATE User u SET u.emailVerified = true WHERE u.email = :email")
    int markEmailAsVerified(@Param("email") String email);
    
    @Query("UPDATE User u SET u.phoneVerified = true WHERE u.phoneNumber = :phoneNumber")
    int markPhoneAsVerified(@Param("phoneNumber") String phoneNumber);

    // Cleanup queries
    @Query("DELETE FROM User u WHERE u.accountStatus = :status AND u.createdAt < :cutoffDate")
    int deleteUnverifiedUsersOlderThan(@Param("status") User.AccountStatus status, 
                                      @Param("cutoffDate") LocalDateTime cutoffDate);

    // Performance optimized queries with fetch joins
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles r LEFT JOIN FETCH r.permissions WHERE u.id = :id")
    Optional<User> findByIdWithRolesAndPermissions(@Param("id") Long id);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.username = :username")
    Optional<User> findByUsernameWithRoles(@Param("username") String username);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.email = :email")
    Optional<User> findByEmailWithRoles(@Param("email") String email);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.addresses WHERE u.id = :id")
    Optional<User> findByIdWithAddresses(@Param("id") Long id);

    // Custom native queries for complex operations
    @Query(value = "SELECT * FROM users u WHERE " +
                   "u.created_at >= :startDate AND u.created_at <= :endDate AND " +
                   "u.account_status = :status " +
                   "ORDER BY u.created_at DESC " +
                   "LIMIT :limit", nativeQuery = true)
    List<User> findRecentUsersByStatus(@Param("startDate") LocalDateTime startDate,
                                      @Param("endDate") LocalDateTime endDate,
                                      @Param("status") String status,
                                      @Param("limit") int limit);
}
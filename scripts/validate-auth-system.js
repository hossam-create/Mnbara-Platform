#!/usr/bin/env node

/**
 * Authentication System Validation Script
 * Tests both Admin and System Control authentication
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 Validating Authentication System');
console.log('=====================================');

let errors = [];
let warnings = [];
let passed = 0;
let total = 0;

function test(name, condition, errorMsg, warningMsg = null) {
    total++;
    console.log(`Testing: ${name}`);
    
    if (condition) {
        console.log(`✅ PASS: ${name}`);
        passed++;
    } else {
        console.log(`❌ FAIL: ${name}`);
        if (errorMsg) errors.push(`${name}: ${errorMsg}`);
        if (warningMsg) warnings.push(`${name}: ${warningMsg}`);
    }
}

// Test 1: Check if AuthContext files exist
const adminAuthPath = 'frontend/admin-dashboard/src/contexts/AuthContext.tsx';
const systemAuthPath = 'frontend/system-control-dashboard/src/contexts/AuthContext.tsx';

test(
    'Admin AuthContext exists',
    fs.existsSync(adminAuthPath),
    'Admin AuthContext file is missing'
);

test(
    'System AuthContext exists', 
    fs.existsSync(systemAuthPath),
    'System AuthContext file is missing'
);

// Test 2: Check AuthContext content
if (fs.existsSync(adminAuthPath)) {
    const adminAuthContent = fs.readFileSync(adminAuthPath, 'utf8');
    
    test(
        'Admin AuthContext has proper login function',
        adminAuthContent.includes('await authService.login') || adminAuthContent.includes('/api/admin-auth/login'),
        'Admin AuthContext missing proper login implementation'
    );
    
    test(
        'Admin AuthContext has role-based access',
        adminAuthContent.includes('hasRole') && adminAuthContent.includes('hasPermission'),
        'Admin AuthContext missing role-based access control'
    );
    
    test(
        'Admin AuthContext removed auto-login',
        !adminAuthContent.includes('TEMPORARY: Auto-login') && !adminAuthContent.includes('mockUser'),
        'Admin AuthContext still has development auto-login enabled'
    );
    
    test(
        'Admin AuthContext has token verification',
        adminAuthContent.includes('verify') && adminAuthContent.includes('localStorage'),
        'Admin AuthContext missing token verification'
    );
}

if (fs.existsSync(systemAuthPath)) {
    const systemAuthContent = fs.readFileSync(systemAuthPath, 'utf8');
    
    test(
        'System AuthContext has MFA support',
        systemAuthContent.includes('mfaCode') && systemAuthContent.includes('mfaEnabled'),
        'System AuthContext missing MFA support'
    );
    
    test(
        'System AuthContext has clearance levels',
        systemAuthContent.includes('clearanceLevel') && systemAuthContent.includes('L1') && systemAuthContent.includes('L5'),
        'System AuthContext missing clearance level system'
    );
    
    test(
        'System AuthContext has session timeout',
        systemAuthContent.includes('sessionTimeRemaining') && systemAuthContent.includes('sessionTimeout'),
        'System AuthContext missing session timeout management'
    );
    
    test(
        'System AuthContext removed auto-login',
        !systemAuthContent.includes('TEMPORARY: Auto-login') && !systemAuthContent.includes('mockUser'),
        'System AuthContext still has development auto-login enabled'
    );
    
    test(
        'System AuthContext has emergency controls',
        systemAuthContent.includes('canAccessEmergencyControls') && systemAuthContent.includes('EMERGENCY_CONTROLS'),
        'System AuthContext missing emergency controls access'
    );
    
    test(
        'System AuthContext has security logging',
        systemAuthContent.includes('logSecurityEvent') && systemAuthContent.includes('security-log'),
        'System AuthContext missing security event logging'
    );
}

// Test 3: Check Login components
const adminLoginPath = 'frontend/admin-dashboard/src/pages/Login.tsx';
const systemLoginPath = 'frontend/system-control-dashboard/src/pages/Login.tsx';

test(
    'Admin Login page exists',
    fs.existsSync(adminLoginPath),
    'Admin Login page is missing'
);

test(
    'System Login page exists',
    fs.existsSync(systemLoginPath),
    'System Login page is missing'
);

// Test 4: Check ProtectedRoute components
const adminProtectedPath = 'frontend/admin-dashboard/src/components/ProtectedRoute.tsx';
const systemProtectedPath = 'frontend/system-control-dashboard/src/components/ProtectedRoute.tsx';

test(
    'System ProtectedRoute exists',
    fs.existsSync(systemProtectedPath),
    'System ProtectedRoute component is missing'
);

if (fs.existsSync(systemProtectedPath)) {
    const protectedContent = fs.readFileSync(systemProtectedPath, 'utf8');
    
    test(
        'ProtectedRoute has clearance level checking',
        protectedContent.includes('clearanceLevel') && protectedContent.includes('hasClearanceLevel'),
        'ProtectedRoute missing clearance level validation'
    );
}

// Test 5: Check setup scripts
const setupOwnerPath = 'scripts/setup-owner.sh';
const setupSqlPath = 'scripts/setup-owner-accounts.sql';

test(
    'Owner setup script exists',
    fs.existsSync(setupOwnerPath),
    'Owner setup script is missing'
);

test(
    'Owner SQL script exists',
    fs.existsSync(setupSqlPath),
    'Owner SQL setup script is missing'
);

if (fs.existsSync(setupSqlPath)) {
    const sqlContent = fs.readFileSync(setupSqlPath, 'utf8');
    
    test(
        'SQL script creates admin user',
        sqlContent.includes('admin_users') && sqlContent.includes('owner@mnbarh.com'),
        'SQL script missing admin user creation'
    );
    
    test(
        'SQL script creates system user',
        sqlContent.includes('system_users') && sqlContent.includes('SYSTEM_ADMIN'),
        'SQL script missing system user creation'
    );
    
    test(
        'SQL script has MFA setup',
        sqlContent.includes('mfa_enabled') && sqlContent.includes('mfa_secret'),
        'SQL script missing MFA configuration'
    );
    
    test(
        'SQL script has clearance levels',
        sqlContent.includes('clearance_level') && sqlContent.includes('L5'),
        'SQL script missing clearance level setup'
    );
}

// Test 6: Check production deployment script
const deployScriptPath = 'scripts/production-deploy.sh';

test(
    'Production deployment script exists',
    fs.existsSync(deployScriptPath),
    'Production deployment script is missing'
);

// Test 7: Check environment files
const envProdPath = '.env.production';

test(
    'Production environment file exists',
    fs.existsSync(envProdPath),
    'Production environment file is missing',
    'Will be created automatically by deployment script'
);

// Test 8: Check documentation
const prodGuidePath = 'PRODUCTION_ACCESS_GUIDE.md';
const ownerSetupPath = 'OWNER_ACCESS_SETUP.md';

test(
    'Production access guide exists',
    fs.existsSync(prodGuidePath),
    'Production access guide is missing'
);

test(
    'Owner access setup guide exists',
    fs.existsSync(ownerSetupPath),
    'Owner access setup guide is missing'
);

// Results Summary
console.log('\n=====================================');
console.log('🔍 VALIDATION RESULTS');
console.log('=====================================');

const passRate = Math.round((passed / total) * 100);

console.log(`Total Tests: ${total}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${total - passed}`);
console.log(`📊 Pass Rate: ${passRate}%`);

if (errors.length > 0) {
    console.log('\n❌ CRITICAL ERRORS:');
    errors.forEach(error => console.log(`  - ${error}`));
}

if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
}

console.log('\n=====================================');

if (errors.length === 0) {
    console.log('🎉 AUTHENTICATION SYSTEM VALIDATION PASSED!');
    console.log('✅ The authentication system is ready for production deployment.');
    console.log('\n📋 Next Steps:');
    console.log('1. Run: ./scripts/test-production-setup.sh');
    console.log('2. Run: ./scripts/production-deploy.sh');
    console.log('3. Test login with owner credentials');
    console.log('4. Setup MFA for System Control Dashboard');
    process.exit(0);
} else {
    console.log('❌ AUTHENTICATION SYSTEM VALIDATION FAILED!');
    console.log('🔧 Please fix the critical errors before deploying to production.');
    process.exit(1);
}
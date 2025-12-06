// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title MNBara Token
/// @notice ERC-20 token with KYC tiers, compliance, and upgradeability
/// @custom:security-contact security@mnbara.com
contract MNBToken is 
    Initializable, 
    ERC20Upgradeable, 
    ERC20BurnableUpgradeable, 
    ERC20PausableUpgradeable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable 
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    // KYC Tiers
    mapping(address => uint256) public kycTiers; // 0 = not verified, 1-3 = verification levels
    mapping(address => bool) public frozenAccounts;
    
    // Transfer limits
    mapping(address => uint256) public dailyTransferAmount;
    mapping(address => uint256) public lastTransferTime;

    // Events
    event AccountFrozen(address indexed account);
    event AccountUnfrozen(address indexed account);
    event KYCTierUpdated(address indexed account, uint256 tier);
    event MintedWithReference(address indexed to, uint256 amount, string ref);
    event BurnedWithReference(address indexed from, uint256 amount, string ref);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address defaultAdmin) public initializer {
        __ERC20_init("MNBara Token", "MNBT");
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);
        _grantRole(COMPLIANCE_ROLE, defaultAdmin);
    }

    /// @notice Mint tokens with reference
    function mintWithReference(
        address to,
        uint256 amount,
        string memory ref
    ) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        emit MintedWithReference(to, amount, ref);
    }

    /// @notice Burn tokens with reference
    function burnWithReference(
        address from,
        uint256 amount,
        string memory ref
    ) external onlyRole(MINTER_ROLE) {
        _burn(from, amount);
        emit BurnedWithReference(from, amount, ref);
    }

    /// @notice Override transfer with compliance checks
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20Upgradeable, ERC20PausableUpgradeable) {
        require(!frozenAccounts[from], "Account frozen");
        require(!frozenAccounts[to], "Recipient frozen");
        
        if (from != address(0)) {
            _checkTransferLimits(from, amount);
        }

        super._update(from, to, amount);
    }

    /// @notice Check daily transfer limits based on KYC tier
    function _checkTransferLimits(address account, uint256 amount) internal {
        uint256 currentTime = block.timestamp;
        uint256 oneDay = 86400;

        // Reset daily counter if new day
        if (currentTime - lastTransferTime[account] > oneDay) {
            dailyTransferAmount[account] = 0;
            lastTransferTime[account] = currentTime;
        }

        uint256 tier = kycTiers[account];
        uint256 limit = _getTierLimit(tier);
        
        require(
            dailyTransferAmount[account] + amount <= limit,
            "Daily limit exceeded"
        );

        dailyTransferAmount[account] += amount;
    }

    /// @notice Get transfer limit based on KYC tier
    function _getTierLimit(uint256 tier) internal view returns (uint256) {
        if (tier == 0) return 100 * 10 ** decimals();      // Not verified: 100 tokens
        if (tier == 1) return 1000 * 10 ** decimals();     // Basic: 1,000 tokens
        if (tier == 2) return 10000 * 10 ** decimals();    // Enhanced: 10,000 tokens
        if (tier == 3) return type(uint256).max;           // Full: unlimited
        return 100 * 10 ** decimals();                     // Default
    }

    /// @notice Freeze account (compliance)
    function freezeAccount(address account) external onlyRole(COMPLIANCE_ROLE) {
        frozenAccounts[account] = true;
        emit AccountFrozen(account);
    }

    /// @notice Unfreeze account
    function unfreezeAccount(address account) external onlyRole(COMPLIANCE_ROLE) {
        frozenAccounts[account] = false;
        emit AccountUnfrozen(account);
    }

    /// @notice Update KYC tier
    function updateKYCTier(address account, uint256 newTier) external onlyRole(COMPLIANCE_ROLE) {
        require(newTier <= 3, "Invalid tier");
        kycTiers[account] = newTier;
        emit KYCTierUpdated(account, newTier);
    }

    /// @notice Pause all transfers
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Unpause transfers
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @notice Get KYC tier
    function getKYCTier(address account) external view returns (uint256) {
        return kycTiers[account];
    }

    /// @notice Check if frozen
    function isFrozen(address account) external view returns (bool) {
        return frozenAccounts[account];
    }

    /// @notice Get remaining daily limit
    function getRemainingDailyLimit(address account) external view returns (uint256) {
        uint256 tier = kycTiers[account];
        uint256 limit = _getTierLimit(tier);
        
        if (block.timestamp - lastTransferTime[account] > 86400) {
            return limit;
        }
        
        return limit > dailyTransferAmount[account] 
            ? limit - dailyTransferAmount[account] 
            : 0;
    }

    /// @notice Authorize upgrade
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(UPGRADER_ROLE) 
    {}
}
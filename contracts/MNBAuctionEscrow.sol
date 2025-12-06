// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MNBToken.sol";

/// @title MNBara Auction Escrow Contract
/// @notice Secure escrow for auction payments with dispute resolution
/// @dev Implements upgradeable pattern with UUPS proxy
contract MNBAuctionEscrow is 
    Initializable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable 
{
    bytes32 public constant ESCROW_ADMIN_ROLE = keccak256("ESCROW_ADMIN_ROLE");
    bytes32 public constant DISPUTE_RESOLVER_ROLE = keccak256("DISPUTE_RESOLVER_ROLE");
    
    IERC20 public mnbToken;
    address public treasuryAddress;
    
    struct Escrow {
        uint256 auctionId;
        address buyer;
        address seller;
        uint256 amount;
        uint256 commission; // Platform fee
        EscrowStatus status;
        uint256 createdAt;
        uint256 releasedAt;
        uint256 expiresAt;
        bool usingNativeToken; // ETH or MATIC
    }
    
    enum EscrowStatus {
        PENDING,
        LOCKED,
        RELEASED,
        REFUNDED,
        DISPUTED,
        EXPIRED
    }
    
    // Mappings
    mapping(uint256 => Escrow) public escrows; // auctionId => Escrow
    mapping(address => uint256[]) public userEscrows; // For tracking user escrows
    
    // Statistics
    uint256 public totalEscrowVolume;
    uint256 public totalCommissionCollected;
    uint256 public activeEscrowCount;
    
    // Configuration
    uint256 public defaultCommissionBasisPoints = 250; // 2.5%
    uint256 public escrowLockDuration = 7 days;
    
    // Events
    event EscrowCreated(
        uint256 indexed auctionId, 
        address indexed buyer, 
        address indexed seller, 
        uint256 amount,
        bool usingNativeToken
    );
    event FundsLocked(uint256 indexed auctionId, uint256 amount);
    event FundsReleased(
        uint256 indexed auctionId, 
        address indexed seller, 
        uint256 netAmount, 
        uint256 commission
    );
    event FundsRefunded(uint256 indexed auctionId, address indexed buyer, uint256 amount);
    event DisputeRaised(uint256 indexed auctionId, address indexed initiator, string reason);
    event DisputeResolved(uint256 indexed auctionId, address indexed resolver, bool favorBuyer);
    event CommissionWithdrawn(address indexed recipient, uint256 amount);
    event ConfigUpdated(uint256 commissionBps, uint256 lockDuration);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address defaultAdmin,
        address _mnbTokenAddress,
        address _treasuryAddress
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ESCROW_ADMIN_ROLE, defaultAdmin);
        _grantRole(DISPUTE_RESOLVER_ROLE, defaultAdmin);
        
        mnbToken = IERC20(_mnbTokenAddress);
        treasuryAddress = _treasuryAddress;
    }
    
    /// @notice Create and lock funds for an auction
    /// @param auctionId Unique auction identifier
    /// @param seller Seller's wallet address
    /// @param amount Amount to lock
    /// @param useNativeToken Whether to use ETH/MATIC or MNB token
    function lockFunds(
        uint256 auctionId,
        address seller,
        uint256 amount,
        bool useNativeToken
    ) external payable nonReentrant {
        require(seller != address(0), "Invalid seller address");
        require(amount > 0, "Amount must be greater than 0");
        require(
            escrows[auctionId].status == EscrowStatus.PENDING || 
            escrows[auctionId].buyer == address(0), 
            "Escrow already exists"
        );
        
        uint256 commission = (amount * defaultCommissionBasisPoints) / 10000;
        
        if (useNativeToken) {
            require(msg.value == amount, "Incorrect native token amount");
        } else {
            require(msg.value == 0, "Should not send native token");
            require(
                mnbToken.transferFrom(msg.sender, address(this), amount),
                "Token transfer failed"
            );
        }
        
        escrows[auctionId] = Escrow({
            auctionId: auctionId,
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            commission: commission,
            status: EscrowStatus.LOCKED,
            createdAt: block.timestamp,
            releasedAt: 0,
            expiresAt: block.timestamp + escrowLockDuration,
            usingNativeToken: useNativeToken
        });
        
        userEscrows[msg.sender].push(auctionId);
        userEscrows[seller].push(auctionId);
        
        totalEscrowVolume += amount;
        activeEscrowCount++;
        
        emit EscrowCreated(auctionId, msg.sender, seller, amount, useNativeToken);
        emit FundsLocked(auctionId, amount);
    }
    
    /// @notice Release funds to seller after successful delivery
    /// @param auctionId Auction identifier
    function releaseFunds(uint256 auctionId) 
        external 
        onlyRole(ESCROW_ADMIN_ROLE) 
        nonReentrant 
    {
        Escrow storage escrow = escrows[auctionId];
        require(escrow.status == EscrowStatus.LOCKED, "Escrow not locked");
        require(block.timestamp <= escrow.expiresAt, "Escrow expired");
        
        uint256 netAmount = escrow.amount - escrow.commission;
        
        escrow.status = EscrowStatus.RELEASED;
        escrow.releasedAt = block.timestamp;
        activeEscrowCount--;
        
        totalCommissionCollected += escrow.commission;
        
        // Transfer funds
        if (escrow.usingNativeToken) {
            payable(escrow.seller).transfer(netAmount);
            payable(treasuryAddress).transfer(escrow.commission);
        } else {
            require(mnbToken.transfer(escrow.seller, netAmount), "Seller transfer failed");
            require(mnbToken.transfer(treasuryAddress, escrow.commission), "Commission transfer failed");
        }
        
        emit FundsReleased(auctionId, escrow.seller, netAmount, escrow.commission);
    }
    
    /// @notice Refund buyer (in case of dispute resolution or seller failure)
    /// @param auctionId Auction identifier
    function refundBuyer(uint256 auctionId) 
        external 
        onlyRole(ESCROW_ADMIN_ROLE) 
        nonReentrant 
    {
        Escrow storage escrow = escrows[auctionId];
        require(
            escrow.status == EscrowStatus.LOCKED || 
            escrow.status == EscrowStatus.DISPUTED, 
            "Invalid status for refund"
        );
        
        escrow.status = EscrowStatus.REFUNDED;
        activeEscrowCount--;
        
        // Refund full amount to buyer (no commission charged on refund)
        if (escrow.usingNativeToken) {
            payable(escrow.buyer).transfer(escrow.amount);
        } else {
            require(mnbToken.transfer(escrow.buyer, escrow.amount), "Refund transfer failed");
        }
        
        emit FundsRefunded(auctionId, escrow.buyer, escrow.amount);
    }
    
    /// @notice Raise a dispute (can be called by buyer or seller)
    /// @param auctionId Auction identifier
    /// @param reason Reason for dispute
    function raiseDispute(uint256 auctionId, string calldata reason) external {
        Escrow storage escrow = escrows[auctionId];
        require(
            msg.sender == escrow.buyer || msg.sender == escrow.seller, 
            "Not authorized"
        );
        require(escrow.status == EscrowStatus.LOCKED, "Escrow not locked");
        
        escrow.status = EscrowStatus.DISPUTED;
        
        emit DisputeRaised(auctionId, msg.sender, reason);
    }
    
    /// @notice Resolve a dispute (admin/resolver only)
    /// @param auctionId Auction identifier
    /// @param favorBuyer True to refund buyer, false to release to seller
    function resolveDispute(uint256 auctionId, bool favorBuyer) 
        external 
        onlyRole(DISPUTE_RESOLVER_ROLE) 
    {
        Escrow storage escrow = escrows[auctionId];
        require(escrow.status == EscrowStatus.DISPUTED, "Not disputed");
        
        if (favorBuyer) {
            refundBuyer(auctionId);
        } else {
            releaseFunds(auctionId);
        }
        
        emit DisputeResolved(auctionId, msg.sender, favorBuyer);
    }
    
    /// @notice Handle expired escrows (auto-refund after lock duration)
    /// @param auctionId Auction identifier
    function handleExpiredEscrow(uint256 auctionId) external {
        Escrow storage escrow = escrows[auctionId];
        require(escrow.status == EscrowStatus.LOCKED, "Escrow not locked");
        require(block.timestamp > escrow.expiresAt, "Not expired yet");
        
        escrow.status = EscrowStatus.EXPIRED;
        activeEscrowCount--;
        
        // Auto-refund buyer on expiration
        if (escrow.usingNativeToken) {
            payable(escrow.buyer).transfer(escrow.amount);
        } else {
            require(mnbToken.transfer(escrow.buyer, escrow.amount), "Expiry refund failed");
        }
        
        emit FundsRefunded(auctionId, escrow.buyer, escrow.amount);
    }
    
    /// @notice Update configuration (admin only)
    /// @param commissionBps Commission in basis points (250 = 2.5%)
    /// @param lockDuration Lock duration in seconds
    function updateConfig(uint256 commissionBps, uint256 lockDuration) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(commissionBps <= 1000, "Commission too high"); // Max 10%
        require(lockDuration >= 1 days && lockDuration <= 30 days, "Invalid duration");
        
        defaultCommissionBasisPoints = commissionBps;
        escrowLockDuration = lockDuration;
        
        emit ConfigUpdated(commissionBps, lockDuration);
    }
    
    /// @notice Get escrow details
    /// @param auctionId Auction identifier
    function getEscrow(uint256 auctionId) external view returns (Escrow memory) {
        return escrows[auctionId];
    }
    
    /// @notice Get user's escrow IDs
    /// @param user User address
    function getUserEscrows(address user) external view returns (uint256[] memory) {
        return userEscrows[user];
    }
    
    /// @notice Get contract statistics
    function getStats() external view returns (
        uint256 volume,
        uint256 commission,
        uint256 activeCount
    ) {
        return (totalEscrowVolume, totalCommissionCollected, activeEscrowCount);
    }
    
    /// @notice Update treasury address (admin only)
    /// @param newTreasury New treasury address
    function updateTreasury(address newTreasury) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newTreasury != address(0), "Invalid treasury");
        treasuryAddress = newTreasury;
    }
    
    /// @notice Emergency withdraw (admin only, for stuck funds)
    /// @param token Token address (address(0) for native token)
    /// @param amount Amount to withdraw
    function emergencyWithdraw(address token, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).transfer(msg.sender, amount);
        }
    }
    
    /// @notice Authorize upgrade (admin only)
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}
    
    /// @notice Receive native tokens
    receive() external payable {}
}

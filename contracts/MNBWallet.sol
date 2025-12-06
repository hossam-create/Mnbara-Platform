// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./MNBToken.sol";

/// @title MNBara Wallet Management Contract
/// @notice Manages user wallets, multi-signature operations, and asset custody
contract MNBWallet is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant WALLET_ADMIN_ROLE = keccak256("WALLET_ADMIN_ROLE");
    bytes32 public constant TREASURY_MANAGER_ROLE = keccak256("TREASURY_MANAGER_ROLE");
    
    MNBToken public token;
    
    // User wallet structure
    struct UserWallet {
        address walletAddress;
        uint256 createdAt;
        uint256 balance;
        bool isActive;
        uint256 withdrawalLimit;
        uint256 dailyWithdrawn;
        uint256 lastWithdrawalTime;
    }
    
    // Multi-signature wallet structure
    struct MultiSigWallet {
        address[] signers;
        uint256 requiredSignatures;
        mapping(bytes32 => mapping(address => bool)) approvals;
        mapping(bytes32 => bool) executed;
    }
    
    // Mappings
    mapping(address => UserWallet) public userWallets;
    mapping(address => MultiSigWallet) public multiSigWallets;
    mapping(address => address) public userToWallet;
    
    // Treasury management
    address public treasuryAddress;
    uint256 public treasuryBalance;
    uint256 public totalAssetsUnderManagement;
    
    // Events
    event WalletCreated(address indexed user, address walletAddress);
    event WalletFunded(address indexed wallet, uint256 amount, string ref);
    event WithdrawalProcessed(address indexed wallet, uint256 amount, address to);
    event MultiSigTransactionProposed(bytes32 indexed txHash, address indexed wallet, address proposer);
    event MultiSigTransactionApproved(bytes32 indexed txHash, address indexed wallet, address approver);
    event MultiSigTransactionExecuted(bytes32 indexed txHash, address indexed wallet);
    event TreasuryDeposit(address indexed from, uint256 amount);
    event TreasuryWithdrawal(address indexed to, uint256 amount, string purpose);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address defaultAdmin,
        address _tokenAddress,
        address _treasuryAddress
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(WALLET_ADMIN_ROLE, defaultAdmin);
        _grantRole(TREASURY_MANAGER_ROLE, defaultAdmin);
        
        token = MNBToken(_tokenAddress);
        treasuryAddress = _treasuryAddress;
    }
    
    /// @notice Create a new user wallet
    function createWallet(address user) external onlyRole(WALLET_ADMIN_ROLE) returns (address) {
        require(userToWallet[user] == address(0), "Wallet already exists");
        
        // In a real implementation, this would create a new wallet contract
        // For simplicity, we're using the user's address directly
        address walletAddress = user;
        
        userWallets[walletAddress] = UserWallet({
            walletAddress: walletAddress,
            createdAt: block.timestamp,
            balance: 0,
            isActive: true,
            withdrawalLimit: 1000 * 10 ** 18, // Default limit: 1000 tokens
            dailyWithdrawn: 0,
            lastWithdrawalTime: 0
        });
        
        userToWallet[user] = walletAddress;
        
        emit WalletCreated(user, walletAddress);
        return walletAddress;
    }
    
    /// @notice Fund a user wallet from treasury
    function fundWallet(
        address wallet,
        uint256 amount,
        string memory ref
    ) external onlyRole(TREASURY_MANAGER_ROLE) {
        require(userWallets[wallet].isActive, "Wallet not active");
        require(treasuryBalance >= amount, "Insufficient treasury balance");
        
        treasuryBalance -= amount;
        userWallets[wallet].balance += amount;
        totalAssetsUnderManagement += amount;
        
        emit WalletFunded(wallet, amount, ref);
        emit TreasuryWithdrawal(wallet, amount, ref);
    }
    
    /// @notice Process withdrawal from user wallet
    function processWithdrawal(
        address wallet,
        uint256 amount,
        address to
    ) external onlyRole(WALLET_ADMIN_ROLE) {
        UserWallet storage userWallet = userWallets[wallet];
        require(userWallet.isActive, "Wallet not active");
        require(userWallet.balance >= amount, "Insufficient balance");
        
        // Check daily withdrawal limit
        _checkWithdrawalLimit(wallet, amount);
        
        userWallet.balance -= amount;
        userWallet.dailyWithdrawn += amount;
        userWallet.lastWithdrawalTime = block.timestamp;
        totalAssetsUnderManagement -= amount;
        
        // Transfer tokens to recipient
        require(token.transfer(to, amount), "Transfer failed");
        
        emit WithdrawalProcessed(wallet, amount, to);
    }
    
    /// @notice Check withdrawal limits
    function _checkWithdrawalLimit(address wallet, uint256 amount) internal {
        UserWallet storage userWallet = userWallets[wallet];
        uint256 currentTime = block.timestamp;
        uint256 oneDay = 86400;
        
        // Reset daily counter if new day
        if (currentTime - userWallet.lastWithdrawalTime > oneDay) {
            userWallet.dailyWithdrawn = 0;
            userWallet.lastWithdrawalTime = currentTime;
        }
        
        require(
            userWallet.dailyWithdrawn + amount <= userWallet.withdrawalLimit,
            "Daily withdrawal limit exceeded"
        );
    }
    
    /// @notice Deposit to treasury
    function depositToTreasury(uint256 amount) external {
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        treasuryBalance += amount;
        
        emit TreasuryDeposit(msg.sender, amount);
    }
    
    /// @notice Withdraw from treasury (multi-sig required)
    function proposeTreasuryWithdrawal(
        address to,
        uint256 amount,
        string memory purpose
    ) external onlyRole(TREASURY_MANAGER_ROLE) returns (bytes32) {
        require(treasuryBalance >= amount, "Insufficient treasury balance");
        
        bytes32 txHash = keccak256(abi.encodePacked(to, amount, purpose, block.timestamp));
        
        MultiSigWallet storage wallet = multiSigWallets[treasuryAddress];
        require(!wallet.executed[txHash], "Transaction already executed");
        
        wallet.approvals[txHash][msg.sender] = true;
        
        emit MultiSigTransactionProposed(txHash, treasuryAddress, msg.sender);
        return txHash;
    }
    
    /// @notice Approve treasury withdrawal
    function approveTreasuryWithdrawal(bytes32 txHash) external onlyRole(TREASURY_MANAGER_ROLE) {
        MultiSigWallet storage wallet = multiSigWallets[treasuryAddress];
        require(!wallet.executed[txHash], "Transaction already executed");
        
        wallet.approvals[txHash][msg.sender] = true;
        
        emit MultiSigTransactionApproved(txHash, treasuryAddress, msg.sender);
    }
    
    /// @notice Execute approved treasury withdrawal
    function executeTreasuryWithdrawal(
        bytes32 txHash,
        address to,
        uint256 amount,
        string memory purpose
    ) external onlyRole(TREASURY_MANAGER_ROLE) {
        MultiSigWallet storage wallet = multiSigWallets[treasuryAddress];
        require(!wallet.executed[txHash], "Transaction already executed");
        
        uint256 approvalCount = 0;
        for (uint256 i = 0; i < wallet.signers.length; i++) {
            if (wallet.approvals[txHash][wallet.signers[i]]) {
                approvalCount++;
            }
        }
        
        require(approvalCount >= wallet.requiredSignatures, "Insufficient approvals");
        
        treasuryBalance -= amount;
        require(token.transfer(to, amount), "Transfer failed");
        wallet.executed[txHash] = true;
        
        emit TreasuryWithdrawal(to, amount, purpose);
        emit MultiSigTransactionExecuted(txHash, treasuryAddress);
    }
    
    /// @notice Set withdrawal limit for a wallet
    function setWithdrawalLimit(
        address wallet,
        uint256 newLimit
    ) external onlyRole(WALLET_ADMIN_ROLE) {
        userWallets[wallet].withdrawalLimit = newLimit;
    }
    
    /// @notice Get wallet balance
    function getWalletBalance(address wallet) external view returns (uint256) {
        return userWallets[wallet].balance;
    }
    
    /// @notice Get user wallet address
    function getUserWallet(address user) external view returns (address) {
        return userToWallet[user];
    }
    
    /// @notice Upgrade contract implementation
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}
}
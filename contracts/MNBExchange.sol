// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MNBToken.sol";

/// @title MNBara Exchange Contract
/// @notice Handles token exchanges, liquidity provision, and price oracles
contract MNBExchange is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant EXCHANGE_ADMIN_ROLE = keccak256("EXCHANGE_ADMIN_ROLE");
    bytes32 public constant LIQUIDITY_PROVIDER_ROLE = keccak256("LIQUIDITY_PROVIDER_ROLE");
    
    MNBToken public mnbToken;
    
    // Exchange pairs
    struct ExchangePair {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        bool isActive;
        uint256 feePercentage; // Basis points (100 = 1%)
    }
    
    // Liquidity provider shares
    struct LiquidityPosition {
        address provider;
        uint256 pairId;
        uint256 liquidityTokens;
        uint256 timestamp;
    }
    
    // Order book structure (simplified)
    struct Order {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMin;
        uint256 timestamp;
        bool isFilled;
    }
    
    // Mappings
    mapping(uint256 => ExchangePair) public exchangePairs;
    mapping(address => mapping(uint256 => uint256)) public liquidityBalances;
    mapping(uint256 => LiquidityPosition[]) public liquidityPositions;
    mapping(uint256 => Order[]) public orderBooks;
    
    // Price oracle (simplified)
    mapping(address => uint256) public tokenPrices; // Price in USD (6 decimals)
    
    // Exchange statistics
    uint256 public totalTradingVolume;
    uint256 public totalLiquidityProvided;
    uint256 public totalFeesCollected;
    uint256 public nextPairId;
    
    // Events
    event PairCreated(uint256 indexed pairId, address tokenA, address tokenB);
    event LiquidityAdded(uint256 indexed pairId, address provider, uint256 amountA, uint256 amountB, uint256 liquidityTokens);
    event LiquidityRemoved(uint256 indexed pairId, address provider, uint256 amountA, uint256 amountB, uint256 liquidityTokens);
    event SwapExecuted(uint256 indexed pairId, address user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event OrderPlaced(uint256 indexed orderId, address user, address tokenIn, address tokenOut, uint256 amountIn);
    event OrderFilled(uint256 indexed orderId, address user, uint256 amountOut);
    event PriceUpdated(address indexed token, uint256 newPrice);
    event FeesCollected(uint256 indexed pairId, uint256 feesCollected);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address defaultAdmin,
        address _mnbTokenAddress
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(EXCHANGE_ADMIN_ROLE, defaultAdmin);
        _grantRole(LIQUIDITY_PROVIDER_ROLE, defaultAdmin);
        
        mnbToken = MNBToken(_mnbTokenAddress);
        nextPairId = 1;
    }
    
    /// @notice Create a new exchange pair
    function createPair(
        address tokenA,
        address tokenB,
        uint256 feePercentage
    ) external onlyRole(EXCHANGE_ADMIN_ROLE) returns (uint256) {
        require(tokenA != tokenB, "Cannot create pair with same tokens");
        require(feePercentage <= 500, "Fee too high"); // Max 5%
        
        uint256 pairId = nextPairId++;
        exchangePairs[pairId] = ExchangePair({
            tokenA: tokenA,
            tokenB: tokenB,
            reserveA: 0,
            reserveB: 0,
            totalLiquidity: 0,
            isActive: true,
            feePercentage: feePercentage
        });
        
        emit PairCreated(pairId, tokenA, tokenB);
        return pairId;
    }
    
    /// @notice Add liquidity to a pair
    function addLiquidity(
        uint256 pairId,
        uint256 amountA,
        uint256 amountB
    ) external onlyRole(LIQUIDITY_PROVIDER_ROLE) returns (uint256) {
        ExchangePair storage pair = exchangePairs[pairId];
        require(pair.isActive, "Pair not active");
        
        // Transfer tokens from provider
        require(IERC20(pair.tokenA).transferFrom(msg.sender, address(this), amountA), "Transfer A failed");
        require(IERC20(pair.tokenB).transferFrom(msg.sender, address(this), amountB), "Transfer B failed");
        
        // Calculate liquidity tokens (simplified)
        uint256 liquidityTokens;
        if (pair.totalLiquidity == 0) {
            liquidityTokens = sqrt(amountA * amountB);
        } else {
            liquidityTokens = (amountA * pair.totalLiquidity) / pair.reserveA;
        }
        
        // Update reserves
        pair.reserveA += amountA;
        pair.reserveB += amountB;
        pair.totalLiquidity += liquidityTokens;
        
        // Update provider balance
        liquidityBalances[msg.sender][pairId] += liquidityTokens;
        
        // Record position
        liquidityPositions[pairId].push(LiquidityPosition({
            provider: msg.sender,
            pairId: pairId,
            liquidityTokens: liquidityTokens,
            timestamp: block.timestamp
        }));
        
        totalLiquidityProvided += amountA + amountB;
        
        emit LiquidityAdded(pairId, msg.sender, amountA, amountB, liquidityTokens);
        return liquidityTokens;
    }
    
    /// @notice Remove liquidity from a pair
    function removeLiquidity(
        uint256 pairId,
        uint256 liquidityTokens
    ) external onlyRole(LIQUIDITY_PROVIDER_ROLE) returns (uint256, uint256) {
        ExchangePair storage pair = exchangePairs[pairId];
        require(liquidityBalances[msg.sender][pairId] >= liquidityTokens, "Insufficient liquidity");
        
        // Calculate amounts to return
        uint256 amountA = (liquidityTokens * pair.reserveA) / pair.totalLiquidity;
        uint256 amountB = (liquidityTokens * pair.reserveB) / pair.totalLiquidity;
        
        // Update reserves and liquidity
        pair.reserveA -= amountA;
        pair.reserveB -= amountB;
        pair.totalLiquidity -= liquidityTokens;
        
        // Update provider balance
        liquidityBalances[msg.sender][pairId] -= liquidityTokens;
        
        // Transfer tokens back to provider
        require(IERC20(pair.tokenA).transfer(msg.sender, amountA), "Transfer A failed");
        require(IERC20(pair.tokenB).transfer(msg.sender, amountB), "Transfer B failed");
        
        totalLiquidityProvided -= amountA + amountB;
        
        emit LiquidityRemoved(pairId, msg.sender, amountA, amountB, liquidityTokens);
        return (amountA, amountB);
    }
    
    /// @notice Execute a token swap
    function swap(
        uint256 pairId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    ) external returns (uint256) {
        ExchangePair storage pair = exchangePairs[pairId];
        require(pair.isActive, "Pair not active");
        require(
            (tokenIn == pair.tokenA && tokenOut == pair.tokenB) ||
            (tokenIn == pair.tokenB && tokenOut == pair.tokenA),
            "Invalid token pair"
        );
        
        // Calculate output amount (constant product formula)
        uint256 amountOut;
        if (tokenIn == pair.tokenA) {
            amountOut = getAmountOut(amountIn, pair.reserveA, pair.reserveB);
        } else {
            amountOut = getAmountOut(amountIn, pair.reserveB, pair.reserveA);
        }
        
        require(amountOut >= amountOutMin, "Insufficient output amount");
        
        // Calculate and collect fees
        uint256 fee = (amountIn * pair.feePercentage) / 10000;
        uint256 amountInAfterFee = amountIn - fee;
        
        // Transfer input tokens
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer failed");
        
        // Update reserves
        if (tokenIn == pair.tokenA) {
            pair.reserveA += amountInAfterFee;
            pair.reserveB -= amountOut;
        } else {
            pair.reserveB += amountInAfterFee;
            pair.reserveA -= amountOut;
        }
        
        // Transfer output tokens
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Transfer failed");
        
        // Update statistics
        totalTradingVolume += amountIn;
        totalFeesCollected += fee;
        
        emit SwapExecuted(pairId, msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        emit FeesCollected(pairId, fee);
        
        return amountOut;
    }
    
    /// @notice Calculate output amount using constant product formula
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256) {
        require(amountIn > 0, "Invalid input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn * 997; // 0.3% fee
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        
        return numerator / denominator;
    }
    
    /// @notice Get price for a token
    function getPrice(address token) external view returns (uint256) {
        return tokenPrices[token];
    }
    
    /// @notice Update token price (oracle)
    function updatePrice(
        address token,
        uint256 newPrice
    ) external onlyRole(EXCHANGE_ADMIN_ROLE) {
        tokenPrices[token] = newPrice;
        emit PriceUpdated(token, newPrice);
    }
    
    /// @notice Get pair information
    function getPairInfo(uint256 pairId) external view returns (
        address tokenA,
        address tokenB,
        uint256 reserveA,
        uint256 reserveB,
        uint256 totalLiquidity,
        bool isActive,
        uint256 feePercentage
    ) {
        ExchangePair storage pair = exchangePairs[pairId];
        return (
            pair.tokenA,
            pair.tokenB,
            pair.reserveA,
            pair.reserveB,
            pair.totalLiquidity,
            pair.isActive,
            pair.feePercentage
        );
    }
    
    /// @notice Get user liquidity position
    function getUserLiquidity(
        address user,
        uint256 pairId
    ) external view returns (uint256) {
        return liquidityBalances[user][pairId];
    }
    
    /// @notice Square root function (for liquidity calculation)
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
    
    /// @notice Upgrade contract implementation
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}
}
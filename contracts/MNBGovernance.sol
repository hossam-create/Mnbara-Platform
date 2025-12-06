// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./MNBToken.sol";

/// @title MNBara Governance Contract
/// @notice Handles decentralized governance, voting, and proposal management
contract MNBGovernance is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    using EnumerableSet for EnumerableSet.AddressSet;
    
    bytes32 public constant GOVERNANCE_ADMIN_ROLE = keccak256("GOVERNANCE_ADMIN_ROLE");
    bytes32 public constant PROPOSAL_CREATOR_ROLE = keccak256("PROPOSAL_CREATOR_ROLE");
    
    MNBToken public governanceToken;
    
    // Governance parameters
    uint256 public votingDelay; // blocks
    uint256 public votingPeriod; // blocks
    uint256 public proposalThreshold; // minimum tokens required to create proposal
    uint256 public quorumVotes; // minimum votes required for quorum
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        address[] targets;
        uint256[] values;
        string[] signatures;
        bytes[] calldatas;
        uint256 startBlock;
        uint256 endBlock;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool canceled;
        bool executed;
        mapping(address => Receipt) receipts;
    }
    
    // Vote receipt
    struct Receipt {
        bool hasVoted;
        uint8 support; // 0 = against, 1 = for, 2 = abstain
        uint256 votes;
    }
    
    // Proposal state
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }
    
    // Mappings
    mapping(uint256 => Proposal) public proposals;
    mapping(bytes32 => bool) public queuedTransactions;
    
    EnumerableSet.AddressSet private governors;
    
    uint256 public proposalCount;
    uint256 public timelockDelay; // seconds
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address proposer,
        address[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 startBlock,
        uint256 endBlock,
        string description
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 votes,
        string reason
    );
    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId);
    event VotingDelaySet(uint256 oldVotingDelay, uint256 newVotingDelay);
    event VotingPeriodSet(uint256 oldVotingPeriod, uint256 newVotingPeriod);
    event NewGovernor(address indexed governor);
    event GovernorRemoved(address indexed governor);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address defaultAdmin,
        address _governanceToken,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumVotes
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(GOVERNANCE_ADMIN_ROLE, defaultAdmin);
        _grantRole(PROPOSAL_CREATOR_ROLE, defaultAdmin);
        
        governanceToken = MNBToken(_governanceToken);
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
        quorumVotes = _quorumVotes;
        timelockDelay = 2 days;
        
        // Add default admin as governor
        governors.add(defaultAdmin);
    }
    
    /// @notice Create a new governance proposal
    function propose(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256) {
        require(
            governanceToken.balanceOf(msg.sender) >= proposalThreshold,
            "Insufficient tokens for proposal"
        );
        require(targets.length == values.length, "Invalid proposal");
        require(targets.length == signatures.length, "Invalid proposal");
        require(targets.length == calldatas.length, "Invalid proposal");
        require(targets.length > 0, "No actions");
        require(targets.length <= 10, "Too many actions");
        
        uint256 proposalId = proposalCount++;
        Proposal storage newProposal = proposals[proposalId];
        
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.targets = targets;
        newProposal.values = values;
        newProposal.signatures = signatures;
        newProposal.calldatas = calldatas;
        newProposal.startBlock = block.number + votingDelay;
        newProposal.endBlock = block.number + votingDelay + votingPeriod;
        newProposal.description = description;
        newProposal.forVotes = 0;
        newProposal.againstVotes = 0;
        newProposal.abstainVotes = 0;
        newProposal.canceled = false;
        newProposal.executed = false;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            targets,
            values,
            signatures,
            calldatas,
            newProposal.startBlock,
            newProposal.endBlock,
            description
        );
        
        return proposalId;
    }
    
    /// @notice Cast a vote on a proposal
    function castVote(
        uint256 proposalId,
        uint8 support,
        string memory reason
    ) external {
        require(state(proposalId) == ProposalState.Active, "Voting not active");
        require(support <= 2, "Invalid vote type");
        
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[msg.sender];
        
        require(!receipt.hasVoted, "Already voted");
        
        uint256 votes = governanceToken.balanceOf(msg.sender);
        
        if (support == 0) {
            proposal.againstVotes += votes;
        } else if (support == 1) {
            proposal.forVotes += votes;
        } else if (support == 2) {
            proposal.abstainVotes += votes;
        }
        
        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = votes;
        
        emit VoteCast(msg.sender, proposalId, support, votes, reason);
    }
    
    /// @notice Execute a successful proposal
    function execute(uint256 proposalId) external {
        require(state(proposalId) == ProposalState.Succeeded, "Proposal not successful");
        
        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;
        
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{
                value: proposal.values[i]
            }(
                abi.encodePacked(
                    bytes4(keccak256(bytes(proposal.signatures[i]))),
                    proposal.calldatas[i]
                )
            );
            require(success, "Transaction failed");
        }
        
        emit ProposalExecuted(proposalId);
    }
    
    /// @notice Cancel a proposal
    function cancel(uint256 proposalId) external onlyRole(GOVERNANCE_ADMIN_ROLE) {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        
        proposal.canceled = true;
        
        emit ProposalCanceled(proposalId);
    }
    
    /// @notice Get current state of a proposal
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (block.number <= proposal.startBlock) {
            return ProposalState.Pending;
        } else if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        } else if (proposal.forVotes <= proposal.againstVotes || proposal.forVotes < quorumVotes) {
            return ProposalState.Defeated;
        } else if (proposal.executed) {
            return ProposalState.Executed;
        } else {
            return ProposalState.Succeeded;
        }
    }
    
    /// @notice Add a new governor
    function addGovernor(address governor) external onlyRole(GOVERNANCE_ADMIN_ROLE) {
        require(governors.add(governor), "Already a governor");
        emit NewGovernor(governor);
    }
    
    /// @notice Remove a governor
    function removeGovernor(address governor) external onlyRole(GOVERNANCE_ADMIN_ROLE) {
        require(governors.remove(governor), "Not a governor");
        emit GovernorRemoved(governor);
    }
    
    /// @notice Check if address is a governor
    function isGovernor(address account) external view returns (bool) {
        return governors.contains(account);
    }
    
    /// @notice Get number of governors
    function getGovernorCount() external view returns (uint256) {
        return governors.length();
    }
    
    /// @notice Get governor at index
    function getGovernor(uint256 index) external view returns (address) {
        return governors.at(index);
    }
    
    /// @notice Set voting delay
    function setVotingDelay(uint256 newVotingDelay) external onlyRole(GOVERNANCE_ADMIN_ROLE) {
        emit VotingDelaySet(votingDelay, newVotingDelay);
        votingDelay = newVotingDelay;
    }
    
    /// @notice Set voting period
    function setVotingPeriod(uint256 newVotingPeriod) external onlyRole(GOVERNANCE_ADMIN_ROLE) {
        emit VotingPeriodSet(votingPeriod, newVotingPeriod);
        votingPeriod = newVotingPeriod;
    }
    
    /// @notice Set proposal threshold
    function setProposalThreshold(uint256 newThreshold) external onlyRole(GOVERNANCE_ADMIN_ROLE) {
        proposalThreshold = newThreshold;
    }
    
    /// @notice Set quorum votes
    function setQuorumVotes(uint256 newQuorumVotes) external onlyRole(GOVERNANCE_ADMIN_ROLE) {
        quorumVotes = newQuorumVotes;
    }
    
    /// @notice Get receipt for a voter on a proposal
    function getReceipt(uint256 proposalId, address voter) external view returns (bool, uint8, uint256) {
        Receipt memory receipt = proposals[proposalId].receipts[voter];
        return (receipt.hasVoted, receipt.support, receipt.votes);
    }
    
    /// @notice Get proposal details
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        uint256 startBlock,
        uint256 endBlock,
        string memory description,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        bool canceled,
        bool executed
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.startBlock,
            proposal.endBlock,
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.canceled,
            proposal.executed
        );
    }
    
    /// @notice Upgrade contract implementation
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}
}
import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ContractsService } from '../../../services/contracts.service';
import { ethers } from 'ethers';

@Controller('api/blockchain/governance')
export class GovernanceController {
  constructor(private readonly contractsService: ContractsService) {}

  /**
   * Create proposal
   * POST /api/blockchain/governance/create-proposal
   */
  @Post('create-proposal')
  async createProposal(@Body() body: {
    title: string;
    description: string;
    targets: string[];
    values: string[];
    calldatas: string[];
  }) {
    try {
      const { title, description, targets, values, calldatas } = body;

      // Convert values to BigInt
      const valuesWei = values.map(v => ethers.parseEther(v || '0'));

      const tx = await this.contractsService.writeContract(
        'MNBGovernance',
        'createProposal',
        [title, description, targets, valuesWei, calldatas]
      );

      return {
        success: true,
        transactionHash: tx.hash,
        proposal: { title, description }
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Vote on proposal
   * POST /api/blockchain/governance/vote
   */
  @Post('vote')
  async vote(@Body() body: { proposalId: number; support: boolean }) {
    try {
      const { proposalId, support } = body;

      const tx = await this.contractsService.writeContract(
        'MNBGovernance',
        'vote',
        [proposalId, support]
      );

      return {
        success: true,
        transactionHash: tx.hash,
        proposalId,
        support
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Execute proposal
   * POST /api/blockchain/governance/execute
   */
  @Post('execute')
  async executeProposal(@Body() body: { proposalId: number }) {
    try {
      const { proposalId } = body;

      const tx = await this.contractsService.writeContract(
        'MNBGovernance',
        'executeProposal',
        [proposalId]
      );

      return {
        success: true,
        transactionHash: tx.hash,
        proposalId
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get proposal details
   * GET /api/blockchain/governance/proposal/:id
   */
  @Get('proposal/:id')
  async getProposal(@Param('id') id: string) {
    try {
      const proposal = await this.contractsService.readContract(
        'MNBGovernance',
        'proposals',
        [id]
      );

      const state = await this.contractsService.readContract(
        'MNBGovernance',
        'getProposalState',
        [id]
      );

      const stateNames = ['Pending', 'Active', 'Defeated', 'Succeeded', 'Executed'];

      return {
        success: true,
        proposal: {
          id,
          proposer: proposal.proposer,
          title: proposal.title,
          description: proposal.description,
          forVotes: ethers.formatEther(proposal.forVotes),
          againstVotes: ethers.formatEther(proposal.againstVotes),
          startBlock: Number(proposal.startBlock),
          endBlock: Number(proposal.endBlock),
          state: stateNames[Number(state)] || 'Unknown',
          executed: proposal.executed
        }
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all proposals
   * GET /api/blockchain/governance/proposals
   */
  @Get('proposals')
  async getAllProposals() {
    try {
      const proposalCount = await this.contractsService.readContract(
        'MNBGovernance',
        'proposalCount'
      );

      const proposals = [];
      for (let i = 1; i <= Number(proposalCount); i++) {
        const proposal = await this.contractsService.readContract(
          'MNBGovernance',
          'proposals',
          [i]
        );

        const state = await this.contractsService.readContract(
          'MNBGovernance',
          'getProposalState',
          [i]
        );

        const stateNames = ['Pending', 'Active', 'Defeated', 'Succeeded', 'Executed'];

        proposals.push({
          id: i,
          proposer: proposal.proposer,
          title: proposal.title,
          description: proposal.description,
          forVotes: ethers.formatEther(proposal.forVotes),
          againstVotes: ethers.formatEther(proposal.againstVotes),
          state: stateNames[Number(state)] || 'Unknown',
          executed: proposal.executed
        });
      }

      return {
        success: true,
        proposals,
        totalProposals: proposals.length
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get voting power for address
   * GET /api/blockchain/governance/voting-power/:address
   */
  @Get('voting-power/:address')
  async getVotingPower(@Param('address') address: string) {
    try {
      if (!ethers.isAddress(address)) {
        throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
      }

      const votingPower = await this.contractsService.readContract(
        'MNBGovernance',
        'getVotingPower',
        [address]
      );

      return {
        success: true,
        address,
        votingPower: ethers.formatEther(votingPower),
        votingPowerWei: votingPower.toString()
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Check if address has voted
   * GET /api/blockchain/governance/has-voted/:proposalId/:address
   */
  @Get('has-voted/:proposalId/:address')
  async hasVoted(
    @Param('proposalId') proposalId: string,
    @Param('address') address: string
  ) {
    try {
      if (!ethers.isAddress(address)) {
        throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
      }

      const hasVoted = await this.contractsService.readContract(
        'MNBGovernance',
        'hasVoted',
        [proposalId, address]
      );

      return {
        success: true,
        proposalId,
        address,
        hasVoted
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

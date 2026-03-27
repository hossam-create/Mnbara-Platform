# Blockchain Escrow (Smart Contract)

This folder contains the **integrated** Solidity escrow contract from `docs/external-projects/SmartContractEscrowSystem`. It is part of the Mnbara platform for optional crypto/blockchain escrow.

## Contract: EscrowContract.sol

- **createTransaction** – Buyer creates escrow with seller and arbitrator addresses, sends ETH.
- **addSignature** – Buyer, seller, or arbitrator add their signature.
- **lockTransaction** – Buyer locks after seller signed; sets dispute deadline.
- **releaseTransaction** – Buyer releases funds to seller.
- **initiateDispute** – Buyer initiates dispute (arbitrator must have signed).
- **resolveDispute** – Arbitrator resolves (buyer or seller wins).
- **getTransactionStatus** – Returns Created | Locked | Released | Dispute.

## Integration

- The **fiat escrow** flow is implemented in the parent `escrow-service` (TypeScript + PostgreSQL).
- This contract is for **crypto escrow** when the platform supports blockchain payments. Deploy to your EVM chain (e.g. testnet/mainnet) and have `crypto-service` or escrow-service call it via Web3/ethers.

## Build / Deploy

Use Hardhat or Foundry in this directory, or from the repo root. Example (Hardhat):

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network <network>
```

Set `ESCROW_CONTRACT_ADDRESS` and RPC URL in env when integrating with the backend.

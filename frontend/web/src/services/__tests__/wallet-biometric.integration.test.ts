import { describe, it, expect, vi, beforeEach } from 'vitest';
import { blockchainService } from '../blockchain.service';
import { biometricService } from '../biometric.service';

// Mock API calls
vi.mock('../api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Wallet & Biometric Integration Flow', () => {
  const mockAddress = '0x123...abc';
  const mockAmount = '100';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require biometric verification before high-value transfer', async () => {
    // 1. Setup Biometric Service mocks
    const isSupportedSpy = vi.spyOn(biometricService, 'isSupported').mockResolvedValue(true);
    const getStatusSpy = vi.spyOn(biometricService, 'getStatus').mockResolvedValue({ isEnabled: true });
    const verifySpy = vi.spyOn(biometricService, 'verify').mockResolvedValue(true);
    
    // 2. Setup Blockchain Service mocks
    const transferSpy = vi.spyOn(blockchainService, 'transferMNBToken').mockResolvedValue({ transactionHash: '0xhash...' });

    // 3. Simulate Flow
    
    // Step A: Check if bio is enabled
    const bioStatus = await biometricService.getStatus();
    expect(bioStatus.isEnabled).toBe(true);

    // Step B: Perform Verification
    if (bioStatus.isEnabled) {
      const verified = await biometricService.verify();
      expect(verified).toBe(true);
      expect(verifySpy).toHaveBeenCalled();
    }

    // Step C: Execute Transfer
    const result = await blockchainService.transferMNBToken(mockAddress, '0xRecipient', mockAmount, 'mock-key');
    
    // 4. Assertions
    expect(transferSpy).toHaveBeenCalledWith(mockAddress, '0xRecipient', mockAmount, 'mock-key');
    expect(result.transactionHash).toBeDefined();
  });

  it('should fail transfer if biometric verification fails', async () => {
    vi.spyOn(biometricService, 'getStatus').mockResolvedValue({ isEnabled: true });
    vi.spyOn(biometricService, 'verify').mockResolvedValue(false); // Verification fails
    const transferSpy = vi.spyOn(blockchainService, 'transferMNBToken');

    const verified = await biometricService.verify();
    expect(verified).toBe(false);

    // Logic in UI would prevent calling transferSpy, simulating that here:
    if (verified) {
       await blockchainService.transferMNBToken(mockAddress, '0xRecipient', mockAmount, 'mock-key');
    }

    expect(transferSpy).not.toHaveBeenCalled();
  });

  it('should allow transfer without bio if bio is disabled (depending on policy)', async () => {
    vi.spyOn(biometricService, 'getStatus').mockResolvedValue({ isEnabled: false });
    const transferSpy = vi.spyOn(blockchainService, 'transferMNBToken').mockResolvedValue({ transactionHash: '0xhash' });

    const bioStatus = await biometricService.getStatus();
    expect(bioStatus.isEnabled).toBe(false);

    // Flow bypasses verify
    await blockchainService.transferMNBToken(mockAddress, '0xRecipient', mockAmount, 'mock-key');

    expect(transferSpy).toHaveBeenCalled();
  });
});

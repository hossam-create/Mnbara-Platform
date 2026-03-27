export const MNBTokenABI = [
  'function mintWithReference(address to, uint256 amount, string memory ref) external',
  'function burnWithReference(address from, uint256 amount, string memory ref) external',
  'function updateKYCTier(address account, uint256 newTier) external',
  'function balanceOf(address account) external view returns (uint256)',
  'function kycTiers(address account) external view returns (uint256)',
  'function frozenAccounts(address account) external view returns (bool)',
  'function freezeAccount(address account) external',
  'function unfreezeAccount(address account) external',
  'function decimals() external view returns (uint8)',
  'event MintedWithReference(address indexed to, uint256 amount, string ref)',
  'event BurnedWithReference(address indexed from, uint256 amount, string ref)',
  'event KYCTierUpdated(address indexed account, uint256 tier)'
];

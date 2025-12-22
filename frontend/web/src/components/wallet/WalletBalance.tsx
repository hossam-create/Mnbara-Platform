import React, { useState, useEffect } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { blockchainService } from '../../services/blockchain';
import { biometricService } from '../../services/biometric.service';

export const WalletBalance: React.FC = () => {
    const { verifyIdentity } = useSecurity();
    const [balance, setBalance] = useState<string>('0');
    const [kycTier, setKycTier] = useState<number>(0);
    const [address, setAddress] = useState<string>('0x...'); // Should come from WalletContext/Metamask
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Mocking address fetch - in reality, use useWallet() or window.ethereum
        const mockAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
        setAddress(mockAddress);
        loadData(mockAddress);
    }, []);

    const loadData = async (addr: string) => {
        try {
            const bal = await blockchainService.getBalance(addr);
            const tier = await blockchainService.getKYCTier(addr);
            setBalance(bal);
            setKycTier(tier);
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpgradeKYC = async () => {
        setLoading(true);
        try {
            setMessage('Processing Biometric Verification...');
            const result = await biometricService.verifyAndUpgradeKYC(address);
            if (result.kycUpgraded) {
                setMessage('✅ Identity Verified & KYC Upgraded!');
                loadData(address); // Refresh data
            } else {
                setMessage('⚠️ Verification passed but KYC upgrade pending/failed.');
            }
        } catch (e) {
            setMessage('❌ Verification Failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-900 text-white rounded-lg shadow-xl max-w-md mx-auto my-10 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
                <span className="mr-2">💰</span> MNB Wallet
            </h2>
            
            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-sm">Balance</p>
                <div className="text-3xl font-mono text-green-400">{balance} MNBT</div>
            </div>

            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-sm">KYC Tier</p>
                <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-blue-400">Level {kycTier}</div>
                    {kycTier < 2 && (
                        <button 
                            onClick={handleUpgradeKYC}
                            disabled={loading}
                            className={`px-4 py-2 rounded text-sm font-semibold transition
                                ${loading 
                                    ? 'bg-gray-600 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-500'}`}
                        >
                            {loading ? 'Verifying...' : '👆 Upgrade with Biometrics'}
                        </button>
                    )}
                    {kycTier >= 2 && <span className="text-green-500 text-sm">✅ Verified</span>}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    {kycTier === 0 && 'Basic limits. Upgrade for higher transactions.'}
                    {kycTier >= 2 && 'Enhanced limits unlocked.'}
                </p>
            </div>
            
            {message && (
                <div className={`p-3 rounded text-center text-sm ${message.includes('❌') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                    {message}
                </div>
            )}

            <div className="mt-4 border-t border-gray-700 pt-4">
                <p className="text-xs text-gray-600 break-all font-mono">
                    Wallet: {address}
                </p>
            </div>
        </div>
    );
};

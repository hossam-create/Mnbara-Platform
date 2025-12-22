/**
 * Wallet Screen - MNB Token & Fiat Wallet Management
 * Displays balances, transaction history, and wallet connection
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { walletService } from '../../services/api';
import { blockchainService, type WalletInfo, type MNBTransaction } from '../../services/blockchain';

// Types
interface WalletBalance {
  available: number;
  pending: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'reward';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  createdAt: string;
}

export const WalletScreen = () => {
  // Fiat wallet state
  const [fiatBalance, setFiatBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Blockchain wallet state
  const [blockchainWallet, setBlockchainWallet] = useState<WalletInfo | null>(null);
  const [mnbTransactions, setMnbTransactions] = useState<MNBTransaction[]>([]);
  const [mnbPrice, setMnbPrice] = useState<number>(1.0);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'fiat' | 'crypto'>('fiat');
  const [isConnecting, setIsConnecting] = useState(false);

  // Load wallet data
  const loadWalletData = useCallback(async () => {
    try {
      // Load fiat wallet
      const balanceResponse = await walletService.getBalance();
      setFiatBalance(balanceResponse);

      const txResponse = await walletService.getTransactions({ limit: 10 });
      setTransactions(txResponse.transactions || []);

      // Load blockchain wallet
      const walletInfo = await blockchainService.getWalletInfo();
      setBlockchainWallet(walletInfo);

      if (walletInfo?.isConnected) {
        const mnbTxResponse = await blockchainService.getTransactions({ limit: 10 });
        setMnbTransactions(mnbTxResponse.transactions);
      }

      // Get MNB price
      const price = await blockchainService.getMNBPrice();
      setMnbPrice(price);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadWalletData();
  };

  // Connect blockchain wallet
  const handleConnectWallet = async () => {
    // For mobile, we'll use WalletConnect or deep link to MetaMask
    Alert.alert(
      'Connect Wallet',
      'Choose how to connect your wallet:',
      [
        {
          text: 'MetaMask',
          onPress: () => openMetaMask(),
        },
        {
          text: 'WalletConnect',
          onPress: () => Alert.alert('Coming Soon', 'WalletConnect support is coming soon.'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openMetaMask = async () => {
    const metamaskUrl = 'metamask://';
    const canOpen = await Linking.canOpenURL(metamaskUrl);
    
    if (canOpen) {
      setIsConnecting(true);
      // In production, this would use WalletConnect or MetaMask SDK
      // For now, we'll simulate the connection
      setTimeout(() => {
        setBlockchainWallet({
          address: '0x1234...5678',
          mnbBalance: '1000.00',
          ethBalance: '0.5',
          kycTier: 1,
          dailyLimit: '1000',
          isConnected: true,
        });
        setIsConnecting(false);
        Alert.alert('Success', 'Wallet connected successfully!');
      }, 2000);
    } else {
      Alert.alert(
        'MetaMask Not Installed',
        'Please install MetaMask to connect your wallet.',
        [
          {
            text: 'Install',
            onPress: () => Linking.openURL('https://metamask.io/download/'),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  // Disconnect wallet
  const handleDisconnectWallet = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await blockchainService.unlinkWallet();
            setBlockchainWallet(null);
            setMnbTransactions([]);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Format address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render transaction item
  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Text style={styles.transactionIconText}>
          {item.type === 'deposit' ? '↓' : item.type === 'withdrawal' ? '↑' : '•'}
        </Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        item.type === 'deposit' || item.type === 'refund' ? styles.positiveAmount : styles.negativeAmount,
      ]}>
        {item.type === 'deposit' || item.type === 'refund' ? '+' : '-'}
        {formatCurrency(item.amount, item.currency)}
      </Text>
    </View>
  );

  // Render MNB transaction item
  const renderMNBTransaction = ({ item }: { item: MNBTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, styles.mnbIcon]}>
        <Text style={styles.transactionIconText}>
          {item.type === 'receive' || item.type === 'reward' ? '↓' : '↑'}
        </Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>
          {item.description || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} MNB`}
        </Text>
        <Text style={styles.transactionDate}>{formatDate(item.timestamp)}</Text>
      </View>
      <View style={styles.transactionAmountContainer}>
        <Text style={[
          styles.transactionAmount,
          item.type === 'receive' || item.type === 'reward' ? styles.positiveAmount : styles.negativeAmount,
        ]}>
          {item.type === 'receive' || item.type === 'reward' ? '+' : '-'}
          {parseFloat(item.amount).toFixed(2)} MNBT
        </Text>
        <Text style={styles.transactionUsdValue}>
          ≈ {formatCurrency(parseFloat(item.amount) * mnbPrice)}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'fiat' && styles.activeTab]}
            onPress={() => setActiveTab('fiat')}
          >
            <Text style={[styles.tabText, activeTab === 'fiat' && styles.activeTabText]}>
              💵 Fiat Wallet
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'crypto' && styles.activeTab]}
            onPress={() => setActiveTab('crypto')}
          >
            <Text style={[styles.tabText, activeTab === 'crypto' && styles.activeTabText]}>
              🪙 MNB Token
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'fiat' ? (
          <>
            {/* Fiat Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>
                {formatCurrency(fiatBalance?.available || 0, fiatBalance?.currency)}
              </Text>
              {(fiatBalance?.pending || 0) > 0 && (
                <Text style={styles.pendingBalance}>
                  {formatCurrency(fiatBalance?.pending || 0)} pending
                </Text>
              )}
              <View style={styles.balanceActions}>
                <TouchableOpacity style={styles.balanceButton}>
                  <Text style={styles.balanceButtonText}>Add Funds</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.balanceButton, styles.secondaryButton]}>
                  <Text style={[styles.balanceButtonText, styles.secondaryButtonText]}>
                    Withdraw
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Fiat Transactions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              {transactions.length > 0 ? (
                <FlatList
                  data={transactions}
                  renderItem={renderTransaction}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  style={styles.transactionList}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No transactions yet</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            {/* MNB Token Card */}
            {blockchainWallet?.isConnected ? (
              <View style={styles.cryptoCard}>
                <View style={styles.cryptoHeader}>
                  <View>
                    <Text style={styles.cryptoLabel}>MNB Token Balance</Text>
                    <Text style={styles.cryptoBalance}>
                      {parseFloat(blockchainWallet.mnbBalance).toLocaleString()} MNBT
                    </Text>
                    <Text style={styles.cryptoUsdValue}>
                      ≈ {formatCurrency(parseFloat(blockchainWallet.mnbBalance) * mnbPrice)}
                    </Text>
                  </View>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceLabel}>MNB Price</Text>
                    <Text style={styles.priceValue}>{formatCurrency(mnbPrice)}</Text>
                  </View>
                </View>

                <View style={styles.walletInfo}>
                  <Text style={styles.walletLabel}>Connected Wallet</Text>
                  <Text style={styles.walletAddress}>
                    {formatAddress(blockchainWallet.address)}
                  </Text>
                </View>

                <View style={styles.cryptoActions}>
                  <TouchableOpacity style={styles.cryptoButton}>
                    <Text style={styles.cryptoButtonText}>Send</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cryptoButton}>
                    <Text style={styles.cryptoButtonText}>Receive</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cryptoButton, styles.disconnectButton]}
                    onPress={handleDisconnectWallet}
                  >
                    <Text style={[styles.cryptoButtonText, styles.disconnectButtonText]}>
                      Disconnect
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.connectCard}>
                <Text style={styles.connectTitle}>🔗 Connect Your Wallet</Text>
                <Text style={styles.connectDescription}>
                  Connect your crypto wallet to pay with MNB tokens and earn rewards.
                </Text>
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={handleConnectWallet}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.connectButtonText}>Connect Wallet</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* MNB Transactions */}
            {blockchainWallet?.isConnected && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>MNB Transactions</Text>
                {mnbTransactions.length > 0 ? (
                  <FlatList
                    data={mnbTransactions}
                    renderItem={renderMNBTransaction}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    style={styles.transactionList}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No MNB transactions yet</Text>
                  </View>
                )}
              </View>
            )}

            {/* KYC Tier Info */}
            {blockchainWallet?.isConnected && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Limits</Text>
                <View style={styles.limitsCard}>
                  <View style={styles.limitRow}>
                    <Text style={styles.limitLabel}>KYC Tier</Text>
                    <Text style={styles.limitValue}>
                      {['Not Verified', 'Basic', 'Enhanced', 'Full'][blockchainWallet.kycTier]}
                    </Text>
                  </View>
                  <View style={styles.limitRow}>
                    <Text style={styles.limitLabel}>Daily Limit</Text>
                    <Text style={styles.limitValue}>
                      {parseFloat(blockchainWallet.dailyLimit).toLocaleString()} MNBT
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
  },
  balanceCard: {
    backgroundColor: '#007AFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  pendingBalance: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  balanceButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
  },
  balanceButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#fff',
  },
  cryptoCard: {
    backgroundColor: '#5856D6',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
  },
  cryptoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cryptoLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  cryptoBalance: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  cryptoUsdValue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  priceTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  walletInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  walletLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'monospace',
  },
  cryptoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cryptoButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cryptoButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disconnectButton: {
    backgroundColor: 'rgba(255,59,48,0.3)',
  },
  disconnectButtonText: {
    color: '#FF3B30',
  },
  connectCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  connectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  connectDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
  },
  connectButton: {
    backgroundColor: '#5856D6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  transactionList: {
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mnbIcon: {
    backgroundColor: '#5856D6',
  },
  transactionIconText: {
    fontSize: 18,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionUsdValue: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  positiveAmount: {
    color: '#34C759',
  },
  negativeAmount: {
    color: '#FF3B30',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  limitsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  limitLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  limitValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});

export default WalletScreen;

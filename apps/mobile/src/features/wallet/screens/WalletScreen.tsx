// Wallet Screen
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchWallet, fetchTransactions, withdraw } from '../store/wallet.slice';
import { Transaction } from '../../domain/entities/wallet.entity';
import colors from '../../theme/colors';

// Simple Text component
const Text: React.FC<{ style?: any; children?: React.ReactNode }> = ({ style, children }) => (
  <>{children}</>
);

export const WalletScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { wallet, transactions, loading } = useSelector((state: RootState) => state.wallet);

  useEffect(() => {
    dispatch(fetchWallet());
    dispatch(fetchTransactions());
  }, [dispatch]);

  const handleWithdraw = () => {
    // Navigate to withdraw screen or show modal
  };

  const handleTopUp = () => {
    // Navigate to top-up screen
  };

  const handleTransactionPress = (transaction: Transaction) => {
    // Navigate to transaction details
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity onPress={() => handleTransactionPress(item)}>
      <View style={styles.transactionItem}>
        <View style={styles.transactionIcon}>
          <Text style={styles.transactionIconText}>
            {item.type === 'deposit' ? '↓' : item.type === 'withdrawal' ? '↑' : '$'}
          </Text>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType}>{item.type}</Text>
          <Text style={styles.transactionDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.amountText,
            item.type === 'deposit' || item.type === 'earning' ? styles.positive : styles.negative
          ]}>
            {item.type === 'withdrawal' || item.type === 'payment' ? '-' : '+'}${item.amount.toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          ${wallet?.availableBalance.toFixed(2) || '0.00'}
        </Text>
        
        <View style={styles.balanceDetails}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Pending</Text>
            <Text style={styles.balanceItemValue}>
              ${wallet?.pendingBalance.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleTopUp}>
            <Text style={styles.actionButtonText}>Top Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleWithdraw}>
            <Text style={styles.actionButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transaction History */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Transaction History</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading...</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.transactionList}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={() => {
                  dispatch(fetchWallet());
                  dispatch(fetchTransactions());
                }}
              />
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  balanceCard: {
    backgroundColor: colors.primary.main,
    margin: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
    marginTop: 8,
  },
  balanceDetails: {
    flexDirection: 'row',
    marginTop: 16,
  },
  balanceItem: {
    marginRight: 32,
  },
  balanceItemLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.7,
  },
  balanceItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  historySection: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  transactionList: {},
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  transactionDate: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  transactionAmount: {},
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  positive: {
    color: colors.success.main,
  },
  negative: {
    color: colors.error.main,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

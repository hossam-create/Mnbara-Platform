/**
 * Checkout Screen - Order Payment with MNB Token Support
 * Handles payment method selection including MNB cryptocurrency
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { blockchainService, type WalletInfo, type PaymentQuote } from '../../services/blockchain';
import { ordersService } from '../../services/api';

// Types
type PaymentMethod = 'card' | 'paypal' | 'wallet' | 'mnb';

interface OrderSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
}

type CheckoutRouteParams = {
  Checkout: {
    orderId?: string;
    orderSummary: OrderSummary;
  };
};

export const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CheckoutRouteParams, 'Checkout'>>();
  const { orderSummary } = route.params || {
    orderSummary: { subtotal: 0, shipping: 0, tax: 0, total: 0, currency: 'USD' },
  };

  // State
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [blockchainWallet, setBlockchainWallet] = useState<WalletInfo | null>(null);
  const [mnbQuote, setMnbQuote] = useState<PaymentQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Load wallet info
  const loadWalletInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const walletInfo = await blockchainService.getWalletInfo();
      setBlockchainWallet(walletInfo);

      if (walletInfo?.isConnected) {
        const quote = await blockchainService.getPaymentQuote(orderSummary.total);
        setMnbQuote(quote);
      }
    } catch (error) {
      console.error('Failed to load wallet info:', error);
    } finally {
      setIsLoading(false);
    }
  }, [orderSummary.total]);

  useEffect(() => {
    loadWalletInfo();
  }, [loadWalletInfo]);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Connect wallet
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      // Simulate wallet connection (in production, use WalletConnect or MetaMask SDK)
      await new Promise<void>(resolve => setTimeout(resolve, 2000));
      
      setBlockchainWallet({
        address: '0x1234...5678',
        mnbBalance: '1000.00',
        ethBalance: '0.5',
        kycTier: 1,
        dailyLimit: '1000',
        isConnected: true,
      });

      const quote = await blockchainService.getPaymentQuote(orderSummary.total);
      setMnbQuote(quote);
      
      Alert.alert('Success', 'Wallet connected successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Process payment
  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      if (selectedMethod === 'mnb') {
        if (!blockchainWallet?.isConnected) {
          Alert.alert('Error', 'Please connect your wallet first.');
          return;
        }

        if (!mnbQuote?.isValid) {
          Alert.alert('Error', 'Unable to process MNB payment. Please try another method.');
          return;
        }

        const mnbBalance = parseFloat(blockchainWallet.mnbBalance);
        const mnbRequired = parseFloat(mnbQuote.mnbAmount);

        if (mnbBalance < mnbRequired) {
          Alert.alert(
            'Insufficient Balance',
            `You need ${mnbRequired.toFixed(2)} MNBT but only have ${mnbBalance.toFixed(2)} MNBT.`
          );
          return;
        }

        // Process MNB payment
        const result = await blockchainService.processPayment(
          route.params?.orderId || 'new-order',
          orderSummary.total
        );

        if (result.success) {
          Alert.alert(
            'Payment Successful',
            `Transaction hash: ${result.transactionHash?.slice(0, 10)}...`,
            [
              {
                text: 'View Order',
                onPress: () => {
                  // Navigate to order detail
                  navigation.goBack();
                },
              },
            ]
          );
        } else {
          Alert.alert('Payment Failed', result.error || 'Please try again.');
        }
      } else {
        // Handle other payment methods
        Alert.alert('Processing', `Processing ${selectedMethod} payment...`);
        // In production, integrate with Stripe/PayPal SDKs
      }
    } catch (error) {
      Alert.alert('Error', 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Payment method options
  const paymentMethods = [
    {
      id: 'card' as PaymentMethod,
      name: 'Credit/Debit Card',
      icon: '💳',
      description: 'Visa, Mastercard, Amex',
    },
    {
      id: 'paypal' as PaymentMethod,
      name: 'PayPal',
      icon: '🅿️',
      description: 'Fast and secure',
    },
    {
      id: 'wallet' as PaymentMethod,
      name: 'Wallet Balance',
      icon: '💰',
      description: 'Use your MNBARA wallet',
    },
    {
      id: 'mnb' as PaymentMethod,
      name: 'MNB Token',
      icon: '🪙',
      description: 'Pay with cryptocurrency',
      badge: 'CRYPTO',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(orderSummary.subtotal, orderSummary.currency)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(orderSummary.shipping, orderSummary.currency)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(orderSummary.tax, orderSummary.currency)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(orderSummary.total, orderSummary.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.selectedMethod,
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <Text style={styles.methodIcon}>{method.icon}</Text>
              <View style={styles.methodInfo}>
                <View style={styles.methodHeader}>
                  <Text style={styles.methodName}>{method.name}</Text>
                  {method.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{method.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.methodDescription}>{method.description}</Text>
              </View>
              <View style={[
                styles.radio,
                selectedMethod === method.id && styles.radioSelected,
              ]}>
                {selectedMethod === method.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* MNB Payment Details */}
        {selectedMethod === 'mnb' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MNB Token Payment</Text>
            
            {blockchainWallet?.isConnected ? (
              <View style={styles.mnbCard}>
                <View style={styles.mnbHeader}>
                  <View>
                    <Text style={styles.mnbLabel}>Your Balance</Text>
                    <Text style={styles.mnbBalance}>
                      {parseFloat(blockchainWallet.mnbBalance).toLocaleString()} MNBT
                    </Text>
                  </View>
                  <View style={styles.connectedBadge}>
                    <Text style={styles.connectedText}>✓ Connected</Text>
                  </View>
                </View>

                {mnbQuote && (
                  <View style={styles.quoteContainer}>
                    <View style={styles.quoteRow}>
                      <Text style={styles.quoteLabel}>Order Total</Text>
                      <Text style={styles.quoteValue}>
                        {formatCurrency(orderSummary.total)}
                      </Text>
                    </View>
                    <View style={styles.quoteRow}>
                      <Text style={styles.quoteLabel}>MNB Price</Text>
                      <Text style={styles.quoteValue}>
                        {formatCurrency(mnbQuote.mnbPrice)} / MNBT
                      </Text>
                    </View>
                    <View style={[styles.quoteRow, styles.quoteTotal]}>
                      <Text style={styles.quoteTotalLabel}>You Pay</Text>
                      <Text style={styles.quoteTotalValue}>
                        {parseFloat(mnbQuote.mnbAmount).toFixed(4)} MNBT
                      </Text>
                    </View>
                  </View>
                )}

                {parseFloat(blockchainWallet.mnbBalance) < parseFloat(mnbQuote?.mnbAmount || '0') && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      ⚠️ Insufficient balance. You need{' '}
                      {(parseFloat(mnbQuote?.mnbAmount || '0') - parseFloat(blockchainWallet.mnbBalance)).toFixed(4)}{' '}
                      more MNBT.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.connectCard}>
                <Text style={styles.connectTitle}>Connect Your Wallet</Text>
                <Text style={styles.connectDescription}>
                  Connect your crypto wallet to pay with MNB tokens.
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
          </View>
        )}
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (isProcessing || (selectedMethod === 'mnb' && !blockchainWallet?.isConnected)) &&
              styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={isProcessing || (selectedMethod === 'mnb' && !blockchainWallet?.isConnected)}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>
              {selectedMethod === 'mnb' && mnbQuote
                ? `Pay ${parseFloat(mnbQuote.mnbAmount).toFixed(2)} MNBT`
                : `Pay ${formatCurrency(orderSummary.total)}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 16,
    color: '#000',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMethod: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  methodIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  methodDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#5856D6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  mnbCard: {
    backgroundColor: '#5856D6',
    borderRadius: 12,
    padding: 16,
  },
  mnbHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  mnbLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  mnbBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  connectedBadge: {
    backgroundColor: 'rgba(52,199,89,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  quoteContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  quoteLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  quoteValue: {
    fontSize: 14,
    color: '#fff',
  },
  quoteTotal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    marginTop: 8,
    paddingTop: 12,
  },
  quoteTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  quoteTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  warningBox: {
    backgroundColor: 'rgba(255,204,0,0.2)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#FFCC00',
  },
  connectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  connectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  connectDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: '#5856D6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  payButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CheckoutScreen;

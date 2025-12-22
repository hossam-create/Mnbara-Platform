/**
 * BidPanel - Bidding interface component for auctions
 * Requirements: 8.2, 8.3 - Quick-bid buttons, custom amount input, proxy bid
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface BidPanelProps {
  auctionId: string;
  currentBid: number;
  minIncrement: number;
  currency: string;
  isEnded: boolean;
  isHighestBidder: boolean;
  onPlaceBid: (amount: number) => Promise<void>;
  onSetProxyBid: (maxAmount: number) => Promise<void>;
}

export const BidPanel: React.FC<BidPanelProps> = ({
  currentBid,
  minIncrement,
  currency,
  isEnded,
  isHighestBidder,
  onPlaceBid,
  onSetProxyBid,
}) => {
  const [customAmount, setCustomAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [proxyAmount, setProxyAmount] = useState('');

  const minBid = currentBid + minIncrement;
  const quickBidAmounts = [
    minBid,
    minBid + minIncrement,
    minBid + minIncrement * 2,
  ];

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, [currency]);

  const handleQuickBid = async (amount: number) => {
    if (isSubmitting || isEnded) return;

    setIsSubmitting(true);
    try {
      await onPlaceBid(amount);
    } catch (error: any) {
      Alert.alert('Bid Failed', error.message || 'Failed to place bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomBid = async () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < minBid) {
      Alert.alert('Invalid Bid', `Minimum bid is ${formatPrice(minBid)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onPlaceBid(amount);
      setCustomAmount('');
    } catch (error: any) {
      Alert.alert('Bid Failed', error.message || 'Failed to place bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProxyBid = async () => {
    const amount = parseFloat(proxyAmount);
    if (isNaN(amount) || amount < minBid) {
      Alert.alert('Invalid Amount', `Minimum proxy bid is ${formatPrice(minBid)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSetProxyBid(amount);
      setShowProxyModal(false);
      setProxyAmount('');
      Alert.alert('Proxy Bid Set', `Your maximum bid of ${formatPrice(amount)} has been set`);
    } catch (error: any) {
      Alert.alert('Proxy Bid Failed', error.message || 'Failed to set proxy bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEnded) {
    return (
      <View style={styles.container}>
        <View style={styles.endedContainer}>
          <Text style={styles.endedText}>This auction has ended</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Current Bid Info */}
      <View style={styles.currentBidContainer}>
        <Text style={styles.currentBidLabel}>Current Bid</Text>
        <Text style={styles.currentBidValue}>{formatPrice(currentBid)}</Text>
        {isHighestBidder && (
          <View style={styles.highestBidderBadge}>
            <Text style={styles.highestBidderText}>You're winning!</Text>
          </View>
        )}
      </View>

      {/* Quick Bid Buttons */}
      <View style={styles.quickBidContainer}>
        <Text style={styles.sectionLabel}>Quick Bid</Text>
        <View style={styles.quickBidButtons}>
          {quickBidAmounts.map((amount, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickBidButton, isSubmitting && styles.buttonDisabled]}
              onPress={() => handleQuickBid(amount)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.quickBidButtonText}>{formatPrice(amount)}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom Bid Input */}
      <View style={styles.customBidContainer}>
        <Text style={styles.sectionLabel}>Custom Bid</Text>
        <View style={styles.customBidRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder={minBid.toString()}
              keyboardType="numeric"
              editable={!isSubmitting}
            />
          </View>
          <TouchableOpacity
            style={[styles.bidButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleCustomBid}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.bidButtonText}>Place Bid</Text>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.minBidHint}>Minimum bid: {formatPrice(minBid)}</Text>
      </View>

      {/* Proxy Bid Button */}
      <TouchableOpacity
        style={styles.proxyBidButton}
        onPress={() => setShowProxyModal(true)}
        disabled={isSubmitting}
      >
        <Text style={styles.proxyBidButtonText}>Set Proxy Bid</Text>
        <Text style={styles.proxyBidHint}>Auto-bid up to your max</Text>
      </TouchableOpacity>

      {/* Proxy Bid Modal */}
      <Modal
        visible={showProxyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProxyModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Proxy Bid</Text>
            <Text style={styles.modalDescription}>
              Enter your maximum bid. We'll automatically bid for you up to this amount.
            </Text>

            <View style={styles.modalInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.modalInput}
                value={proxyAmount}
                onChangeText={setProxyAmount}
                placeholder={minBid.toString()}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowProxyModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleProxyBid}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Set Proxy Bid</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentBidContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  currentBidLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  currentBidValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  highestBidderBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  highestBidderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  quickBidContainer: {
    marginBottom: 16,
  },
  quickBidButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBidButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickBidButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  customBidContainer: {
    marginBottom: 16,
  },
  customBidRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#8E8E93',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 12,
    color: '#000',
  },
  bidButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  bidButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  minBidHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  proxyBidButton: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  proxyBidButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  proxyBidHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  endedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  endedText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  modalInput: {
    flex: 1,
    fontSize: 24,
    paddingVertical: 16,
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default BidPanel;

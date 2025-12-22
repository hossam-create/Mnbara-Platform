import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useConsentStore } from '../../store/consentStore';

export const TermsOfServiceScreen = () => {
    const navigation = useNavigation<any>();
    const { acceptTermsOfService } = useConsentStore();
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

    const handleScroll = (event: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
        if (isCloseToBottom) {
            setHasScrolledToEnd(true);
        }
    };

    const handleAccept = () => {
        acceptTermsOfService();
        navigation.navigate('DataConsent');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Service</Text>
                <View style={styles.placeholder} />
            </View>
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '66%' }]} />
                </View>
                <Text style={styles.progressText}>Step 2 of 3</Text>
            </View>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                <Text style={styles.sectionTitle}>Terms of Service</Text>
                <Text style={styles.lastUpdated}>Last updated: December 2025</Text>

                <Text style={styles.paragraph}>
                    Welcome to MNBARA. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.
                </Text>

                <Text style={styles.subTitle}>1. Account Registration</Text>
                <Text style={styles.paragraph}>
                    To use certain features of our platform, you must register for an account. You agree to:
                </Text>
                <Text style={styles.bulletPoint}>• Provide accurate and complete information</Text>
                <Text style={styles.bulletPoint}>• Maintain the security of your account credentials</Text>
                <Text style={styles.bulletPoint}>• Notify us immediately of any unauthorized access</Text>
                <Text style={styles.bulletPoint}>• Be responsible for all activities under your account</Text>

                <Text style={styles.subTitle}>2. Marketplace Rules</Text>
                <Text style={styles.paragraph}>
                    As a user of our marketplace, you agree to:
                </Text>
                <Text style={styles.bulletPoint}>• List only items you have the right to sell</Text>
                <Text style={styles.bulletPoint}>• Provide accurate descriptions of items</Text>
                <Text style={styles.bulletPoint}>• Honor all completed transactions</Text>
                <Text style={styles.bulletPoint}>• Not engage in fraudulent or deceptive practices</Text>
                <Text style={styles.bulletPoint}>• Comply with all applicable laws and regulations</Text>

                <Text style={styles.subTitle}>3. Auction Rules</Text>
                <Text style={styles.paragraph}>
                    When participating in auctions:
                </Text>
                <Text style={styles.bulletPoint}>• All bids are binding commitments to purchase</Text>
                <Text style={styles.bulletPoint}>• Bid manipulation or shill bidding is prohibited</Text>
                <Text style={styles.bulletPoint}>• Winners must complete payment within 48 hours</Text>
                <Text style={styles.bulletPoint}>• Sellers must ship within the stated timeframe</Text>

                <Text style={styles.subTitle}>4. Crowdshipping Services</Text>
                <Text style={styles.paragraph}>
                    For travelers participating in crowdshipping:
                </Text>
                <Text style={styles.bulletPoint}>• Complete KYC verification is required</Text>
                <Text style={styles.bulletPoint}>• You must comply with all customs regulations</Text>
                <Text style={styles.bulletPoint}>• Delivery evidence must be provided</Text>
                <Text style={styles.bulletPoint}>• Escrow funds are released upon confirmed delivery</Text>

                <Text style={styles.subTitle}>5. Payments and Fees</Text>
                <Text style={styles.paragraph}>
                    MNBARA charges fees for certain services. All fees are disclosed before transactions. Payment processing is handled securely through our approved payment providers.
                </Text>

                <Text style={styles.subTitle}>6. Dispute Resolution</Text>
                <Text style={styles.paragraph}>
                    In case of disputes between buyers and sellers, MNBARA provides a resolution process. Our decisions in dispute cases are final and binding.
                </Text>

                <Text style={styles.subTitle}>7. Limitation of Liability</Text>
                <Text style={styles.paragraph}>
                    MNBARA is not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the fees you have paid to us.
                </Text>

                <View style={styles.scrollIndicator}>
                    <Text style={styles.scrollIndicatorText}>
                        {hasScrolledToEnd ? '✓ You have read the terms' : 'Scroll to read the full terms'}
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, !hasScrolledToEnd && styles.buttonDisabled]}
                    onPress={handleAccept}
                    disabled={!hasScrolledToEnd}
                >
                    <Text style={styles.buttonText}>I Accept</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 24,
        color: '#007AFF',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    placeholder: {
        width: 40,
    },
    progressContainer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#E5E5E5',
        borderRadius: 2,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    lastUpdated: {
        fontSize: 14,
        color: '#999',
        marginBottom: 24,
    },
    subTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginTop: 24,
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 15,
        color: '#444',
        lineHeight: 24,
        marginBottom: 12,
    },
    bulletPoint: {
        fontSize: 15,
        color: '#444',
        lineHeight: 24,
        marginLeft: 16,
        marginBottom: 4,
    },
    scrollIndicator: {
        alignItems: 'center',
        paddingVertical: 20,
        marginTop: 20,
    },
    scrollIndicatorText: {
        fontSize: 14,
        color: '#007AFF',
    },
    footer: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#B0D4F1',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useConsentStore } from '../../store/consentStore';

export const PrivacyPolicyScreen = () => {
    const navigation = useNavigation<any>();
    const { acceptPrivacyPolicy } = useConsentStore();
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

    const handleScroll = (event: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
        if (isCloseToBottom) {
            setHasScrolledToEnd(true);
        }
    };

    const handleAccept = () => {
        acceptPrivacyPolicy();
        navigation.navigate('TermsOfService');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={styles.placeholder} />
            </View>
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '33%' }]} />
                </View>
                <Text style={styles.progressText}>Step 1 of 3</Text>
            </View>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                <Text style={styles.sectionTitle}>Privacy Policy</Text>
                <Text style={styles.lastUpdated}>Last updated: December 2025</Text>

                <Text style={styles.paragraph}>
                    At MNBARA, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our marketplace platform.
                </Text>

                <Text style={styles.subTitle}>1. Information We Collect</Text>
                <Text style={styles.paragraph}>
                    We collect information you provide directly to us, such as when you create an account, make a purchase, list an item for sale, or contact us for support. This may include:
                </Text>
                <Text style={styles.bulletPoint}>• Name and contact information</Text>
                <Text style={styles.bulletPoint}>• Payment and billing information</Text>
                <Text style={styles.bulletPoint}>• Identity verification documents (for KYC)</Text>
                <Text style={styles.bulletPoint}>• Location data for delivery services</Text>
                <Text style={styles.bulletPoint}>• Communication preferences</Text>

                <Text style={styles.subTitle}>2. How We Use Your Information</Text>
                <Text style={styles.paragraph}>
                    We use the information we collect to:
                </Text>
                <Text style={styles.bulletPoint}>• Process transactions and send related information</Text>
                <Text style={styles.bulletPoint}>• Verify your identity and prevent fraud</Text>
                <Text style={styles.bulletPoint}>• Provide customer support</Text>
                <Text style={styles.bulletPoint}>• Send promotional communications (with your consent)</Text>
                <Text style={styles.bulletPoint}>• Improve our services and develop new features</Text>

                <Text style={styles.subTitle}>3. Information Sharing</Text>
                <Text style={styles.paragraph}>
                    We may share your information with third parties only in the following circumstances:
                </Text>
                <Text style={styles.bulletPoint}>• With your consent</Text>
                <Text style={styles.bulletPoint}>• To complete transactions you have requested</Text>
                <Text style={styles.bulletPoint}>• With service providers who assist our operations</Text>
                <Text style={styles.bulletPoint}>• To comply with legal obligations</Text>

                <Text style={styles.subTitle}>4. Data Security</Text>
                <Text style={styles.paragraph}>
                    We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                </Text>

                <Text style={styles.subTitle}>5. Your Rights</Text>
                <Text style={styles.paragraph}>
                    You have the right to access, correct, or delete your personal information. You may also object to or restrict certain processing of your data. Contact us to exercise these rights.
                </Text>

                <View style={styles.scrollIndicator}>
                    <Text style={styles.scrollIndicatorText}>
                        {hasScrolledToEnd ? '✓ You have read the policy' : 'Scroll to read the full policy'}
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

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useConsentStore } from '../../store/consentStore';

interface ConsentItemProps {
    title: string;
    description: string;
    required?: boolean;
    value: boolean;
    onValueChange: (value: boolean) => void;
}

const ConsentItem = ({ title, description, required, value, onValueChange }: ConsentItemProps) => (
    <View style={styles.consentItem}>
        <View style={styles.consentContent}>
            <View style={styles.consentHeader}>
                <Text style={styles.consentTitle}>{title}</Text>
                {required && <Text style={styles.requiredBadge}>Required</Text>}
            </View>
            <Text style={styles.consentDescription}>{description}</Text>
        </View>
        <Switch
            value={value}
            onValueChange={onValueChange}
            disabled={required}
            trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
            thumbColor={value ? '#fff' : '#fff'}
        />
    </View>
);

export const DataConsentScreen = () => {
    const navigation = useNavigation<any>();
    const { acceptDataCollection, acceptMarketingConsent, completeOnboarding } = useConsentStore();
    
    const [dataCollection, setDataCollection] = useState(true);
    const [analytics, setAnalytics] = useState(true);
    const [marketing, setMarketing] = useState(false);
    const [personalization, setPersonalization] = useState(true);

    const handleComplete = () => {
        acceptDataCollection();
        acceptMarketingConsent(marketing);
        completeOnboarding();
        navigation.navigate('Welcome');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Data Preferences</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '100%' }]} />
                </View>
                <Text style={styles.progressText}>Step 3 of 3</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Data Collection Preferences</Text>
                <Text style={styles.subtitle}>
                    Choose how we can use your data to improve your experience. You can change these settings anytime in your profile.
                </Text>

                <View style={styles.consentList}>
                    <ConsentItem
                        title="Essential Data Collection"
                        description="Required for core platform functionality including account management, transactions, and security."
                        required={true}
                        value={dataCollection}
                        onValueChange={setDataCollection}
                    />

                    <ConsentItem
                        title="Analytics & Improvements"
                        description="Help us improve the platform by sharing anonymous usage data and crash reports."
                        value={analytics}
                        onValueChange={setAnalytics}
                    />

                    <ConsentItem
                        title="Personalized Experience"
                        description="Allow us to personalize your feed, recommendations, and search results based on your activity."
                        value={personalization}
                        onValueChange={setPersonalization}
                    />

                    <ConsentItem
                        title="Marketing Communications"
                        description="Receive promotional emails, special offers, and updates about new features."
                        value={marketing}
                        onValueChange={setMarketing}
                    />
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <Text style={styles.infoText}>
                        You can update these preferences at any time from your account settings. We respect your choices and will only use your data as you've permitted.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={handleComplete}>
                    <Text style={styles.buttonText}>Complete Setup</Text>
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
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
        marginBottom: 24,
    },
    consentList: {
        gap: 16,
    },
    consentItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    consentContent: {
        flex: 1,
        marginRight: 16,
    },
    consentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    consentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    requiredBadge: {
        fontSize: 11,
        color: '#007AFF',
        backgroundColor: '#E8F4FD',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    consentDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        marginTop: 24,
        gap: 12,
    },
    infoIcon: {
        fontSize: 16,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#666',
        lineHeight: 20,
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
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});

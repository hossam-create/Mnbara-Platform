import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const WelcomeScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Mnbara</Text>
            <Text style={styles.subtitle}>The Global Marketplace & Crowdshipping Platform</Text>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.primaryButtonText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.secondaryButtonText}>Create Account</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 50,
    },
    buttonContainer: {
        width: '100%',
        gap: 15,
    },
    button: {
        width: '100%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#007AFF',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

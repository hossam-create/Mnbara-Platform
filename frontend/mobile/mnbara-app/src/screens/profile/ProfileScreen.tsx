import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export const ProfileScreen = () => {
    const logout = useAuthStore((state) => state.logout);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>User Profile</Text>
            <TouchableOpacity style={styles.button} onPress={logout}>
                <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#FF3B30',
        padding: 10,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

// Create Trip Screen
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { createTrip } from '../store/trip.slice';
import { CreateTripRequest } from '../../domain/entities/trip.entity';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import colors from '../../theme/colors';

// Simple Text component
const Text: React.FC<{ style?: any; children?: React.ReactNode }> = ({ style, children }) => (
  <>{children}</>
);

export const CreateTripScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [originCity, setOriginCity] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const handleCreateTrip = async () => {
    setLoading(true);
    setError(null);

    try {
      const request: CreateTripRequest = {
        origin: {
          city: originCity,
          country: originCountry,
          latitude: 0,
          longitude: 0,
        },
        destination: {
          city: destinationCity,
          country: destinationCountry,
          latitude: 0,
          longitude: 0,
        },
        departureDate,
        arrivalDate,
        maxWeight: parseFloat(maxWeight) || 10,
        pricePerKg: parseFloat(pricePerKg) || 5,
        currency,
        description: description || undefined,
        notes: notes || undefined,
      };

      // @ts-ignore - Dispatch type mismatch due to missing types
      await dispatch(createTrip(request));
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create New Trip</Text>
        <Text style={styles.headerSubtitle}>
          Share your travel plans and earn money
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Origin */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Origin</Text>
        
        <Input
          label="City"
          value={originCity}
          onChangeText={setOriginCity}
          placeholder="Departure city"
        />
        <Input
          label="Country"
          value={originCountry}
          onChangeText={setOriginCountry}
          placeholder="Country"
        />
        <Input
          label="Departure Date"
          value={departureDate}
          onChangeText={setDepartureDate}
          placeholder="YYYY-MM-DD"
        />
      </Card>

      {/* Destination */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Destination</Text>
        
        <Input
          label="City"
          value={destinationCity}
          onChangeText={setDestinationCity}
          placeholder="Arrival city"
        />
        <Input
          label="Country"
          value={destinationCountry}
          onChangeText={setDestinationCountry}
          placeholder="Country"
        />
        <Input
          label="Arrival Date"
          value={arrivalDate}
          onChangeText={setArrivalDate}
          placeholder="YYYY-MM-DD"
        />
      </Card>

      {/* Capacity & Pricing */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Capacity & Pricing</Text>
        
        <Input
          label="Maximum Weight (kg)"
          value={maxWeight}
          onChangeText={setMaxWeight}
          placeholder="e.g., 20"
          keyboardType="numeric"
        />
        <Input
          label="Price per kg"
          value={pricePerKg}
          onChangeText={setPricePerKg}
          placeholder="e.g., 5.00"
          keyboardType="numeric"
        />
      </Card>

      {/* Additional Info */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Information</Text>
        
        <Input
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Tell travelers about your trip"
          multiline
          numberOfLines={3}
        />
        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any special instructions"
          multiline
          numberOfLines={2}
        />
      </Card>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Create Trip"
          onPress={handleCreateTrip}
          loading={loading}
          disabled={!originCity || !destinationCity || !departureDate}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    padding: 16,
    backgroundColor: colors.background.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  section: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  buttonContainer: {
    padding: 16,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: colors.error.light,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.error.dark,
  },
});

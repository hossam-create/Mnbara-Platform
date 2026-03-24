// Create Delivery Screen
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { createDelivery } from '../store/delivery.slice';
import { CreateDeliveryRequest, PackageSize } from '../../domain/entities/delivery.entity';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import colors from '../../theme/colors';

export const CreateDeliveryScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupCountry, setPickupCountry] = useState('');
  const [pickupPostalCode, setPickupPostalCode] = useState('');
  
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffCity, setDropoffCity] = useState('');
  const [dropoffCountry, setDropoffCountry] = useState('');
  const [dropoffPostalCode, setDropoffPostalCode] = useState('');
  
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  
  const [packageDescription, setPackageDescription] = useState('');
  const [packageSize, setPackageSize] = useState<PackageSize>('medium');
  const [packageWeight, setPackageWeight] = useState('');
  const [packageFragile, setPackageFragile] = useState(false);
  const [handlingInstructions, setHandlingInstructions] = useState('');

  const handleCreateDelivery = async () => {
    setLoading(true);
    setError(null);

    try {
      const request: CreateDeliveryRequest = {
        pickup: {
          address: pickupAddress,
          city: pickupCity,
          country: pickupCountry,
          postalCode: pickupPostalCode,
          latitude: 0,
          longitude: 0,
        },
        pickupDate,
        pickupTimeWindow: {
          start: '09:00',
          end: '18:00',
        },
        dropoff: {
          address: dropoffAddress,
          city: dropoffCity,
          country: dropoffCountry,
          postalCode: dropoffPostalCode,
          latitude: 0,
          longitude: 0,
        },
        deliveryDate,
        deliveryTimeWindow: {
          start: '09:00',
          end: '18:00',
        },
        package: {
          description: packageDescription,
          size: packageSize,
          weight: parseFloat(packageWeight) || 0,
          fragile: packageFragile,
          handlingInstructions: handlingInstructions || undefined,
        },
      };

      // @ts-ignore - Dispatch type mismatch due to missing types
      await dispatch(createDelivery(request));
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPickupLocation = () => {
    // Open map/location picker
  };

  const handleSelectDropoffLocation = () => {
    // Open map/location picker
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create New Delivery</Text>
        <Text style={styles.headerSubtitle}>
          Fill in the details to request a delivery
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Pickup Location */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Pickup Location</Text>
        
        <TouchableOpacity onPress={handleSelectPickupLocation} style={styles.locationButton}>
          <Text style={styles.locationButtonText}>📍 Select Pickup Location on Map</Text>
        </TouchableOpacity>

        <Input
          label="Address"
          value={pickupAddress}
          onChangeText={setPickupAddress}
          placeholder="Enter pickup address"
        />
        <View style={styles.row}>
          <Input
            label="City"
            value={pickupCity}
            onChangeText={setPickupCity}
            placeholder="City"
            style={styles.halfWidth}
          />
          <Input
            label="Country"
            value={pickupCountry}
            onChangeText={setPickupCountry}
            placeholder="Country"
            style={styles.halfWidth}
          />
        </View>
        <Input
          label="Postal Code"
          value={pickupPostalCode}
          onChangeText={setPickupPostalCode}
          placeholder="Postal code"
        />
        <Input
          label="Pickup Date"
          value={pickupDate}
          onChangeText={setPickupDate}
          placeholder="YYYY-MM-DD"
        />
      </Card>

      {/* Dropoff Location */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Dropoff Location</Text>
        
        <TouchableOpacity onPress={handleSelectDropoffLocation} style={styles.locationButton}>
          <Text style={styles.locationButtonText}>📍 Select Dropoff Location on Map</Text>
        </TouchableOpacity>

        <Input
          label="Address"
          value={dropoffAddress}
          onChangeText={setDropoffAddress}
          placeholder="Enter dropoff address"
        />
        <View style={styles.row}>
          <Input
            label="City"
            value={dropoffCity}
            onChangeText={setDropoffCity}
            placeholder="City"
            style={styles.halfWidth}
          />
          <Input
            label="Country"
            value={dropoffCountry}
            onChangeText={setDropoffCountry}
            placeholder="Country"
            style={styles.halfWidth}
          />
        </View>
        <Input
          label="Postal Code"
          value={dropoffPostalCode}
          onChangeText={setDropoffPostalCode}
          placeholder="Postal code"
        />
        <Input
          label="Delivery Date"
          value={deliveryDate}
          onChangeText={setDeliveryDate}
          placeholder="YYYY-MM-DD"
        />
      </Card>

      {/* Package Details */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Package Details</Text>
        
        <Input
          label="Description"
          value={packageDescription}
          onChangeText={setPackageDescription}
          placeholder="Describe your package"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Package Size</Text>
        <View style={styles.sizeButtons}>
          {(['small', 'medium', 'large', 'xlarge'] as PackageSize[]).map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeButton,
                packageSize === size && styles.sizeButtonActive,
              ]}
              onPress={() => setPackageSize(size)}
            >
              <Text
                style={[
                  styles.sizeButtonText,
                  packageSize === size && styles.sizeButtonTextActive,
                ]}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Weight (kg)"
          value={packageWeight}
          onChangeText={setPackageWeight}
          placeholder="Package weight in kg"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setPackageFragile(!packageFragile)}
        >
          <View style={[styles.checkboxBox, packageFragile && styles.checkboxBoxChecked]}>
            {packageFragile && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Package is fragile</Text>
        </TouchableOpacity>

        <Input
          label="Handling Instructions (optional)"
          value={handlingInstructions}
          onChangeText={setHandlingInstructions}
          placeholder="Special handling instructions"
          multiline
          numberOfLines={2}
        />
      </Card>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Create Delivery"
          onPress={handleCreateDelivery}
          loading={loading}
          disabled={!pickupAddress || !dropoffAddress || !packageDescription}
        />
      </View>
    </ScrollView>
  );
};

// Simple Text component
const Text: React.FC<{ style?: any; children?: React.ReactNode }> = ({
  style,
  children,
}) => <>{children}</>;

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
  locationButton: {
    backgroundColor: colors.primary.light,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  locationButtonText: {
    color: colors.primary.dark,
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  halfWidth: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  sizeButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sizeButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  sizeButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  sizeButtonText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  sizeButtonTextActive: {
    color: colors.white,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border.main,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: 12,
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

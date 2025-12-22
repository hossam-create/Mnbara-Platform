/**
 * CreateTripScreen - Form for creating a new trip
 * Includes date pickers for departure/arrival and location search for origin/destination
 * Requirements: 9.1, 11.1, 11.2
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTravelerStore } from '../../store/travelerStore';

// Location suggestion type
interface LocationSuggestion {
  id: string;
  name: string;
  fullName: string;
  country: string;
}

// Mock location suggestions - in production, this would call a geocoding API
const MOCK_LOCATIONS: LocationSuggestion[] = [
  { id: '1', name: 'New York', fullName: 'New York, NY', country: 'USA' },
  { id: '2', name: 'Los Angeles', fullName: 'Los Angeles, CA', country: 'USA' },
  { id: '3', name: 'Chicago', fullName: 'Chicago, IL', country: 'USA' },
  { id: '4', name: 'Houston', fullName: 'Houston, TX', country: 'USA' },
  { id: '5', name: 'Miami', fullName: 'Miami, FL', country: 'USA' },
  { id: '6', name: 'London', fullName: 'London', country: 'UK' },
  { id: '7', name: 'Paris', fullName: 'Paris', country: 'France' },
  { id: '8', name: 'Tokyo', fullName: 'Tokyo', country: 'Japan' },
  { id: '9', name: 'Dubai', fullName: 'Dubai', country: 'UAE' },
  { id: '10', name: 'Cairo', fullName: 'Cairo', country: 'Egypt' },
  { id: '11', name: 'Sydney', fullName: 'Sydney', country: 'Australia' },
  { id: '12', name: 'Toronto', fullName: 'Toronto', country: 'Canada' },
];

// Simple Date Picker Component
const DatePickerModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate: Date;
  minimumDate?: Date;
  title: string;
}> = ({ visible, onClose, onSelect, selectedDate, minimumDate, title }) => {
  const [tempDate, setTempDate] = useState(selectedDate);
  const [year, setYear] = useState(selectedDate.getFullYear().toString());
  const [month, setMonth] = useState((selectedDate.getMonth() + 1).toString().padStart(2, '0'));
  const [day, setDay] = useState(selectedDate.getDate().toString().padStart(2, '0'));

  const handleConfirm = () => {
    const newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (minimumDate && newDate < minimumDate) {
      Alert.alert('Invalid Date', 'Please select a date in the future');
      return;
    }
    onSelect(newDate);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.datePickerModal}>
          <Text style={styles.datePickerTitle}>{title}</Text>
          
          <View style={styles.dateInputRow}>
            <View style={styles.dateInputGroup}>
              <Text style={styles.dateInputLabel}>Year</Text>
              <TextInput
                style={styles.dateInput}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <View style={styles.dateInputGroup}>
              <Text style={styles.dateInputLabel}>Month</Text>
              <TextInput
                style={styles.dateInput}
                value={month}
                onChangeText={setMonth}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <View style={styles.dateInputGroup}>
              <Text style={styles.dateInputLabel}>Day</Text>
              <TextInput
                style={styles.dateInput}
                value={day}
                onChangeText={setDay}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.datePickerButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Location Search Modal
const LocationSearchModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelect: (location: string) => void;
  title: string;
}> = ({ visible, onClose, onSelect, title }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    // Filter mock locations - in production, call geocoding API
    const filtered = MOCK_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(query.toLowerCase()) ||
        loc.fullName.toLowerCase().includes(query.toLowerCase()) ||
        loc.country.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(filtered);
  }, []);

  const handleSelectLocation = (location: LocationSuggestion) => {
    onSelect(location.fullName);
    setSearchQuery('');
    setSuggestions([]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.locationModal}>
          <View style={styles.locationModalHeader}>
            <Text style={styles.locationModalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.locationSearchInput}
            placeholder="Search for a city..."
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />

          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.locationItem}
                onPress={() => handleSelectLocation(item)}
              >
                <Text style={styles.locationName}>{item.name}</Text>
                <Text style={styles.locationCountry}>{item.country}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchQuery.length >= 2 ? (
                <Text style={styles.noResults}>No locations found</Text>
              ) : (
                <Text style={styles.searchHint}>Type at least 2 characters to search</Text>
              )
            }
            style={styles.locationList}
          />
        </View>
      </View>
    </Modal>
  );
};

export const CreateTripScreen = () => {
  const navigation = useNavigation();
  const { createTrip, error, clearError } = useTravelerStore();

  // Form state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState<Date>(new Date());
  const [arrivalDate, setArrivalDate] = useState<Date>(
    new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
  );
  const [capacity, setCapacity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [showOriginSearch, setShowOriginSearch] = useState(false);
  const [showDestinationSearch, setShowDestinationSearch] = useState(false);
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const validateForm = (): boolean => {
    if (!origin.trim()) {
      Alert.alert('Validation Error', 'Please select an origin city');
      return false;
    }
    if (!destination.trim()) {
      Alert.alert('Validation Error', 'Please select a destination city');
      return false;
    }
    if (origin.trim() === destination.trim()) {
      Alert.alert('Validation Error', 'Origin and destination must be different');
      return false;
    }
    if (departureDate < new Date()) {
      Alert.alert('Validation Error', 'Departure date must be in the future');
      return false;
    }
    if (arrivalDate <= departureDate) {
      Alert.alert('Validation Error', 'Arrival date must be after departure date');
      return false;
    }
    const capacityNum = parseFloat(capacity);
    if (!capacity || isNaN(capacityNum) || capacityNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid capacity (greater than 0)');
      return false;
    }
    if (capacityNum > 100) {
      Alert.alert('Validation Error', 'Maximum capacity is 100 kg');
      return false;
    }
    return true;
  };

  const handleCreateTrip = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    clearError();

    try {
      await createTrip({
        origin: origin.trim(),
        destination: destination.trim(),
        departAt: departureDate.toISOString(),
        arriveAt: arrivalDate.toISOString(),
        capacityKg: parseFloat(capacity),
      });

      Alert.alert('Success', 'Trip created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create trip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            {/* Origin */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Origin</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowOriginSearch(true)}
              >
                <Text style={origin ? styles.selectInputText : styles.selectInputPlaceholder}>
                  {origin || 'Select departure city'}
                </Text>
                <Text style={styles.selectIcon}>📍</Text>
              </TouchableOpacity>
            </View>

            {/* Destination */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Destination</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowDestinationSearch(true)}
              >
                <Text style={destination ? styles.selectInputText : styles.selectInputPlaceholder}>
                  {destination || 'Select arrival city'}
                </Text>
                <Text style={styles.selectIcon}>📍</Text>
              </TouchableOpacity>
            </View>

            {/* Departure Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Departure Date</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowDeparturePicker(true)}
              >
                <Text style={styles.selectInputText}>{formatDate(departureDate)}</Text>
                <Text style={styles.selectIcon}>📅</Text>
              </TouchableOpacity>
            </View>

            {/* Arrival Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Arrival Date</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowArrivalPicker(true)}
              >
                <Text style={styles.selectInputText}>{formatDate(arrivalDate)}</Text>
                <Text style={styles.selectIcon}>📅</Text>
              </TouchableOpacity>
            </View>

            {/* Capacity */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Available Capacity (kg)</Text>
              <View style={styles.capacityInputContainer}>
                <TextInput
                  style={styles.capacityInput}
                  placeholder="0"
                  value={capacity}
                  onChangeText={setCapacity}
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
                <Text style={styles.capacityUnit}>kg</Text>
              </View>
              <Text style={styles.helperText}>
                How much extra luggage space do you have available?
              </Text>
            </View>

            {/* Trip Summary */}
            {origin && destination && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Trip Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Route:</Text>
                  <Text style={styles.summaryValue}>
                    {origin} → {destination}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Duration:</Text>
                  <Text style={styles.summaryValue}>
                    {Math.ceil(
                      (arrivalDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24)
                    )}{' '}
                    days
                  </Text>
                </View>
                {capacity && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Capacity:</Text>
                    <Text style={styles.summaryValue}>{capacity} kg</Text>
                  </View>
                )}
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleCreateTrip}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Create Trip</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      <LocationSearchModal
        visible={showOriginSearch}
        onClose={() => setShowOriginSearch(false)}
        onSelect={setOrigin}
        title="Select Origin"
      />

      <LocationSearchModal
        visible={showDestinationSearch}
        onClose={() => setShowDestinationSearch(false)}
        onSelect={setDestination}
        title="Select Destination"
      />

      <DatePickerModal
        visible={showDeparturePicker}
        onClose={() => setShowDeparturePicker(false)}
        onSelect={(date) => {
          setDepartureDate(date);
          // Auto-adjust arrival date if needed
          if (arrivalDate <= date) {
            setArrivalDate(new Date(date.getTime() + 24 * 60 * 60 * 1000));
          }
        }}
        selectedDate={departureDate}
        minimumDate={new Date()}
        title="Select Departure Date"
      />

      <DatePickerModal
        visible={showArrivalPicker}
        onClose={() => setShowArrivalPicker(false)}
        onSelect={setArrivalDate}
        selectedDate={arrivalDate}
        minimumDate={departureDate}
        title="Select Arrival Date"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  selectInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectInputText: {
    fontSize: 16,
    color: '#000',
  },
  selectInputPlaceholder: {
    fontSize: 16,
    color: '#8E8E93',
  },
  selectIcon: {
    fontSize: 18,
  },
  capacityInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingRight: 14,
  },
  capacityInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  capacityUnit: {
    fontSize: 16,
    color: '#8E8E93',
  },
  helperText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#007AFF80',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateInputGroup: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
  },
  datePickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  locationModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    padding: 20,
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 20,
    color: '#8E8E93',
    padding: 4,
  },
  locationSearchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  locationList: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  locationName: {
    fontSize: 16,
    color: '#000',
  },
  locationCountry: {
    fontSize: 14,
    color: '#8E8E93',
  },
  noResults: {
    textAlign: 'center',
    color: '#8E8E93',
    padding: 20,
  },
  searchHint: {
    textAlign: 'center',
    color: '#8E8E93',
    padding: 20,
  },
});

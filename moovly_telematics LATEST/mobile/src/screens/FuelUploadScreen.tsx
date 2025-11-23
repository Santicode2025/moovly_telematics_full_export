import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, Card, Badge } from 'react-native-paper';
import { Camera, CameraType } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/ApiService';

interface FuelEntry {
  litres: string;
  cost: string;
  odometerReading: string;
  odometerPhoto: string | null;
  fuelSlipPhoto: string | null;
  pumpStationPhoto: string | null;
  location?: string;
}

export default function FuelUploadScreen({ navigation }: any) {
  const [fuelEntry, setFuelEntry] = useState<FuelEntry>({
    litres: '',
    cost: '',
    odometerReading: '',
    odometerPhoto: null,
    fuelSlipPhoto: null,
    pumpStationPhoto: null,
  });
  
  const [showCamera, setShowCamera] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<'odometer' | 'fuelSlip' | 'pumpStation' | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const { user } = useAuth();

  React.useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
    setCameraPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
  };

  const capturePhoto = async (photoType: 'odometer' | 'fuelSlip' | 'pumpStation') => {
    if (!cameraPermission) {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }

    setCurrentPhotoType(photoType);
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (cameraRef.current && currentPhotoType) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });

        // Save to device
        await MediaLibrary.saveToLibraryAsync(photo.uri);

        // Update state
        setFuelEntry(prev => ({
          ...prev,
          [`${currentPhotoType}Photo`]: photo.uri,
        }));

        setShowCamera(false);
        setCurrentPhotoType(null);

        Alert.alert('Photo Captured', 'Photo saved successfully!');
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const getPhotoTypeLabel = (type: string) => {
    switch (type) {
      case 'odometer': return 'Odometer Reading';
      case 'fuelSlip': return 'Fuel Slip/Receipt';
      case 'pumpStation': return 'Pump Station Sign';
      default: return '';
    }
  };

  const submitFuelEntry = async () => {
    // Validation
    if (!fuelEntry.litres || !fuelEntry.cost || !fuelEntry.odometerReading) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (!fuelEntry.odometerPhoto || !fuelEntry.fuelSlipPhoto || !fuelEntry.pumpStationPhoto) {
      Alert.alert('Missing Photos', 'All three photos are required.');
      return;
    }

    setSubmitting(true);

    try {
      const entryData = {
        ...fuelEntry,
        driverId: user?.id,
        vehicleId: user?.vehicleId,
        timestamp: new Date().toISOString(),
      };

      const response = await apiService.post('/api/fuel-entries', entryData);

      if (response.success) {
        Alert.alert(
          'Fuel Entry Submitted',
          'Your fuel entry has been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        // Save offline if network fails
        await apiService.saveOfflineData('fuel_entry', entryData);
        Alert.alert(
          'Saved Offline',
          'Network unavailable. Entry saved and will sync when connected.'
        );
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit fuel entry');
    } finally {
      setSubmitting(false);
    }
  };

  const renderPhotoSection = (
    photoType: 'odometer' | 'fuelSlip' | 'pumpStation',
    title: string,
    description: string
  ) => {
    const photoUri = fuelEntry[`${photoType}Photo` as keyof FuelEntry] as string | null;

    return (
      <Card style={styles.photoCard}>
        <Card.Content>
          <View style={styles.photoHeader}>
            <Text style={styles.photoTitle}>{title}</Text>
            <Badge style={styles.requiredBadge} size={18}>Required</Badge>
          </View>
          <Text style={styles.photoDescription}>{description}</Text>
          
          {photoUri ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
              <View style={styles.photoSuccess}>
                <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                <Text style={styles.photoSuccessText}>Photo captured</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.captureButton}
              onPress={() => capturePhoto(photoType)}
            >
              <Ionicons name="camera" size={32} color="#1e3a8a" />
              <Text style={styles.captureButtonText}>Take Photo</Text>
            </TouchableOpacity>
          )}

          {photoUri && (
            <Button 
              mode="outlined" 
              onPress={() => capturePhoto(photoType)}
              style={styles.retakeButton}
            >
              Retake Photo
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={CameraType.back}
        >
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraTitle}>
              {getPhotoTypeLabel(currentPhotoType || '')}
            </Text>
            <Text style={styles.cameraInstructions}>
              Position the {currentPhotoType} clearly in the frame
            </Text>
          </View>
          
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setShowCamera(false);
                setCurrentPhotoType(null);
              }}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.capturePhotoButton} onPress={takePicture}>
              <View style={styles.capturePhotoInner} />
            </TouchableOpacity>
            
            <View style={styles.placeholder} />
          </View>
        </Camera>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Fuel Entry</Text>
        <Text style={styles.headerSubtitle}>Complete all fields and capture required photos</Text>
      </View>

      {/* Fuel Details */}
      <Card style={styles.detailsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Fuel Details</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <TextInput
                label="Litres Filled"
                value={fuelEntry.litres}
                onChangeText={(text) => setFuelEntry(prev => ({ ...prev, litres: text }))}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Total Cost (ZAR)"
                value={fuelEntry.cost}
                onChangeText={(text) => setFuelEntry(prev => ({ ...prev, cost: text }))}
                mode="outlined"
                keyboardType="numeric"
                left={<TextInput.Affix text="R" />}
                style={styles.input}
              />
            </View>
          </View>

          <TextInput
            label="Odometer Reading"
            value={fuelEntry.odometerReading}
            onChangeText={(text) => setFuelEntry(prev => ({ ...prev, odometerReading: text }))}
            mode="outlined"
            keyboardType="numeric"
            right={<TextInput.Affix text="km" />}
            style={styles.fullWidthInput}
          />
        </Card.Content>
      </Card>

      {/* Photo Requirements */}
      <View style={styles.photosSection}>
        <Text style={styles.sectionTitle}>Required Photos</Text>
        
        {renderPhotoSection(
          'odometer',
          'Odometer Photo',
          'Clear photo showing the current odometer reading'
        )}
        
        {renderPhotoSection(
          'fuelSlip',
          'Fuel Slip Photo',
          'Photo of the fuel receipt showing amount and cost'
        )}
        
        {renderPhotoSection(
          'pumpStation',
          'Pump Station Photo',
          'Photo of the fuel station sign or pump number'
        )}
      </View>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          mode="contained"
          onPress={submitFuelEntry}
          loading={submitting}
          disabled={
            submitting ||
            !fuelEntry.litres ||
            !fuelEntry.cost ||
            !fuelEntry.odometerReading ||
            !fuelEntry.odometerPhoto ||
            !fuelEntry.fuelSlipPhoto ||
            !fuelEntry.pumpStationPhoto
          }
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          {submitting ? 'Submitting...' : 'Submit Fuel Entry'}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  detailsCard: {
    margin: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flex: 1,
    marginRight: 8,
  },
  input: {
    marginBottom: 16,
  },
  fullWidthInput: {
    marginBottom: 16,
  },
  photosSection: {
    padding: 16,
  },
  photoCard: {
    marginBottom: 16,
    elevation: 2,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  requiredBadge: {
    backgroundColor: '#dc2626',
  },
  photoDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  captureButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginTop: 8,
  },
  photoPreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  photoSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoSuccessText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  retakeButton: {
    marginTop: 12,
  },
  submitContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: '#1e3a8a',
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 120,
  },
  cameraTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  cameraInstructions: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  cancelButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturePhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#f3f4f6',
  },
  capturePhotoInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e3a8a',
  },
  placeholder: {
    width: 50,
  },
});
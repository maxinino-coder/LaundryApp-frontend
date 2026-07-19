import { useLocationStore } from '@/store';
import { MarkerData } from '@/types/type';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

export type RiderPhase = 'to_customer' | 'to_business';

interface MapComponentProps {
  // When used in rider route context
  pickupLat?: number;
  pickupLng?: number;
  pickupLabel?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  dropoffLabel?: string;
  phase?: RiderPhase;
  // When used in home/general context
  showDriverMarkers?: boolean;
  markers?: MarkerData[];
}

const Map = ({
  pickupLat,
  pickupLng,
  pickupLabel,
  dropoffLat,
  dropoffLng,
  dropoffLabel,
  phase = 'to_customer',
  showDriverMarkers = false,
  markers = [],
}: MapComponentProps) => {
  const {
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();

  // Determine origin/destination based on phase
  // Phase 'to_customer': rider → customer pickup
  // Phase 'to_business': rider → business dropoff
  const origin = {
    latitude: userLatitude ?? 5.6037,
    longitude: userLongitude ?? -0.187,
  };

  const destination = phase === 'to_customer'
    ? { latitude: pickupLat, longitude: pickupLng }
    : { latitude: dropoffLat, longitude: dropoffLng };

  const hasDestination = destination.latitude != null && destination.longitude != null;

  // Region calculation
  const region = hasDestination
    ? {
        latitude: (origin.latitude + destination.latitude!) / 2,
        longitude: (origin.longitude + destination.longitude!) / 2,
        latitudeDelta: Math.abs(origin.latitude - destination.latitude!) * 1.5 + 0.02,
        longitudeDelta: Math.abs(origin.longitude - destination.longitude!) * 1.5 + 0.02,
      }
    : {
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

  if (!userLatitude || !userLongitude) {
    return (
      <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
    );
  }

  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={{ width: '100%', height: '100%', borderRadius: 16 }}
      mapType="mutedStandard"
      showsPointsOfInterest={false}
      initialRegion={region}
      showsUserLocation={true}
      userInterfaceStyle="light"
    >
      {/* Customer pickup marker */}
      {pickupLat && pickupLng && (
        <Marker
          coordinate={{ latitude: pickupLat, longitude: pickupLng }}
          title={pickupLabel ?? 'Customer Pickup'}
          pinColor={phase === 'to_customer' ? '#2563EB' : '#94a3b8'}
        />
      )}

      {/* Business/dropoff marker */}
      {dropoffLat && dropoffLng && (
        <Marker
          coordinate={{ latitude: dropoffLat, longitude: dropoffLng }}
          title={dropoffLabel ?? 'Drop-off'}
          pinColor={phase === 'to_business' ? '#16a34a' : '#94a3b8'}
        />
      )}

      {/* Driver markers for home map */}
      {showDriverMarkers && markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
          title={marker.title}
          pinColor="#2563EB"
        />
      ))}

      {/* General home map destination */}
      {!pickupLat && destinationLatitude && destinationLongitude && (
        <Marker
          coordinate={{ latitude: destinationLatitude, longitude: destinationLongitude }}
          title="Destination"
          pinColor="#2563EB"
        />
      )}

      {/* Route line */}
      {hasDestination && destination.latitude && destination.longitude && (
        <MapViewDirections
          origin={origin}
          destination={{
            latitude: destination.latitude,
            longitude: destination.longitude,
          }}
          apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY!}
          strokeColor={phase === 'to_customer' ? '#2563EB' : '#16a34a'}
          strokeWidth={4}
        />
      )}

      {/* Home map route to destination */}
      {!pickupLat && destinationLatitude && destinationLongitude && (
        <MapViewDirections
          origin={origin}
          destination={{ latitude: destinationLatitude, longitude: destinationLongitude }}
          apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY!}
          strokeColor="#2563EB"
          strokeWidth={3}
        />
      )}
    </MapView>
  );
};

export default Map;
import { useLocationStore } from '@/store';
import { MarkerData } from '@/types/type';
import React, { useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
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

const DIRECTIONS_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

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
  const mapRef = useRef<MapView>(null);
  const {
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();

  const hasUserLocation = userLatitude != null && userLongitude != null;

  // Phase 'to_customer': rider → customer pickup
  // Phase 'to_business': rider → business dropoff
  const destination = phase === 'to_customer'
    ? { latitude: pickupLat, longitude: pickupLng }
    : { latitude: dropoffLat, longitude: dropoffLng };

  const hasDestination =
    destination.latitude != null && destination.longitude != null;

  // Everything we want visible on screen
  const focusPoints = useMemo(() => {
    const pts: { latitude: number; longitude: number }[] = [];
    if (hasUserLocation) pts.push({ latitude: userLatitude!, longitude: userLongitude! });
    if (pickupLat != null && pickupLng != null) pts.push({ latitude: pickupLat, longitude: pickupLng });
    if (dropoffLat != null && dropoffLng != null) pts.push({ latitude: dropoffLat, longitude: dropoffLng });
    if (destinationLatitude != null && destinationLongitude != null)
      pts.push({ latitude: destinationLatitude, longitude: destinationLongitude });
    return pts;
  }, [hasUserLocation, userLatitude, userLongitude, pickupLat, pickupLng, dropoffLat, dropoffLng, destinationLatitude, destinationLongitude]);

  // Initial region — center on whatever we know NOW; the effect below
  // re-fits the camera whenever coordinates arrive asynchronously
  // (e.g. the location permission resolves after mount).
  const initialRegion = useMemo(() => {
    const center = focusPoints[0] ?? { latitude: 5.6037, longitude: -0.187 }; // Accra fallback
    return {
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initial only

  // Re-fit camera whenever the set of known points changes. This is what
  // actually fixes "the map doesn't work": before, the region was computed
  // once at mount (usually before GPS resolved) and never updated.
  useEffect(() => {
    if (focusPoints.length === 0) return;
    const t = setTimeout(() => {
      if (focusPoints.length === 1) {
        mapRef.current?.animateToRegion(
          { ...focusPoints[0], latitudeDelta: 0.02, longitudeDelta: 0.02 },
          600
        );
      } else {
        mapRef.current?.fitToCoordinates(focusPoints, {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [focusPoints]);

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      style={{ width: '100%', height: '100%', borderRadius: 16 }}
      // mutedStandard is iOS-only; Android falls back to standard
      mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
      showsPointsOfInterest={false}
      initialRegion={initialRegion}
      showsUserLocation={true}
      showsMyLocationButton={true}
      userInterfaceStyle="light"
    >
      {/* Customer pickup marker */}
      {pickupLat != null && pickupLng != null && (
        <Marker
          coordinate={{ latitude: pickupLat, longitude: pickupLng }}
          title={pickupLabel ?? 'Customer Pickup'}
          pinColor={phase === 'to_customer' ? '#2563EB' : '#94a3b8'}
        />
      )}

      {/* Business/dropoff marker */}
      {dropoffLat != null && dropoffLng != null && (
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
      {pickupLat == null && destinationLatitude != null && destinationLongitude != null && (
        <Marker
          coordinate={{ latitude: destinationLatitude, longitude: destinationLongitude }}
          title="Destination"
          pinColor="#2563EB"
        />
      )}

      {/* Route line — only once we have the rider's REAL position.
          (Previously this drew a route from the Accra fallback point.) */}
      {hasUserLocation && hasDestination && DIRECTIONS_KEY && (
        <MapViewDirections
          origin={{ latitude: userLatitude!, longitude: userLongitude! }}
          destination={{
            latitude: destination.latitude!,
            longitude: destination.longitude!,
          }}
          apikey={DIRECTIONS_KEY}
          strokeColor={phase === 'to_customer' ? '#2563EB' : '#16a34a'}
          strokeWidth={4}
          onError={(e) => console.warn('[map] directions error:', e)}
        />
      )}

      {/* Home map route to destination */}
      {hasUserLocation && pickupLat == null &&
        destinationLatitude != null && destinationLongitude != null && DIRECTIONS_KEY && (
        <MapViewDirections
          origin={{ latitude: userLatitude!, longitude: userLongitude! }}
          destination={{ latitude: destinationLatitude, longitude: destinationLongitude }}
          apikey={DIRECTIONS_KEY}
          strokeColor="#2563EB"
          strokeWidth={3}
          onError={(e) => console.warn('[map] directions error:', e)}
        />
      )}
    </MapView>
  );
};

export default Map;

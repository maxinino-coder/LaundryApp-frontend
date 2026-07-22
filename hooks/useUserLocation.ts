import { useEffect } from 'react';
import * as Location from 'expo-location';
import { useLocationStore } from '@/store';

/**
 * Requests foreground location permission once and writes the device
 * position into the shared location store — the Map component and
 * distance calculations read from there. Safe to call from multiple
 * screens; the store simply gets refreshed.
 */
export function useUserLocation() {
  const setUserLocation = useLocationStore((s) => s.setUserLocation);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        let address = '';
        try {
          const [place] = await Location.reverseGeocodeAsync({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          if (place) {
            address = [place.name, place.street, place.city]
              .filter(Boolean)
              .join(', ');
          }
        } catch {
          // reverse geocode is best-effort
        }

        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address,
        });
      } catch (e) {
        console.warn('[location] failed to get position', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setUserLocation]);
}

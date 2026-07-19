import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;
    return {
      id: driver.driver_id,
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
      ...driver,
    };
  });
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (!userLatitude || !userLongitude) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }
  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);
  const latitudeDelta = (maxLat - minLat) * 1.3;
  const longitudeDelta = (maxLng - minLng) * 1.3;
  const latitude = (userLatitude + destinationLatitude) / 2;
  const longitude = (userLongitude + destinationLongitude) / 2;

  return { latitude, longitude, latitudeDelta, longitudeDelta };
};

export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (!userLatitude || !userLongitude || !destinationLatitude || !destinationLongitude)
    return;

  const timesPromises = markers.map(async (marker) => {
    try {
      const responseToUser = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${marker.latitude},${marker.longitude}&destination=${userLatitude},${userLongitude}&key=${directionsAPI}`,
      );
      const dataToUser = await responseToUser.json();
      console.log('Directions response status:', dataToUser.status);

      if (!dataToUser.routes?.length) {
        console.log('No routes found:', dataToUser.status, dataToUser.error_message);
        return { ...marker, time: 0, price: '0.00' };
      }

      const timeToUser = dataToUser.routes[0].legs[0].duration.value;

      const responseToDestination = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${userLatitude},${userLongitude}&destination=${destinationLatitude},${destinationLongitude}&key=${directionsAPI}`,
      );
      const dataToDestination = await responseToDestination.json();

      if (!dataToDestination.routes?.length) {
        return { ...marker, time: 0, price: '0.00' };
      }

      const timeToDestination = dataToDestination.routes[0].legs[0].duration.value;
      const totalTime = (timeToUser + timeToDestination) / 60;
      const price = (totalTime * 0.5).toFixed(2);

      return { ...marker, time: totalTime, price };
    } catch (err) {
      console.error('Error for marker:', marker.id, err);
      return { ...marker, time: 0, price: '0.00' };
    }
  }); // ✅ closing ) was missing

  return await Promise.all(timesPromises); // ✅ this was missing
};


export const calculateTotalDistance = async ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    !userLatitude ||
    !userLongitude ||
    !destinationLatitude ||
    !destinationLongitude
  ) {
    return {
      distanceInMeters: 0,
      distanceInKm: 0,
    };
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${userLatitude},${userLongitude}&destination=${destinationLatitude},${destinationLongitude}&key=${directionsAPI}`
    );

    const data = await response.json();

    if (!data.routes?.length) {
      return {
        distanceInMeters: 0,
        distanceInKm: 0,
      };
    }

    const distanceInMeters = data.routes[0].legs[0].distance.value;
    const distanceInKm = Number((distanceInMeters / 1000).toFixed(2));

    return {
      distanceInMeters,
      distanceInKm,
    };
  } catch (error) {
    console.error("Error calculating distance:", error);

    return {
      distanceInMeters: 0,
      distanceInKm: 0,
    };
  }
};
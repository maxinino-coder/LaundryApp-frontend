import { useLocalSearchParams } from "expo-router";
import { calculateTotalDistance } from "./map";

export const calculatePrice = (quantity: number, unitPrice: number): number => {
  return quantity * unitPrice;
};

//estimate delivery fee based on distance
export const estimateDeliveryFee = (distanceInKm: number): number => {
  const baseFee = 5; // base fee in dollars
  const distanceFee = distanceInKm * 1; // $1 per km
   // $0.5 per kg

  return baseFee + distanceFee ;
};

//estmaite laundry service based on number of cloths
// Price per kilogram
const PRICE_PER_KG = 20;

// Average weight (kg) for one item
export const ITEM_WEIGHT = {
  shirt: 0.25,
  trouser: 0.40,
  jeans: 0.70,
  bedSheet: 0.90,
  singlet: 0.15,
  jacket: 1.20,
  suit: 1.50,
} as const;

export interface LaundryItems {
  shirts?: number;
  trousers?: number;
  jeans?: number;
  bedSheets?: number;
  singlets?: number;
  jackets?: number;
  suits?: number;
}

export interface LaundryEstimate {
  totalItems: number;
  totalWeight: number;
  estimatedPrice: number;
}

export const estimateLaundryServiceFee = (
  items: LaundryItems
): LaundryEstimate => {

  const shirts = items.shirts ?? 0;
  const trousers = items.trousers ?? 0;
  const jeans = items.jeans ?? 0;
  const bedSheets = items.bedSheets ?? 0;
  const singlets = items.singlets ?? 0;
  const jackets = items.jackets ?? 0;
  const suits = items.suits ?? 0;

  const totalItems =
    shirts +
    trousers +
    jeans +
    bedSheets +
    singlets +
    jackets +
    suits;

  const totalWeight =
    shirts * ITEM_WEIGHT.shirt +
    trousers * ITEM_WEIGHT.trouser +
    jeans * ITEM_WEIGHT.jeans +
    bedSheets * ITEM_WEIGHT.bedSheet +
    singlets * ITEM_WEIGHT.singlet +
    jackets * ITEM_WEIGHT.jacket +
    suits * ITEM_WEIGHT.suit;

  const estimatedPrice = Number((totalWeight * PRICE_PER_KG).toFixed(2));

  return {
    totalItems,
    totalWeight: Number(totalWeight.toFixed(2)),
    estimatedPrice,
  };
};


//calculate rider earing based on distance
export const calculateRiderEarnings = async ({
  customerLat,
  customerLng,
  businessLat,
  businessLng,
}: {
  customerLat: number;
  customerLng: number;
  businessLat: number;
  businessLng: number;
}): Promise<number> => {
  const distance = await calculateTotalDistance({
    userLatitude: customerLat,
    userLongitude: customerLng,
    destinationLatitude: businessLat,
    destinationLongitude: businessLng,
  });

  if (!distance) return 0;

  const RATE_PER_KM = 0.5; // GHS per km

  return Number((distance.distanceInKm * RATE_PER_KM).toFixed(2));
};
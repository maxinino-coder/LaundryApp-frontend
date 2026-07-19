import { TextInputProps, TouchableOpacityProps } from "react-native";

// ─── Existing types ───────────────────────────────────────────

// declare interface Driver {
//   driver_id: number;
//   first_name: string;
//   last_name: string;
//   profile_image_url: string;
//   car_image_url: string;
//   car_seats: number;
//   rating: number;
// }

declare interface MarkerData {
  latitude: number;
  longitude: number;
  id: number;
  title: string;
  profile_image_url: string;
  car_image_url: string;
  car_seats: number;
  rating: number;
  first_name: string;
  last_name: string;
  time?: number;
  price?: string;
}

declare interface MapProps {
  destinationLatitude?: number;
  destinationLongitude?: number;
  onDriverTimesCalculated?: (driversWithTimes: MarkerData[]) => void;
  selectedDriver?: number | null;
  onMapReady?: () => void;
}

declare interface Ride {
  origin_address: string;
  destination_address: string;
  origin_latitude: number;
  origin_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  ride_time: number;
  fare_price: number;
  payment_status: string;
  driver_id: number;
  user_email: string;
  created_at: string;
  driver: {
    first_name: string;
    last_name: string;
    car_seats: number;
  };
}

declare interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
  textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  className?: string;
}

declare interface GoogleInputProps {
  icon?: string;
  initialLocation?: string;
  containerStyle?: string;
  textInputBackgroundColor?: string;
  handlePress: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
}

declare interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: any;
  secureTextEntry?: boolean;
  labelStyle?: string;
  containerStyle?: string;
  inputStyle?: string;
  iconStyle?: string;
  className?: string;
}

declare interface PaymentProps {
  fullName: string;
  email: string;
  amount: string;
  driverId: number;
  rideTime: number;
}

declare interface LocationStore {
  userLatitude: number | null;
  userLongitude: number | null;
  userAddress: string | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  destinationAddress: string | null;
  setUserLocation: ({ latitude, longitude, address }: {
    latitude: number; longitude: number; address: string;
  }) => void;
  setDestinationLocation: ({ latitude, longitude, address }: {
    latitude: number; longitude: number; address: string;
  }) => void;
}

declare interface DriverStore {
  drivers: MarkerData[];
  selectedDriver: number | null;
  setSelectedDriver: (driverId: number) => void;
  setDrivers: (drivers: MarkerData[]) => void;
  clearSelectedDriver: () => void;
}

declare interface DriverCardProps {
  item: MarkerData;
  selected: number;
  setSelected: () => void;
}

// ─── Role selection ───────────────────────────────────────────

type Role = "customer" | "business" | "rider" | null;

declare interface RoleOption {
  id: Exclude<Role, null>;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

declare interface RoleCardProps {
  option: RoleOption;
  selected: boolean;
  onPress: () => void;
}

// ─── Spring Boot Auth DTOs ────────────────────────────────────
// .d.ts files make everything globally available — no imports needed
// in your screen files to use these types. Remove "declare export"
// (invalid syntax) and use plain type/declare interface instead.

type VehicleType = "BICYCLE" | "MOTORCYCLE" | "CAR" | "VAN";
type RiderType = "CONTRACT" | "EMPLOYED";

declare interface RegisterUserRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
}

declare interface RegisterBusinessRequest {
  email: string;
  phone: string;
  password: string;
  businessName: string;
  address: string;
  city: string;
}

declare interface RegisterRiderRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  vehicleType: VehicleType;
  riderType: RiderType;
  businessId: string | null;
}

declare interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: "USER" | "BUSINESS" | "RIDER";
  account_id: string;
}

// ─── Form states ──────────────────────────────────────────────

export interface UserFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

declare interface BusinessFormState {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  password: string;
  confirmPassword: string;
}

declare interface RiderFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  vehicleType: VehicleType | null;
  riderType: RiderType;
  businessId: string;
}



declare interface AvailableOrder {
  orderId: string;
  orderNumber: string;
  status: string;
  businessName: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  deliveryFee: number;
  createdAt: string;
  pickupTime?: string;
}

declare interface BusinessInfo {
  id: string;
  businessName: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  isOpen: boolean;
  openingTime?: string;
  closingTime?: string;
}

declare interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  pricingModel: "PER_ITEM" | "PER_KG";
  unitPrice: number;
  unit: string;
  imageUrl?: string;
  isActive: boolean;
}

declare interface CreateServiceItemPayload {
  name: string;
  description?: string;
  category: string;
  pricingModel: "PER_ITEM" | "PER_KG";
  unitPrice: number;
  unit: string;
}

// declare interface Order {
//   id: string;
//   orderNumber: string;
//   status: string;
//   pickupAddress: string;
//   deliveryAddress: string;
//   subtotal: number;
//   pickupFee: number;
//   dropoffFee: number;
//   deliveryFee: number;
//   discountAmount: number;
//   totalAmount: number;
//   notes?: string;
//   createdAt: string;
//   updatedAt: string;
// }

declare interface OrderInfo {
  orderId: string;
  orderNumber: string;
  userId: string;
  businessId: string;
  riderId?: string;
  status: OrderStatus;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupTime?: string;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryTime?: string;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  cancelledReason?: string;
  createdAt: string;
  updatedAt: string;
}
export enum OrderStatus {
    PENDING,
    CONFIRMED, PICKED_UP, IN_PROGRESS,
    READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, REFUNDED,ACCEPTED
}

declare interface CreateOrderPayload {
  businessId: string;
  pickupAddress: string;
  deliveryAddress: string;
  notes?: string;
  items: {
    serviceItemId: string;
    quantity: number;
    weightKg?: number;
  }[];
}

declare interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

declare interface RiderInfo {
  id: string;
  firstName: string;
  lastName: string;
  riderType:RiderType;
  vehicleType: VehicleType;
  vehiclePlate?: string;
  isAvailable: boolean;
  currentLat?: number;
  currentLng?: number;
}

declare interface RideAssignment {
  id: string;
  orderId: string;
  riderId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  appliedAt: string;
  completedAt?: string;
}

declare interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}
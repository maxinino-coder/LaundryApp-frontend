// types/type.ts  — regular TypeScript file, importable everywhere

import { TextInputProps, TouchableOpacityProps } from "react-native";

export interface AvailableOrder {
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

export interface BusinessInfo {
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
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  momoNumber?: string;
}
;

export interface ServiceItem {
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

export interface CreateServiceItemPayload {
  name: string;
  description?: string;
  category: ServiceCategory;
  pricingModel: "PER_ITEM" | "PER_KG";
  unitPrice: number;
  unit: number;
  
}
export enum ServiceCategory {
  WASH = 'WASH',
  WASH_FOLD = 'WASH_FOLD',
  WASH_FOLD_IRON = 'WASH_FOLD_IRON',
  OTHER = 'OTHER',
}
export enum PricingModel {
  PER_ITEM = 'PER_ITEM',
  PER_KG = 'PER_KG',
}


// Backend serializes the enum as strings ("PENDING", ...), so this must be a string enum
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PICKED_UP = 'PICKED_UP',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  ACCEPTED = 'ACCEPTED',
}

export interface Order{
  orderId: string;
  orderNumber: string;
  userId: string;
  businessId: string;
  pickUpRiderId?: string;
  delivaryRiderId?: string;
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
  pickUpFee: number;
  dropoffFee: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  cancelledReason?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
}

export interface OrderItem{
  serviceCategory: ServiceCategory;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
  createdAt?: string;
}

export interface CreateOrderPayload {
  accountId: string;
  businessId: string;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  notes?: string;
  items: {
    serviceCategory: ServiceCategory;
    quantity: number;
    note?: string;
  }[];
}

export interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  email?: string;
  phone?: string; 
}

export interface RiderInfo {
  id: string;
  firstName: string;
  lastName: string;
  riderType:RiderType;
  vehicleType: VehicleType;
  vehiclePlate?: string;
  isAvailable: boolean;
  isApproved?: boolean;
  currentLat?: number;
  currentLng?: number;
  avatarUrl?: string;
  momoNumber?: string;
  bankAccountNo?: string;
}

export interface RideAssignment {
  applicationId: string;
  orderId: string;
  riderId: string;
  riderFirstName: string;
  riderLastName: string;
  vehicleType?: string;
  vehiclePlate?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";
  appliedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  isRead?: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  conversationId: string;
  orderId: string;
  orderNumber: string;
  supabaseChannel: string;
  otherAccountId: string;
  otherName: string;
  otherRole: "USER" | "BUSINESS" | "RIDER";
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
}
  

export type VehicleType = "BICYCLE" | "MOTORCYCLE" | "CAR" | "VAN";
export type RiderType = "CONTRACT" | "EMPLOYED";

export interface RegisterUserRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterBusinessRequest {
  email: string;
  phone: string;
  password: string;
  businessName: string;
  address: string;
  city: string;
}

export interface RegisterRiderRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  vehicleType: VehicleType;
  riderType: RiderType;
  businessId: string | null;
}

export interface AuthResponse {
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

export declare interface BusinessFormState {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  password: string;
  confirmPassword: string;
}

export interface RiderFormState {
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

export type RoleId = "customer" | "business" | "rider";

export interface RoleOption {
  id: RoleId;
  title: string;
  subtitle: string;
  icon: React.ReactNode; // or JSX.Element
}

export interface RoleCardProps {
  option: RoleOption;
  selected: boolean;
  onPress: () => void;
}

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
  textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  className?: string;
}

export interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: any;
  secureTextEntry?: boolean;
  labelStyle?: string;
  containerStyle?: string;
  inputStyle?: string;
  iconStyle?: string;
  className?: string;
}

export interface BusinessPayoutDTO {
   businessId: string;
   businessName: string;
     totalRevenue: number;
    totalCommission: number;
    totalRiderFee: number;
    totalNetPayout: number;
    pendingCount: number;
    settledCount: number;
    payouts:BusinessPayout[];

}

export interface RiderPayoutDTO{
riderID: string;
riderFirstName: string;
riderLastName: string;
riderEmail: string;
riderPhone: string;
totalEarnings: number;
totalPending: number;
totalSettled: number;
totalFailed: number;
pendingCount: number;
settledCount: number;
failedCount: number;
totalOrders: number;
pickupEarnings: number;
dropoffEarnings: number;
 earnings: RiderEarning[] ;
}
export interface RiderEarning{
  orderId: string;
  rider_id: string;
  amount: number;
  status: SettlementStatus;
  createdAt: string;
  settledAt?: string;
  paystack_transfer_code?: string;
  payment_type: PaymentType;
}
 
export enum PaymentType { PICKUP, SERVICE, DROPOFF }

export interface BusinessPayout {
  id: string;                 
  business_id: string;       
  order_id: string;
  order_revenue: number;       
  platform_commission: number;
  rider_fee: number;           
  net_payout: number;         
  status: SettlementStatus;             
  settled_at: string;          
  created_at: string;         
}

export enum SettlementStatus { PENDING, SETTLED, FAILED }


export interface MarkerData {
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

export interface MapProps {
  destinationLatitude?: number;
  destinationLongitude?: number;
  onDriverTimesCalculated?: (driversWithTimes: MarkerData[]) => void;
  selectedDriver?: number | null;
  onMapReady?: () => void;
}
export interface PaymentProps {
  fullName: string;
  email: string;
  amount: string;
  driverId: number;
  rideTime: number;
}

export interface LocationStore {
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

export interface DriverStore {
  drivers: MarkerData[];
  selectedDriver: number | null;
  setSelectedDriver: (driverId: number) => void;
  setDrivers: (drivers: MarkerData[]) => void;
  clearSelectedDriver: () => void;
}

export interface Driver {
    driver_id: number;
    first_name: string;
    last_name: string;
    profile_image_url: string;
    car_image_url: string;
    car_seats: number;
    rating: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  time: string;
  status: string;
  amount: string;
  note: string;
}

export interface EarningsData {
  totalBalance: string;
  pendingPayout: string;
  activity: ActivityItem[];
  chartData: number[];
  days: string[];
  percentageChange: number;
}
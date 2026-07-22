import { ServiceCategory } from '@/types/type';

/**
 * Category price table — mirrors the backend's ServicePricing.java.
 * Prices are GHS per item. Keep both files in sync when prices change.
 */
export interface ServiceOption {
  category: ServiceCategory;
  label: string;
  description: string;
  unitPrice: number;
  icon: string; // MaterialCommunityIcons name
}

export const SERVICE_OPTIONS: ServiceOption[] = [
  {
    category: ServiceCategory.WASH,
    label: 'Wash',
    description: 'Machine wash & dry',
    unitPrice: 10,
    icon: 'washing-machine',
  },
  {
    category: ServiceCategory.WASH_FOLD,
    label: 'Wash & Fold',
    description: 'Washed, dried and neatly folded',
    unitPrice: 15,
    icon: 'tshirt-crew-outline',
  },
  {
    category: ServiceCategory.WASH_FOLD_IRON,
    label: 'Wash, Fold & Iron',
    description: 'Full service incl. ironing',
    unitPrice: 20,
    icon: 'iron-outline',
  },
  {
    category: ServiceCategory.OTHER,
    label: 'Other',
    description: 'Special items (duvets, shoes...)',
    unitPrice: 12,
    icon: 'basket-outline',
  },
];

/** Flat per-leg rider fees (GHS) — mirrors backend constants. */
export const PICKUP_FEE = 8;
export const DROPOFF_FEE = 8;

export const priceFor = (category: ServiceCategory): number =>
  SERVICE_OPTIONS.find((s) => s.category === category)?.unitPrice ??
  SERVICE_OPTIONS[SERVICE_OPTIONS.length - 1].unitPrice;

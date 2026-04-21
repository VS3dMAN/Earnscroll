/**
 * Google Play Billing — integration stub.
 *
 * This module is the single seam between the app and the billing provider.
 * The monetized build will integrate `react-native-iap` against products
 * configured in the Google Play Console:
 *   - pro_monthly  (auto-renewing subscription)
 *   - pro_annual   (auto-renewing subscription)
 *   - pro_lifetime (one-time INAPP product)
 *
 * Until the SDK is installed and Play Console products are created, every
 * function throws. Callers should wrap calls in try/catch and surface the
 * error to the user. When integrating for real, replace the bodies below
 * — the call sites in app/go-pro.tsx do not need to change.
 */

export type ProductId = 'pro_monthly' | 'pro_annual' | 'pro_lifetime';

export type Product = {
  productId: ProductId;
  title: string;
  description: string;
  priceString: string;
};

export type Purchase = {
  productId: ProductId;
  purchaseToken: string;
  purchaseTime: number;
};

const NOT_INTEGRATED = 'Google Play Billing is not integrated yet. Please try again after the next app update.';

export async function initBilling(): Promise<void> {
  throw new Error(NOT_INTEGRATED);
}

export async function getProducts(): Promise<Product[]> {
  throw new Error(NOT_INTEGRATED);
}

export async function purchaseProduct(_id: ProductId): Promise<Purchase> {
  throw new Error(NOT_INTEGRATED);
}

export async function restorePurchases(): Promise<Purchase[]> {
  throw new Error(NOT_INTEGRATED);
}

export async function validatePurchase(_purchase: Purchase): Promise<boolean> {
  throw new Error(NOT_INTEGRATED);
}

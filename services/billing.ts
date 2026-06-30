/**
 * Google Play Billing — integration stub.
 *
 * v1.0 ships with FREE_LAUNCH_MODE = true and no billing integration.
 * Every function throws an Error whose .message is exactly
 * "billing_not_enabled". Call sites can string-match this to silently
 * no-op, or it surfaces as a clear assertion in Sentry if we ever
 * accidentally call billing in production.
 *
 * When integrating for real (v1.1):
 *   - Install react-native-iap
 *   - Configure pro_monthly / pro_annual / pro_lifetime in Play Console
 *   - Replace the bodies below — call sites do not need to change.
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

const BILLING_NOT_ENABLED = 'billing_not_enabled';

export async function initBilling(): Promise<void> {
  throw new Error(BILLING_NOT_ENABLED);
}

export async function getProducts(): Promise<Product[]> {
  throw new Error(BILLING_NOT_ENABLED);
}

export async function purchaseProduct(_id: ProductId): Promise<Purchase> {
  throw new Error(BILLING_NOT_ENABLED);
}

export async function restorePurchases(): Promise<Purchase[]> {
  throw new Error(BILLING_NOT_ENABLED);
}

export async function validatePurchase(_purchase: Purchase): Promise<boolean> {
  throw new Error(BILLING_NOT_ENABLED);
}

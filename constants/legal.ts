// Single source of truth for legal-document metadata.
// Updated in lockstep with legal/privacy-policy.html, legal/terms-of-service.html,
// and the in-app screens (app/privacy-policy.tsx, app/terms-of-service.tsx).

export const LAST_UPDATED_DATE = 'May 21, 2026';

export const LEGAL_CONTACT = {
  privacy: 'privacy@earnscroll.com',
  legal: 'legal@earnscroll.com',
  support: 'support@earnscroll.com',
} as const;

// Domain is not yet hosted at production submission time for v1.0. The in-app
// banner references this; flip to true once /privacy and /terms are live at
// the canonical URLs below.
export const WEB_LEGAL_HOSTED = false;

export const WEB_LEGAL_URLS = {
  privacy: 'https://earnscroll.com/privacy',
  terms: 'https://earnscroll.com/terms',
  dataSafety: 'https://earnscroll.com/data-safety',
  deleteAccount: 'https://earnscroll.com/delete-account',
} as const;

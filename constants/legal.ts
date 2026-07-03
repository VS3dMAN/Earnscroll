// Single source of truth for legal-document metadata.
// Updated in lockstep with legal/privacy-policy.html, legal/terms-of-service.html,
// and the in-app screens (app/privacy-policy.tsx, app/terms-of-service.tsx).

export const LAST_UPDATED_DATE = 'May 21, 2026';

export const LEGAL_CONTACT = {
  privacy: 'virajsoni24x7@gmail.com',
  legal: 'virajsoni24x7@gmail.com',
  support: 'virajsoni24x7@gmail.com',
} as const;

// Legal pages are live at the Vercel host below. If you later attach a custom
// domain to the Vercel project, update these URLs (and legal/data-safety-form-guide.html §4)
// to that domain. Set to true because /privacy and /terms now resolve publicly,
// which removes the in-app banner.
export const WEB_LEGAL_HOSTED = true;

export const WEB_LEGAL_URLS = {
  privacy: 'https://earnscroll-website.vercel.app/privacy',
  terms: 'https://earnscroll-website.vercel.app/terms',
  deleteAccount: 'https://earnscroll-website.vercel.app/delete-account',
} as const;

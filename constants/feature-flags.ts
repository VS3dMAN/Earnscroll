// Single source of truth for launch-time feature flags.
// Flip these for v1.1 / v1.x staged rollouts — do NOT duplicate values
// in other modules. Other files re-export from here for convenience.

// When true: the Pro/billing UI is hidden, no prices are displayed,
// every billing.ts function throws "billing_not_enabled", and any
// router.push('/go-pro') redirects to home.
export const FREE_LAUNCH_MODE = true;

// The access-control gate for the (future) native Android notification listener — see
// CLAUDE.md's "Notes for future work" for the native wiring this doesn't exist yet without.
//
// Android's NotificationListenerService permission is all-or-nothing at the OS level: once
// granted, the service technically receives every notification posted on the device, from every
// app. This module is what turns that broad OS permission into the narrow, explicit allowlist the
// user actually configured (see NotificationSourcesScreen) — `isNotificationSourceApproved` is
// meant to be the *first* thing the native listener's onNotificationPosted calls, before any text
// extraction, storage, or logging, so a non-approved notification's content never enters the rest
// of the pipeline at all. It's intentionally a single, trivial, side-effect-free check: there's
// nothing here that could accidentally process something it shouldn't.
export function isNotificationSourceApproved(packageName: string, enabledPackageNames: string[]): boolean {
  return enabledPackageNames.includes(packageName);
}

// Bit's package name is well-known/public; everything else is deliberately left for manual entry
// rather than guessed, since a wrong guess here would be a real access-control mistake (the user
// might trust a toggle that doesn't actually correspond to their bank's real app) — better to have
// the user copy the exact package name from their own device (Settings → Apps, or the app's Play
// Store listing URL, which ends in ?id=<package name>) than have us guess wrong with false
// confidence.
export const PRESET_NOTIFICATION_SOURCES: { packageName: string; label: string }[] = [
  { packageName: 'com.familypay.bit', label: 'Bit' },
];

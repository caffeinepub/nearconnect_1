# VibeZone

## Current State
VibeZone is a location-based social app with chat, friends, nearby people, push notifications, and admin portal. Chat screen uses a floating compose button to open the input bar. No privacy policy or terms links exist. Online status is based only on internet connectivity. Users with location disabled are still shown in other people's friend/nearby lists.

## Requested Changes (Diff)

### Add
- Privacy Policy link (https://notes.realme.com/s/r5rVmrj2WqBQ_2) in login/auth screen and in Settings/Profile
- Terms & Conditions link (https://notes.realme.com/s/xhfW199sVkMS_2) in login/auth screen and in Settings/Profile
- Inactivity-based offline: if a user hasn't opened the app in 10+ minutes, mark them offline in backend; their status shows as Offline to others
- Location-based visibility: users who have location disabled (no lat/lng stored, or location permission denied) are hidden from all other users' Friends and Nearby People lists

### Modify
- ChatPage: auto-open the input bar (set inputOpen=true by default) so keyboard opens immediately when chat screen loads
- AppContext fetchBackendUsers: filter out users who have no location data (lat/lng undefined/null) from the backendUsers list shown to others
- AppContext heartbeat: add idle detection — if the user's last active timestamp is > 10 min ago, set them offline; update lastActive on user interaction

### Remove
- Nothing removed

## Implementation Plan
1. ChatPage.tsx: Change `useState(false)` for inputOpen to `useState(true)` — keyboard opens immediately on mount
2. AppContext.tsx: 
   - Add idle detection: track last user activity with mousemove/click/touchstart events; if idle > 10 min, call setOnlineStatus(false)
   - In fetchBackendUsers filter: also exclude users with no location data (no lat/lng)
3. AuthPage.tsx: Add Privacy Policy and Terms & Conditions links at the bottom of the auth form
4. SettingsPage.tsx: Add Privacy Policy and Terms & Conditions links in the settings page

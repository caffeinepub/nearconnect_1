# VibeZone

## Current State
- SettingsPage has avatar picker, toggles (showOnlineStatus, showInRadius, notifications), theme selector, radius tier selector, contact developer links, delete account, sign out
- Missing from Settings: bio field, Online/Busy/Away status selector, recovery date
- Bottom nav has "Settings" tab
- No dedicated Profile tab or page for viewing own/others' profiles
- FriendsPage has profile sheet (tap avatar) but limited fields — no bio/status
- User interface in AppContext missing bio, status, recoveryDate fields
- Backend has getUserById() available

## Requested Changes (Diff)

### Add
- Bio field (max 40 chars) in Settings — persisted locally and synced via updateSettings
- Online/Busy/Away status selector in Settings
- Recovery date field in Settings (set/change recovery date for password reset)
- A full Profile page (replaces Settings tab in bottom nav) showing own profile with all info
- Ability to view another user's profile from Friends list, Nearby People, Chat header, and Requests — as a full slide-up sheet or page
- Profile page includes: avatar, display name, VIP badge, username, bio, status dot, tier, member since, and edit sections

### Modify
- Bottom nav: rename "Settings" tab → "Profile" (same hash route stays as "settings" for compatibility)
- SettingsPage: add bio textarea, status selector (Online/Busy/Away selector as 3 pill buttons), and recovery date input at the top of the settings sections
- AppContext User interface: add bio?: string, userStatus?: string, recoveryDate?: string
- FriendProfileSheet: show bio, status, tier from FriendUser data
- FriendsPage, ChatPage, ChatsListPage: tapping avatar/name opens the full profile sheet with bio, status, VIP badge, distance, block/chat/add buttons
- updateSettings call: also persist bio, userStatus, recoveryDate to localStorage and sync

### Remove
- Nothing removed

## Implementation Plan
1. Update User and FriendUser interfaces in AppContext to include bio, userStatus, recoveryDate
2. Update updateSettings in AppContext to persist and sync bio/userStatus/recoveryDate (stored in localStorage as part of user object)
3. Add bio field, status selector, recovery date input to SettingsPage
4. Create ProfilePage component showing own full profile (avatar, name, badge, bio, status, tier, member since) plus quick-links to edit avatar, change password, set recovery date
5. Rename "Settings" label in BottomNav to "Profile"
6. Create UserProfileSheet component for viewing any user's profile (own or others) — shows full info, with Chat/Add Friend/Block buttons for others, Edit button for own
7. Wire UserProfileSheet into FriendsPage (tap avatar), ChatPage (tap header avatar), ChatsListPage (tap avatar)
8. Validate and deploy

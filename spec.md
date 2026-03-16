# NearConnect - Nearby Friends Chat App

## Current State
New project, no existing code.

## Requested Changes (Diff)

### Add
- Auth system: signup/login with username + password
- User profile: unique ID, username, display name, avatar initial
- Friend discovery: search by user ID or username
- Friend requests: send, accept, reject
- Chat: 1-on-1 messaging with smooth animations, swipe gestures, typing indicators
- Location radius system: default 500m, upgradeable to 1km/5km/10km via in-app purchase
- Friends list filtered by location radius
- Settings page: theme selector, notification toggles, privacy controls, account management
- Themes: Liquid Flux (default, animated gradient mesh), Dark, Light, Neon
- Smooth animations: page transitions, chat bubble entrance, scroll momentum, swipe to reply
- Typing animation when composing messages

### Modify
N/A (new project)

### Remove
N/A

## Implementation Plan
1. Backend: user accounts, friend system, messaging, radius purchase tiers
2. Select components: authorization, stripe
3. Frontend pages: Auth (signup/login), Home/Friends list, Search, Chat, Settings
4. Liquid Flux theme: animated OKLCH gradient mesh background, glassmorphism cards
5. Chat UI: bubble animations, typing indicator dots, smooth scroll, swipe gesture
6. Radius purchase modal: upgrade tiers with Stripe
7. Settings: theme picker, radius display, account info

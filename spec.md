# VibeZone

## Current State
- WhatsApp-style chat with single tick (`✓`) shown for all sent messages
- `markConversationSeen` only updates the recipient's conversation key; sender's copy never gets `seen=true`
- `fetchConversation` maps backend messages without the `seen` field, so the tick never changes
- No delete functionality exists (individual message or whole conversation)

## Requested Changes (Diff)

### Add
- Delete individual message (long-press or tap hold shows context menu with Delete)
- Delete entire conversation (trash icon in chat header)
- Confirm dialog before deleting entire conversation

### Modify
- `markConversationSeen` in backend: also update the sender's conversation key so the sender's copy of their own messages becomes `seen=true`
- `fetchConversation` in AppContext: include `seen` field when mapping backend messages
- `Message` interface: add optional `seen?: boolean` field (remove the hacky cast in ChatPage)
- ChatPage tick indicator: show `✓✓` in blue when `msg.seen === true`, otherwise single grey `✓`
- Animated seen circle: show when `msg.seen === true` for the last sent message

### Remove
- Hacky `(msg as unknown as { seen?: boolean }).seen` casts in ChatPage

## Implementation Plan
1. Fix `markConversationSeen` in `main.mo` to also mark messages seen in the `otherUserId-userId` key
2. Add `deleteMessage(userId, otherUserId, timestamp)` to backend
3. Add `deleteConversation(userId, otherUserId)` to backend
4. Add `seen` to `Message` interface in AppContext; update `fetchConversation` mapping
5. Add `deleteMessage` / `deleteConversation` to AppContext and expose via context
6. Update ChatPage: clean up seen casts, add long-press delete on messages, trash icon in header with confirm dialog

import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Auth "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import Iter "mo:core/Iter";

import MixinAuthorization "authorization/MixinAuthorization";



actor {
  let accessControlState = Auth.initState();

  include MixinAuthorization(accessControlState);

  public type Location = {
    lat : Float;
    lng : Float;
    updatedAt : Time.Time;
  };

  public type UserSettings = {
    showInRadius : Bool;
    showOnlineStatus : Bool;
    notifications : Bool;
  };

  type UserInternal = {
    id : Text;
    username : Text;
    displayName : Text;
    passwordHash : Text;
    radiusTier : Nat;
    location : ?Location;
    lastSeen : Time.Time;
    online : Bool;
    settings : UserSettings;
    principal : Principal;
  };

  public type User = {
    id : Text;
    username : Text;
    displayName : Text;
    radiusTier : Nat;
    location : ?Location;
    lastSeen : Time.Time;
    online : Bool;
    settings : UserSettings;
  };

  public type UserProfile = {
    id : Text;
    username : Text;
    displayName : Text;
    radiusTier : Nat;
    location : ?Location;
    lastSeen : Time.Time;
    online : Bool;
    settings : UserSettings;
  };

  public type UserInput = {
    id : Text;
    username : Text;
    displayName : Text;
    passwordHash : Text;
    radiusTier : Nat;
  };

  public type LocationInput = {
    lat : Float;
    lng : Float;
  };

  public type PurchaseSettings = {
    enabled : Bool;
    basicPrice : Nat;
    standardPrice : Nat;
    premiumPrice : Nat;
  };

  public type Message = {
    sender : Text;
    recipient : Text;
    text : Text;
    timestamp : Time.Time;
    seen : Bool;
  };

  let users = Map.empty<Text, UserInternal>();
  let principalToUserId = Map.empty<Principal, Text>();
  let followers = Map.empty<Text, List.List<Text>>();
  let following = Map.empty<Text, List.List<Text>>();
  let messages = Map.empty<Text, List.List<Message>>();

  // Latest broadcast message text and timestamp
  var latestBroadcast : ?{ text : Text; timestamp : Time.Time } = null;

  var stripeConfiguration : ?Stripe.StripeConfiguration = null;
  var purchaseSettings : PurchaseSettings = {
    enabled = false;
    basicPrice = 0;
    standardPrice = 0;
    premiumPrice = 0;
  };

  public type Coordinates = {
    latitude : Text;
    longitude : Text;
  };

  let coordinatesStore = Map.empty<Principal, Coordinates>();

  func getUserInternal(userId : Text) : ?UserInternal {
    users.get(userId);
  };

  func toPublicUser(user : UserInternal) : User {
    {
      id = user.id;
      username = user.username;
      displayName = user.displayName;
      radiusTier = user.radiusTier;
      location = user.location;
      lastSeen = user.lastSeen;
      online = user.online;
      settings = user.settings;
    };
  };

  func toUserProfile(user : UserInternal) : UserProfile {
    {
      id = user.id;
      username = user.username;
      displayName = user.displayName;
      radiusTier = user.radiusTier;
      location = user.location;
      lastSeen = user.lastSeen;
      online = user.online;
      settings = user.settings;
    };
  };

  func verifyUserOwnership(caller : Principal, userId : Text) : Bool {
    switch (users.get(userId)) {
      case (?user) { user.principal == caller };
      case (null) { false };
    };
  };

  func getCallerUserId(caller : Principal) : ?Text {
    principalToUserId.get(caller);
  };

  // All calls are allowed - auth is handled via username/password
  func hasUserPermission(_caller : Principal) : Bool {
    true;
  };

  // Stripe Payment Integration
  public query func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set Stripe configuration");
    };
    stripeConfiguration := ?config;
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can check session status");
    };
    switch (stripeConfiguration) {
      case (null) {
        Runtime.trap("Stripe is not configured.");
      };
      case (?config) {
        await Stripe.getSessionStatus(config, sessionId, transform);
      };
    };
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can create checkout sessions");
    };
    switch (stripeConfiguration) {
      case (null) {
        Runtime.trap("Stripe is not configured.");
      };
      case (?config) {
        await Stripe.createCheckoutSession(config, caller, items, successUrl, cancelUrl, transform);
      };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public query func getPurchaseSettings() : async PurchaseSettings {
    purchaseSettings;
  };

  public shared ({ caller }) func setPurchaseSettings(settings : PurchaseSettings) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set purchase settings");
    };
    purchaseSettings := settings;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    switch (principalToUserId.get(caller)) {
      case (?userId) {
        switch (users.get(userId)) {
          case (?user) { ?toUserProfile(user) };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    switch (principalToUserId.get(caller)) {
      case (?userId) {
        switch (users.get(userId)) {
          case (?user) {
            let updatedUser : UserInternal = {
              user with
              displayName = profile.displayName;
              radiusTier = profile.radiusTier;
              settings = profile.settings;
            };
            users.add(userId, updatedUser);
          };
          case (null) {
            Runtime.trap("User not found");
          };
        };
      };
      case (null) {
        Runtime.trap("User not registered");
      };
    };
  };

  public query ({ caller }) func getUserProfile(userPrincipal : Principal) : async ?UserProfile {
    switch (principalToUserId.get(userPrincipal)) {
      case (?userId) {
        switch (users.get(userId)) {
          case (?user) { ?toUserProfile(user) };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func register(input : UserInput) : async User {
    // Only check username uniqueness - multiple accounts per device/principal are allowed
    let allUsers = users.values().toArray();
    let usernameExists = allUsers.find(
      func(user) { user.username == input.username }
    );
    switch (usernameExists) {
      case (?_) {
        Runtime.trap("Username already taken");
      };
      case (null) {};
    };

    let now = Time.now();
    let newUser : UserInternal = {
      id = input.id;
      username = input.username;
      displayName = input.displayName;
      passwordHash = input.passwordHash;
      radiusTier = input.radiusTier;
      location = null;
      lastSeen = now;
      online = false;
      settings = {
        showInRadius = true;
        showOnlineStatus = true;
        notifications = true;
      };
      principal = caller;
    };
    users.add(input.id, newUser);
    // Only map principal to userId if not already mapped (first account from this principal)
    switch (principalToUserId.get(caller)) {
      case (null) { principalToUserId.add(caller, input.id) };
      case (?_) {};
    };
    toPublicUser(newUser);
  };

  public query func verifyCredentials(username : Text, passwordHash : Text) : async ?User {
    let allUsers = users.values().toArray();
    let foundUser = allUsers.find(
      func(user) {
        user.username == username and user.passwordHash == passwordHash
      }
    );
    switch (foundUser) {
      case (?user) { ?toPublicUser(user) };
      case (null) { null };
    };
  };

  public query ({ caller }) func getAllUsers() : async [User] {
    let allUsers = users.values().toArray();
    allUsers.map(toPublicUser);
  };

  public shared ({ caller }) func updateLocation(userId : Text, location : LocationInput) : async User {
    // Verify caller owns this userId or is admin
    if (not verifyUserOwnership(caller, userId) and not Auth.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update your own location");
    };
    
    switch (getUserInternal(userId)) {
      case (?user) {
        let updatedLocation : Location = {
          lat = location.lat;
          lng = location.lng;
          updatedAt = Time.now();
        };
        let updatedUser : UserInternal = {
          user with
          location = ?updatedLocation;
          lastSeen = Time.now();
        };
        users.add(userId, updatedUser);
        toPublicUser(updatedUser);
      };
      case (null) {
        Runtime.trap("User not found");
      };
    };
  };

  public shared ({ caller }) func deleteUser(userId : Text) : async () {
    if (not Auth.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete users");
    };
    switch (getUserInternal(userId)) {
      case (?user) {
        principalToUserId.remove(user.principal);
        users.remove(userId);
      };
      case (null) {
        Runtime.trap("User not found");
      };
    };
  };

  public query ({ caller }) func getUserById(userId : Text) : async ?User {
    switch (users.get(userId)) {
      case (?user) { ?toPublicUser(user) };
      case (null) { null };
    };
  };

  public query ({ caller }) func getUserByUsername(username : Text) : async ?User {
    let allUsers = users.values().toArray();
    let foundUser = allUsers.find(
      func(user) { user.username == username }
    );
    switch (foundUser) {
      case (?user) { ?toPublicUser(user) };
      case (null) { null };
    };
  };

  public shared ({ caller }) func setOnlineStatus(userId : Text, online : Bool) : async User {
    // Verify caller owns this userId or is admin
    if (not verifyUserOwnership(caller, userId) and not Auth.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update your own status");
    };
    
    switch (getUserInternal(userId)) {
      case (?user) {
        let updatedUser : UserInternal = {
          user with
          online;
          lastSeen = Time.now();
        };
        users.add(userId, updatedUser);
        toPublicUser(updatedUser);
      };
      case (null) {
        Runtime.trap("User not found");
      };
    };
  };

  public shared ({ caller }) func updateSettings(userId : Text, settings : UserSettings) : async User {
    // Verify caller owns this userId or is admin
    if (not verifyUserOwnership(caller, userId) and not Auth.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update your own settings");
    };
    
    switch (getUserInternal(userId)) {
      case (?user) {
        let updatedUser : UserInternal = {
          user with
          settings;
        };
        users.add(userId, updatedUser);
        toPublicUser(updatedUser);
      };
      case (null) {
        Runtime.trap("User not found");
      };
    };
  };

  public shared ({ caller }) func saveCoordinates(coordinates : Coordinates) : async () {
    coordinatesStore.add(caller, coordinates);
  };

  public query ({ caller }) func getCoordinates() : async ?Coordinates {
    coordinatesStore.get(caller);
  };

  public shared ({ caller }) func follow(username : Text) : async Text {
    let allUsers = users.values().toArray();
    let targetUserExists = allUsers.find(
      func(user) { user.username == username }
    );
    switch (targetUserExists) {
      case (null) {
        Runtime.trap("Target user does not exist");
      };
      case (?_) {};
    };

    let ownUsername : Text = switch (principalToUserId.get(caller)) {
      case (?userId) {
        switch (users.get(userId)) {
          case (?user) { user.username };
          case (null) { Runtime.trap("User not found") };
        };
      };
      case (null) { Runtime.trap("User not registered") };
    };

    if (ownUsername == username) {
      Runtime.trap("Cannot follow yourself");
    };

    let currentFollowing = switch (following.get(ownUsername)) {
      case (null) { List.empty<Text>() };
      case (?followingList) { followingList };
    };
    currentFollowing.add(username);
    following.add(ownUsername, currentFollowing);

    let currentFollowers = switch (followers.get(username)) {
      case (null) { List.empty<Text>() };
      case (?followersList) { followersList };
    };
    currentFollowers.add(ownUsername);
    followers.add(username, currentFollowers);

    "Following " # username # " successfully!";
  };

  public shared ({ caller }) func unfollow(username : Text) : async Text {
    let ownUsername : Text = switch (principalToUserId.get(caller)) {
      case (?userId) {
        switch (users.get(userId)) {
          case (?user) { user.username };
          case (null) { Runtime.trap("User not found") };
        };
      };
      case (null) { Runtime.trap("User not registered") };
    };

    switch (following.get(ownUsername)) {
      case (?followingList) {
        let newFollowingList = List.empty<Text>();
        for (person in followingList.values()) {
          if (person != username) {
            newFollowingList.add(person);
          };
        };
        following.add(ownUsername, newFollowingList);
      };
      case (null) { Runtime.trap("Not following the user") };
    };

    switch (followers.get(username)) {
      case (?followersList) {
        let newFollowersList = List.empty<Text>();
        for (person in followersList.values()) {
          if (person != ownUsername) {
            newFollowersList.add(person);
          };
        };
        followers.add(username, newFollowersList);
      };
      case (null) { Runtime.trap("User has no followers") };
    };

    "Successfully unfollowed " # username;
  };

  // Remove a follower - called by the person being followed to reject a follow/friend request
  public shared ({ caller }) func removeFollower(followerUsername : Text) : async Text {
    let ownUsername : Text = switch (principalToUserId.get(caller)) {
      case (?userId) {
        switch (users.get(userId)) {
          case (?user) { user.username };
          case (null) { Runtime.trap("User not found") };
        };
      };
      case (null) { Runtime.trap("User not registered") };
    };

    // Remove followerUsername from own followers list
    switch (followers.get(ownUsername)) {
      case (?followersList) {
        let newFollowersList = List.empty<Text>();
        for (person in followersList.values()) {
          if (person != followerUsername) {
            newFollowersList.add(person);
          };
        };
        followers.add(ownUsername, newFollowersList);
      };
      case (null) {};
    };

    // Remove ownUsername from followerUsername's following list
    switch (following.get(followerUsername)) {
      case (?followingList) {
        let newFollowingList = List.empty<Text>();
        for (person in followingList.values()) {
          if (person != ownUsername) {
            newFollowingList.add(person);
          };
        };
        following.add(followerUsername, newFollowingList);
      };
      case (null) {};
    };

    "Removed follower " # followerUsername;
  };

  public query ({ caller }) func getFollowing(username : Text) : async [Text] {
    switch (following.get(username)) {
      case (?followingList) { followingList.toArray() };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getFollowers(username : Text) : async [Text] {
    switch (followers.get(username)) {
      case (?followersList) { followersList.toArray() };
      case (null) { [] };
    };
  };

  // Chat Messaging
  public shared ({ caller }) func sendMessage(sender : Text, recipient : Text, text : Text) : async () {
    // Verify caller owns the sender userId
    if (not verifyUserOwnership(caller, sender)) {
      Runtime.trap("Unauthorized: Can only send messages as yourself");
    };

    // Verify recipient exists
    switch (users.get(recipient)) {
      case (null) { Runtime.trap("Recipient user not found") };
      case (?_) {};
    };

    let message : Message = {
      sender;
      recipient;
      text;
      timestamp = Time.now();
      seen = false;
    };

    // Store message in sender's conversation
    let senderConversationKey = sender # "-" # recipient;
    let senderMessages = messages.get(senderConversationKey);
    let updatedSenderMessages = switch (senderMessages) {
      case (?msgs) {
        msgs.add(message);
        msgs;
      };
      case (null) {
        let newList = List.empty<Message>();
        newList.add(message);
        newList;
      };
    };
    messages.add(senderConversationKey, updatedSenderMessages);

    // Store message in recipient's conversation
    let recipientConversationKey = recipient # "-" # sender;
    let recipientMessages = messages.get(recipientConversationKey);
    let updatedRecipientMessages = switch (recipientMessages) {
      case (?msgs) {
        msgs.add(message);
        msgs;
      };
      case (null) {
        let newList = List.empty<Message>();
        newList.add(message);
        newList;
      };
    };
    messages.add(recipientConversationKey, updatedRecipientMessages);
  };

  public query ({ caller }) func getConversation(userId : Text, otherUserId : Text) : async [Message] {
    // Verify caller owns userId or is admin
    if (not verifyUserOwnership(caller, userId) and not Auth.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own conversations");
    };

    let conversationKey = userId # "-" # otherUserId;
    switch (messages.get(conversationKey)) {
      case (?msgs) { msgs.toArray() };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getNewMessages(userId : Text, otherUserId : Text, lastTimestamp : Time.Time) : async [Message] {
    // Verify caller owns userId or is admin
    if (not verifyUserOwnership(caller, userId) and not Auth.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own messages");
    };

    let conversationKey = userId # "-" # otherUserId;
    switch (messages.get(conversationKey)) {
      case (?msgs) {
        let filtered = msgs.toArray().filter(
          func(msg) { msg.timestamp > lastTimestamp }
        );
        filtered;
      };
      case (null) { [] };
    };
  };

  // Radius Tier Management - removed ICP admin check per user request
  public shared ({ caller }) func updateUserRadiusTier(userId : Text, tier : Nat) : async User {
    switch (getUserInternal(userId)) {
      case (?user) {
        let updatedUser : UserInternal = {
          user with
          radiusTier = tier;
        };
        users.add(userId, updatedUser);
        toPublicUser(updatedUser);
      };
      case (null) {
        Runtime.trap("User not found");
      };
    };
  };

  // Mark all messages in a conversation as seen
  // Also updates the sender's copy so they see the double tick
  public shared ({ caller }) func markConversationSeen(userId : Text, otherUserId : Text) : async () {
    // Verify caller owns userId or is admin
    if (not verifyUserOwnership(caller, userId) and not Auth.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update your own messages");
    };

    // Mark messages as seen in recipient's own conversation key (userId-otherUserId)
    // These are messages sent by otherUserId to userId
    let conversationKey = userId # "-" # otherUserId;
    switch (messages.get(conversationKey)) {
      case (?msgs) {
        let updatedMessages = List.empty<Message>();
        for (msg in msgs.values()) {
          if (msg.recipient == userId and not msg.seen) {
            updatedMessages.add({
              msg with
              seen = true;
            });
          } else {
            updatedMessages.add(msg);
          };
        };
        messages.add(conversationKey, updatedMessages);
      };
      case (null) {};
    };

    // Also update the sender's copy (otherUserId-userId) so the sender sees double ticks
    let senderConversationKey = otherUserId # "-" # userId;
    switch (messages.get(senderConversationKey)) {
      case (?msgs) {
        let updatedMessages = List.empty<Message>();
        for (msg in msgs.values()) {
          if (msg.sender == otherUserId and msg.recipient == userId and not msg.seen) {
            updatedMessages.add({
              msg with
              seen = true;
            });
          } else {
            updatedMessages.add(msg);
          };
        };
        messages.add(senderConversationKey, updatedMessages);
      };
      case (null) {};
    };
  };

  // Get count of unread messages in a conversation
  public query ({ caller }) func getUnreadCount(userId : Text, otherUserId : Text) : async Nat {
    // Verify caller owns userId or is admin
    if (not verifyUserOwnership(caller, userId) and not Auth.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own messages");
    };

    let conversationKey = userId # "-" # otherUserId;
    switch (messages.get(conversationKey)) {
      case (?msgs) {
        let filtered = msgs.toArray().filter(
          func(msg) {
            msg.recipient == userId and not msg.seen
          }
        );
        filtered.size();
      };
      case (null) { 0 };
    };
  };

  // Get total unread messages count for a user across all conversations
  public query ({ caller }) func getTotalUnreadCount(userId : Text) : async Nat {
    // Verify caller owns userId or is admin
    if (not verifyUserOwnership(caller, userId) and not Auth.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own messages");
    };

    var totalUnread : Nat = 0;
    for ((key, msgs) in messages.entries()) {
      // Check if this conversation involves the user
      let parts = key.split(#char '-').toArray();
      if (parts.size() == 2 and parts[0] == userId) {
        let filtered = msgs.toArray().filter(
          func(msg) {
            msg.recipient == userId and not msg.seen
          }
        );
        totalUnread += filtered.size();
      };
    };
    totalUnread;
  };

  // Delete a single message by timestamp (deletes from both sides)
  public shared ({ caller }) func deleteMessage(userId : Text, otherUserId : Text, timestamp : Time.Time) : async () {
    if (not verifyUserOwnership(caller, userId) and not Auth.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only delete your own messages");
    };

    // Remove from userId's side
    let key1 = userId # "-" # otherUserId;
    switch (messages.get(key1)) {
      case (?msgs) {
        let updated = List.empty<Message>();
        for (msg in msgs.values()) {
          if (msg.timestamp != timestamp) {
            updated.add(msg);
          };
        };
        messages.add(key1, updated);
      };
      case (null) {};
    };

    // Remove from otherUserId's side
    let key2 = otherUserId # "-" # userId;
    switch (messages.get(key2)) {
      case (?msgs) {
        let updated = List.empty<Message>();
        for (msg in msgs.values()) {
          if (msg.timestamp != timestamp) {
            updated.add(msg);
          };
        };
        messages.add(key2, updated);
      };
      case (null) {};
    };
  };

  // Delete entire conversation (both sides)
  public shared ({ caller }) func deleteConversation(userId : Text, otherUserId : Text) : async () {
    if (not verifyUserOwnership(caller, userId) and not Auth.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only delete your own conversations");
    };

    let key1 = userId # "-" # otherUserId;
    messages.remove(key1);

    let key2 = otherUserId # "-" # userId;
    messages.remove(key2);
  };

  // Admin Broadcast - stores latest broadcast and sends to all users
  public shared ({ caller }) func broadcastMessage(text : Text) : async () {
    let now = Time.now();
    // Store as the latest broadcast (replaces previous)
    latestBroadcast := ?{ text; timestamp = now };

    let allUsers = users.values().toArray();
    for (user in allUsers.values()) {
      let message : Message = {
        sender = "system";
        recipient = user.id;
        text;
        timestamp = now;
        seen = false;
      };

      // Store in recipient's conversation with system
      let conversationKey = user.id # "-system";
      let userMessages = messages.get(conversationKey);
      let updatedMessages = switch (userMessages) {
        case (?msgs) {
          msgs.add(message);
          msgs;
        };
        case (null) {
          let newList = List.empty<Message>();
          newList.add(message);
          newList;
        };
      };
      messages.add(conversationKey, updatedMessages);
    };
  };

  // Get the latest broadcast message (text + timestamp) - available to all users
  public query func getLatestBroadcast() : async ?{ text : Text; timestamp : Time.Time } {
    latestBroadcast;
  };
};

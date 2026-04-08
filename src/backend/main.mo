import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Iter "mo:core/Iter";


actor {

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
    avatar : Text;
    vipStatus : Text;
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
    avatar : Text;
    vipStatus : Text;
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
    avatar : Text;
    vipStatus : Text;
  };

  public type UserInput = {
    id : Text;
    username : Text;
    displayName : Text;
    passwordHash : Text;
    radiusTier : Nat;
    avatar : Text;
    vipStatus : Text;
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

  public type Coordinates = {
    latitude : Text;
    longitude : Text;
  };

  // ── Legacy types retained for upgrade compatibility ─────────────────────
  type _UserRole = { #admin; #user; #guest };
  type _AccessControlState = { var adminAssigned : Bool; userRoles : Map.Map<Principal, _UserRole> };
  type _StripeConfiguration = { allowedCountries : [Text]; secretKey : Text };

  // ── Stable backing storage (survives upgrades) ──────────────────────────
  // Legacy stable vars retained for upgrade compatibility
  stable var accessControlState : _AccessControlState = {
    var adminAssigned = false;
    userRoles = Map.empty<Principal, _UserRole>();
  };
  stable var stripeConfiguration : ?_StripeConfiguration = null;
  stable var stableUsers : [(Text, UserInternal)] = [];
  stable var stablePrincipalToUserId : [(Principal, Text)] = [];
  stable var stableFollowers : [(Text, [Text])] = [];
  stable var stableFollowing : [(Text, [Text])] = [];
  stable var stableMessages : [(Text, [Message])] = [];
  stable var stableCoordinates : [(Principal, Coordinates)] = [];
  stable var stableLatestBroadcast : ?{ text : Text; timestamp : Time.Time } = null;
  stable var stablePurchaseSettings : PurchaseSettings = {
    enabled = false;
    basicPrice = 0;
    standardPrice = 0;
    premiumPrice = 0;
  };

  // ── Working (heap) data structures ─────────────────────────────────────
  let users = Map.empty<Text, UserInternal>();
  let principalToUserId = Map.empty<Principal, Text>();
  let followers = Map.empty<Text, List.List<Text>>();
  let following = Map.empty<Text, List.List<Text>>();
  let messages = Map.empty<Text, List.List<Message>>();
  let coordinatesStore = Map.empty<Principal, Coordinates>();

  var purchaseSettings : PurchaseSettings = {
    enabled = false;
    basicPrice = 0;
    standardPrice = 0;
    premiumPrice = 0;
  };

  var latestBroadcast : ?{ text : Text; timestamp : Time.Time } = null;

  // ── Persistence hooks ───────────────────────────────────────────────────
  system func preupgrade() {
    stableUsers := users.entries().toArray();
    stablePrincipalToUserId := principalToUserId.entries().toArray();
    let followersArr = List.empty<(Text, [Text])>();
    for (entry in followers.entries()) {
      followersArr.add((entry.0, entry.1.toArray()));
    };
    stableFollowers := followersArr.toArray();
    let followingArr = List.empty<(Text, [Text])>();
    for (entry in following.entries()) {
      followingArr.add((entry.0, entry.1.toArray()));
    };
    stableFollowing := followingArr.toArray();
    let messagesArr = List.empty<(Text, [Message])>();
    for (entry in messages.entries()) {
      messagesArr.add((entry.0, entry.1.toArray()));
    };
    stableMessages := messagesArr.toArray();
    stableCoordinates := coordinatesStore.entries().toArray();
    stableLatestBroadcast := latestBroadcast;
    stablePurchaseSettings := purchaseSettings;
  };

  system func postupgrade() {
    for ((k, v) in stableUsers.values()) {
      users.add(k, v);
    };
    for ((k, v) in stablePrincipalToUserId.values()) {
      principalToUserId.add(k, v);
    };
    for ((k, arr) in stableFollowers.values()) {
      let list = List.empty<Text>();
      for (item in arr.values()) { list.add(item); };
      followers.add(k, list);
    };
    for ((k, arr) in stableFollowing.values()) {
      let list = List.empty<Text>();
      for (item in arr.values()) { list.add(item); };
      following.add(k, list);
    };
    for ((k, arr) in stableMessages.values()) {
      let list = List.empty<Message>();
      for (item in arr.values()) { list.add(item); };
      messages.add(k, list);
    };
    for ((k, v) in stableCoordinates.values()) {
      coordinatesStore.add(k, v);
    };
    latestBroadcast := stableLatestBroadcast;
    purchaseSettings := stablePurchaseSettings;
  };

  // ── Helper functions ────────────────────────────────────────────────────
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
      avatar = user.avatar;
      vipStatus = user.vipStatus;
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
      avatar = user.avatar;
      vipStatus = user.vipStatus;
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

  func hasUserPermission(_caller : Principal) : Bool {
    true;
  };

  public query func getPurchaseSettings() : async PurchaseSettings {
    purchaseSettings;
  };

  public shared func setPurchaseSettings(settings : PurchaseSettings) : async () {
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
              settings = profile.settings;
              avatar = profile.avatar;
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
      avatar = "";
      vipStatus = "none";
      principal = caller;
    };
    users.add(input.id, newUser);
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
    if (not verifyUserOwnership(caller, userId)) {
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

  // Admin deletes any user (no ICP identity check, matches admin password auth pattern)
  public shared func deleteUser(userId : Text) : async () {
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

  // User deletes their own account (verified by password hash)
  public shared func deleteOwnAccount(userId : Text, passwordHash : Text) : async Bool {
    switch (getUserInternal(userId)) {
      case (?user) {
        if (user.passwordHash != passwordHash) {
          return false;
        };
        principalToUserId.remove(user.principal);
        users.remove(userId);
        true;
      };
      case (null) { false };
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

  public func setOnlineStatus(userId : Text, online : Bool) : async User {
    
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
    if (not verifyUserOwnership(caller, userId)) {
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

  public query ({ caller }) func getCoordinates() : async ?Coordinates {
    coordinatesStore.get(caller);
  };

  public shared ({ caller }) func saveCoordinates(coordinates : Coordinates) : async () {
    coordinatesStore.add(caller, coordinates);
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

  public shared ({ caller }) func sendMessage(sender : Text, recipient : Text, text : Text) : async () {
    if (not verifyUserOwnership(caller, sender)) {
      Runtime.trap("Unauthorized: Can only send messages as yourself");
    };

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
    if (not verifyUserOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only view your own conversations");
    };

    let conversationKey = userId # "-" # otherUserId;
    switch (messages.get(conversationKey)) {
      case (?msgs) { msgs.toArray() };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getNewMessages(userId : Text, otherUserId : Text, lastTimestamp : Time.Time) : async [Message] {
    if (not verifyUserOwnership(caller, userId)) {
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

  public shared func updateUserRadiusTier(userId : Text, tier : Nat) : async User {
    
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

  public shared ({ caller }) func updateAvatar(userId : Text, avatar : Text) : async User {
    if (not verifyUserOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only update your own avatar");
    };

    switch (getUserInternal(userId)) {
      case (?user) {
        let updatedUser : UserInternal = {
          user with avatar;
        };
        users.add(userId, updatedUser);
        toPublicUser(updatedUser);
      };
      case (null) {
        Runtime.trap("User not found");
      };
    };
  };

  public shared func setUserVipStatus(userId : Text, status : Text) : async User {
    switch (getUserInternal(userId)) {
      case (?user) {
        let updatedUser : UserInternal = {
          user with vipStatus = status;
        };
        users.add(userId, updatedUser);
        toPublicUser(updatedUser);
      };
      case (null) {
        Runtime.trap("User not found");
      };
    };
  };

  public shared ({ caller }) func markConversationSeen(userId : Text, otherUserId : Text) : async () {
    if (not verifyUserOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only update your own messages");
    };

    let conversationKey = userId # "-" # otherUserId;
    switch (messages.get(conversationKey)) {
      case (?msgs) {
        let updatedMessages = List.empty<Message>();
        for (msg in msgs.values()) {
          if (msg.recipient == userId and not msg.seen) {
            updatedMessages.add({ msg with seen = true });
          } else {
            updatedMessages.add(msg);
          };
        };
        messages.add(conversationKey, updatedMessages);
      };
      case (null) {};
    };

    let senderConversationKey = otherUserId # "-" # userId;
    switch (messages.get(senderConversationKey)) {
      case (?msgs) {
        let updatedMessages = List.empty<Message>();
        for (msg in msgs.values()) {
          if (msg.sender == otherUserId and msg.recipient == userId and not msg.seen) {
            updatedMessages.add({ msg with seen = true });
          } else {
            updatedMessages.add(msg);
          };
        };
        messages.add(senderConversationKey, updatedMessages);
      };
      case (null) {};
    };
  };

  public query ({ caller }) func getUnreadCount(userId : Text, otherUserId : Text) : async Nat {
    if (not verifyUserOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only view your own messages");
    };

    let conversationKey = userId # "-" # otherUserId;
    switch (messages.get(conversationKey)) {
      case (?msgs) {
        let filtered = msgs.toArray().filter(
          func(msg) { msg.recipient == userId and not msg.seen }
        );
        filtered.size();
      };
      case (null) { 0 };
    };
  };

  public query ({ caller }) func getTotalUnreadCount(userId : Text) : async Nat {
    if (not verifyUserOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only view your own messages");
    };

    var totalUnread : Nat = 0;
    for ((key, msgs) in messages.entries()) {
      let parts = key.split(#char '-').toArray();
      if (parts.size() == 2 and parts[0] == userId) {
        let filtered = msgs.toArray().filter(
          func(msg) { msg.recipient == userId and not msg.seen }
        );
        totalUnread += filtered.size();
      };
    };
    totalUnread;
  };

  public shared ({ caller }) func deleteMessage(userId : Text, otherUserId : Text, timestamp : Time.Time) : async () {
    if (not verifyUserOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only delete your own messages");
    };

    let key1 = userId # "-" # otherUserId;
    switch (messages.get(key1)) {
      case (?msgs) {
        let updated = List.empty<Message>();
        for (msg in msgs.values()) {
          if (msg.timestamp != timestamp) { updated.add(msg); };
        };
        messages.add(key1, updated);
      };
      case (null) {};
    };

    let key2 = otherUserId # "-" # userId;
    switch (messages.get(key2)) {
      case (?msgs) {
        let updated = List.empty<Message>();
        for (msg in msgs.values()) {
          if (msg.timestamp != timestamp) { updated.add(msg); };
        };
        messages.add(key2, updated);
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func deleteConversation(userId : Text, otherUserId : Text) : async () {
    if (not verifyUserOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only delete your own conversations");
    };

    messages.remove(userId # "-" # otherUserId);
    messages.remove(otherUserId # "-" # userId);
  };

  public shared func broadcastMessage(text : Text) : async () {
    
    let now = Time.now();
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

  public query func getLatestBroadcast() : async ?{ text : Text; timestamp : Time.Time } {
    latestBroadcast;
  };
};

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

  let users = Map.empty<Text, UserInternal>();
  let principalToUserId = Map.empty<Principal, Text>();
  let followers = Map.empty<Text, List.List<Text>>();
  let following = Map.empty<Text, List.List<Text>>();

  var stripeConfiguration : ?Stripe.StripeConfiguration = null;
  var purchaseSettings : PurchaseSettings = {
    enabled = false;
    basicPrice = 0;
    standardPrice = 0;
    premiumPrice = 0;
  };

  // New coordinates field
  public type Coordinates = {
    latitude : Text;
    longitude : Text;
  };

  // New coordinates data store
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

  // Stripe Payment Integration

  // Check if Stripe is configured
  public query func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  // Set Stripe configuration (only admins)
  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set Stripe configuration");
    };
    stripeConfiguration := ?config;
  };

  // Get Stripe session status (authenticated users only)
  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
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

  // Create Stripe checkout session (authenticated users only)
  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
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

  // HTTP outcall transform function for Stripe responses
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Purchase Settings

  // Get purchase settings (public, no auth required)
  public query func getPurchaseSettings() : async PurchaseSettings {
    purchaseSettings;
  };

  // Set purchase settings (admin only)
  public shared ({ caller }) func setPurchaseSettings(settings : PurchaseSettings) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set purchase settings");
    };
    purchaseSettings := settings;
  };

  // Get caller's user profile (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
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

  // Save caller's user profile (required by frontend)
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
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

  // Get another user's profile (required by frontend)
  public query ({ caller }) func getUserProfile(userPrincipal : Principal) : async ?UserProfile {
    if (caller != userPrincipal and not Auth.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
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

  // Register a new user (authenticated users only, cannot self-assign admin)
  public shared ({ caller }) func register(input : UserInput) : async User {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can register");
    };
    switch (principalToUserId.get(caller)) {
      case (?_) {
        Runtime.trap("User already registered");
      };
      case (null) {};
    };

    // Check if username already exists
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
    principalToUserId.add(caller, input.id);
    toPublicUser(newUser);
  };

  // Verify user credentials (login) - public endpoint, no auth required
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

  // Get all users (for friend discovery) - authenticated users only, no sensitive data
  public query ({ caller }) func getAllUsers() : async [User] {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can discover friends");
    };
    let allUsers = users.values().toArray();
    allUsers.map(toPublicUser);
  };

  // Update user's location - only own location
  public shared ({ caller }) func updateLocation(userId : Text, location : LocationInput) : async User {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update location");
    };

    switch (principalToUserId.get(caller)) {
      case (?callerUserId) {
        if (callerUserId != userId and not Auth.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own location");
        };
      };
      case (null) {
        Runtime.trap("User not registered");
      };
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

  // Delete user (admin only)
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

  // Get user by ID - authenticated users only, no sensitive data
  public query ({ caller }) func getUserById(userId : Text) : async ?User {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };
    switch (users.get(userId)) {
      case (?user) { ?toPublicUser(user) };
      case (null) { null };
    };
  };

  // Get user by username - authenticated users only, no sensitive data
  public query ({ caller }) func getUserByUsername(username : Text) : async ?User {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };
    let allUsers = users.values().toArray();
    let foundUser = allUsers.find(
      func(user) { user.username == username }
    );
    switch (foundUser) {
      case (?user) { ?toPublicUser(user) };
      case (null) { null };
    };
  };

  // Mark user as online/offline - only own status
  public shared ({ caller }) func setOnlineStatus(userId : Text, online : Bool) : async User {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can set online status");
    };

    switch (principalToUserId.get(caller)) {
      case (?callerUserId) {
        if (callerUserId != userId and not Auth.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own online status");
        };
      };
      case (null) {
        Runtime.trap("User not registered");
      };
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

  // Update user settings - only own settings
  public shared ({ caller }) func updateSettings(userId : Text, settings : UserSettings) : async User {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update settings");
    };

    switch (principalToUserId.get(caller)) {
      case (?callerUserId) {
        if (callerUserId != userId and not Auth.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own settings");
        };
      };
      case (null) {
        Runtime.trap("User not registered");
      };
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

  // Save coordinates (authenticated users only)
  public shared ({ caller }) func saveCoordinates(coordinates : Coordinates) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save coordinates");
    };
    coordinatesStore.add(caller, coordinates);
  };

  // Get coordinates (authenticated users only, own coordinates)
  public query ({ caller }) func getCoordinates() : async ?Coordinates {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can get coordinates");
    };
    coordinatesStore.get(caller);
  };

  // Follow (authenticated users only)
  public shared ({ caller }) func follow(username : Text) : async Text {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can follow others");
    };

    // Extract own username from principalToUserId map
    let ownUsername : Text = switch (principalToUserId.get(caller)) {
      case (?userId) {
        switch (users.get(userId)) {
          case (?user) { user.username };
          case (null) { Runtime.trap("User not found") };
        };
      };
      case (null) { Runtime.trap("User not registered") };
    };

    // Update current user's following list
    let currentFollowing = switch (following.get(ownUsername)) {
      case (null) { List.empty<Text>() };
      case (?followingList) { followingList };
    };
    currentFollowing.add(username);
    following.add(ownUsername, currentFollowing);

    // Update target user's followers list
    let currentFollowers = switch (followers.get(username)) {
      case (null) { List.empty<Text>() };
      case (?followersList) { followersList };
    };
    currentFollowers.add(ownUsername);
    followers.add(username, currentFollowers);

    "Following " # username # " successfully!";
  };

  // Unfollow (authenticated users only)
  public shared ({ caller }) func unfollow(username : Text) : async Text {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can unfollow others");
    };

    // Extract own username from principalToUserId map
    let ownUsername : Text = switch (principalToUserId.get(caller)) {
      case (?userId) {
        switch (users.get(userId)) {
          case (?user) { user.username };
          case (null) { Runtime.trap("User not found") };
        };
      };
      case (null) { Runtime.trap("User not registered") };
    };

    // Update current user's following list
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

    // Update target user's followers list
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

  // Get following list (authenticated users only)
  public query ({ caller }) func getFollowing(username : Text) : async [Text] {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view following lists");
    };
    switch (following.get(username)) {
      case (?followingList) { followingList.toArray() };
      case (null) { [] };
    };
  };

  // Get followers list (authenticated users only)
  public query ({ caller }) func getFollowers(username : Text) : async [Text] {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view followers lists");
    };
    switch (followers.get(username)) {
      case (?followersList) { followersList.toArray() };
      case (null) { [] };
    };
  };
};

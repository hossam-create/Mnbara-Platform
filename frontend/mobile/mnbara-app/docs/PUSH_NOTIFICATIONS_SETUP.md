# Push Notifications Setup Guide

This guide covers the setup of push notifications for the MNBARA mobile app using Firebase Cloud Messaging (FCM) for Android and Apple Push Notification service (APNs) for iOS.

## Prerequisites

- Firebase project created at [Firebase Console](https://console.firebase.google.com)
- Apple Developer account (for iOS)
- Xcode installed (for iOS development)

## Android Setup (Firebase Cloud Messaging)

### 1. Firebase Project Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing one
3. Add an Android app with package name: `com.mnbara.app`
4. Download `google-services.json`
5. Place it in `android/app/google-services.json`

### 2. Android Build Configuration

Add to `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        // Add this line
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

Add to `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    // Firebase BoM
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

### 3. Android Manifest Updates

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <!-- Notification permissions -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    
    <application>
        <!-- FCM Default Channel -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="mnbara_general"/>
        
        <!-- FCM Default Icon -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_notification"/>
        
        <!-- FCM Default Color -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/notification_color"/>
    </application>
</manifest>
```

## iOS Setup (APNs)

### 1. Apple Developer Configuration

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to Certificates, Identifiers & Profiles
3. Create an APNs Key:
   - Go to Keys → Create a new key
   - Enable "Apple Push Notifications service (APNs)"
   - Download the `.p8` file (save it securely!)
   - Note the Key ID

### 2. Firebase iOS Configuration

1. In Firebase Console, add an iOS app
2. Bundle ID: `com.mnbara.app`
3. Download `GoogleService-Info.plist`
4. Place it in `ios/mnbaraApp/GoogleService-Info.plist`
5. Upload APNs key to Firebase:
   - Project Settings → Cloud Messaging → iOS app configuration
   - Upload the `.p8` file
   - Enter Key ID and Team ID

### 3. Xcode Configuration

1. Open `ios/mnbaraApp.xcworkspace` in Xcode
2. Select the project target
3. Go to "Signing & Capabilities"
4. Add capabilities:
   - Push Notifications
   - Background Modes → Remote notifications

### 4. AppDelegate Configuration

Update `ios/mnbaraApp/AppDelegate.mm`:

```objc
#import <Firebase.h>
#import <UserNotifications/UserNotifications.h>
#import <RNCPushNotificationIOS.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  
  // Request notification permissions
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;
  
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// Required for remote notifications
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  [FIRMessaging messaging].APNSToken = deviceToken;
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  NSLog(@"Failed to register for remote notifications: %@", error);
}

// Handle notification when app is in foreground
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  completionHandler(UNNotificationPresentationOptionSound | UNNotificationPresentationOptionBanner | UNNotificationPresentationOptionList);
}

// Handle notification tap
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler
{
  completionHandler();
}

@end
```

### 5. Podfile Updates

Add to `ios/Podfile`:

```ruby
pod 'Firebase', :modular_headers => true
pod 'FirebaseCore', :modular_headers => true
pod 'FirebaseMessaging', :modular_headers => true
pod 'GoogleUtilities', :modular_headers => true

# Required for notifee
$NotifeeExtension = true
```

Then run:
```bash
cd ios && pod install
```

## Backend Integration

### Notification Service Endpoints

The mobile app communicates with the notification-service backend:

```
POST /api/notifications/register-device
Body: { token: string, platform: 'ios' | 'android' }

DELETE /api/notifications/unregister-device
Body: { token: string }

GET /api/notifications/preferences
Response: { pushEnabled, emailEnabled, orderUpdates, auctionAlerts, ... }

PATCH /api/notifications/preferences
Body: { pushEnabled?: boolean, auctionAlerts?: boolean, ... }
```

### Server-Side FCM Integration

The backend notification-service should use Firebase Admin SDK:

```javascript
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Send notification
await admin.messaging().send({
  token: deviceToken,
  notification: {
    title: 'You\'ve been outbid!',
    body: 'Someone placed a higher bid on "iPhone 15 Pro"',
  },
  data: {
    type: 'outbid',
    auctionId: '123',
  },
  android: {
    priority: 'high',
    notification: {
      channelId: 'mnbara_auctions',
    },
  },
  apns: {
    payload: {
      aps: {
        sound: 'default',
        badge: 1,
      },
    },
  },
});
```

## Testing

### Local Testing

1. Use Firebase Console to send test messages:
   - Go to Cloud Messaging → Send your first message
   - Enter FCM token from app logs
   - Send test notification

2. Use the app's debug mode:
   ```javascript
   // In development, log the FCM token
   const token = await messaging().getToken();
   console.log('FCM Token:', token);
   ```

### Notification Types

| Type | Channel | Priority | Description |
|------|---------|----------|-------------|
| outbid | auctions | HIGH | User has been outbid |
| ending_soon | auctions | HIGH | Auction ending in 2 minutes |
| auction_won | auctions | HIGH | User won an auction |
| order_status | orders | DEFAULT | Order status update |
| delivery_update | orders | DEFAULT | Delivery progress |
| new_request | traveler | HIGH | New delivery request nearby |

## Troubleshooting

### Android Issues

1. **Notifications not received**: Check `google-services.json` is in correct location
2. **Channel not found**: Ensure channels are created before sending notifications
3. **Background handler not called**: Check `AndroidManifest.xml` has correct service declarations

### iOS Issues

1. **APNs token not received**: Verify Push Notifications capability is enabled
2. **Notifications not showing**: Check notification permissions in device settings
3. **Background notifications**: Ensure Background Modes → Remote notifications is enabled

### Common Issues

1. **Token refresh**: Handle token refresh events to update server
2. **Permission denied**: Guide users to enable notifications in settings
3. **Duplicate notifications**: Ensure proper handling of foreground vs background messages

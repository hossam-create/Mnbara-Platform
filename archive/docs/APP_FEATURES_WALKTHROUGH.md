# ط´ط±ط­ ظ…ظٹط²ط§طھ طھط·ط¨ظٹظ‚ Mnbarh

## ًںڈ  ط§ظ„ط´ط§ط´ط© ط§ظ„ط±ط¦ظٹط³ظٹط© (Home Screen)

### ط§ظ„ظ…ظƒظˆظ†ط§طھ ط§ظ„ط±ط¦ظٹط³ظٹط©:
1. **ط´ط±ظٹط· ط§ظ„ط¨ط­ط«** - ط§ظ„ط¨ط­ط« ط¹ظ† ط§ظ„ظ…ظ†طھط¬ط§طھ
2. **ط§ظ„ظپط¦ط§طھ** - طھطµظپط­ ط§ظ„ظپط¦ط§طھ ط§ظ„ظ…ط®طھظ„ظپط©
3. **ط§ظ„ط¹ط±ظˆط¶ ط§ظ„ط­ظٹط©** - Live Deals Section
4. **ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„ظ…ظˆطµظ‰ ط¨ظ‡ط§** - AI Recommendations
5. **ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„ط´ظ‡ظٹط±ط©** - Trending Products
6. **ط§ظ„ظ…ظ„ط­ظ‚ط§طھ** - Endless Accessories

### ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظ…ط±طھط¨ط·ط©:
```
lib/features/home/
â”œâ”€â”€ screens/home_screen.dart
â”œâ”€â”€ screens/main_screen.dart
â”œâ”€â”€ widgets/search_bar_widget.dart
â””â”€â”€ widgets/home_app_bar.dart
```

---

## ًں”چ ط§ظ„ط¨ط­ط« ظˆط§ظ„طھطµظپظٹط© (Search)

### ط§ظ„ظ…ظٹط²ط§طھ:
- ط§ظ„ط¨ط­ط« ط§ظ„ظ…طھظ‚ط¯ظ… ط¨ظ€ Elasticsearch
- طھطµظپظٹط© ط­ط³ط¨ ط§ظ„ط³ط¹ط± ظˆط§ظ„ظپط¦ط© ظˆط§ظ„ط¹ظ„ط§ظ…ط© ط§ظ„طھط¬ط§ط±ظٹط©
- ط§ظ„ظپط±ط² ط­ط³ط¨ ط§ظ„ط£ظپط¶ظ„ ظˆط§ظ„ط³ط¹ط± ظˆط§ظ„ظ…ط³ط§ظپط©
- ط§ظ‚طھط±ط§ط­ط§طھ ط§ظ„ط¨ط­ط« ط§ظ„ط°ظƒظٹط©

### ط§ظ„ظ…ظ„ظپط§طھ:
```
lib/features/search/
â”œâ”€â”€ screens/search_screen.dart
â”œâ”€â”€ providers/search_provider.dart
â””â”€â”€ widgets/
    â”œâ”€â”€ search_bar.dart
    â”œâ”€â”€ search_filters.dart
    â””â”€â”€ search_results.dart
```

---

## ًں›چï¸ڈ ط§ظ„ظ…ظ†طھط¬ط§طھ ظˆط§ظ„ط³ظ„ط© (Products & Cart)

### ط¹ط±ط¶ ط§ظ„ظ…ظ†طھط¬ط§طھ:
- طµظˆط± ط¹ط§ظ„ظٹط© ط§ظ„ط¬ظˆط¯ط©
- ط§ظ„طھظ‚ظٹظٹظ…ط§طھ ظˆط§ظ„ظ…ط±ط§ط¬ط¹ط§طھ
- ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط¨ط§ط¦ط¹
- ط®ظٹط§ط±ط§طھ ط§ظ„ط´ط±ط§ط، (Buy Now, Auction, Make Offer)

### ط§ظ„ط³ظ„ط©:
- ط¥ط¶ط§ظپط©/ط­ط°ظپ ط§ظ„ظ…ظ†طھط¬ط§طھ
- طھط¹ط¯ظٹظ„ ط§ظ„ظƒظ…ظٹط©
- ط­ط³ط§ط¨ ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ ظˆط§ظ„ط¶ط±ط§ط¦ط¨
- ط§ظ„ط§ظ†طھظ‚ط§ظ„ ظ„ظ„ط¯ظپط¹

### ط§ظ„ظ…ظ„ظپط§طھ:
```
lib/features/
â”œâ”€â”€ products/
â”‚   â”œâ”€â”€ screens/product_details_screen.dart
â”‚   â”œâ”€â”€ models/product_model.dart
â”‚   â””â”€â”€ services/product_service.dart
â””â”€â”€ cart/
    â”œâ”€â”€ screens/cart_screen.dart
    â”œâ”€â”€ providers/cart_provider.dart
    â””â”€â”€ models/cart_model.dart
```

---

## ًں’³ ط§ظ„ط¯ظپط¹ ظˆط§ظ„ط·ظ„ط¨ط§طھ (Checkout & Orders)

### ط®ط·ظˆط§طھ ط§ظ„ط¯ظپط¹:
1. ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط³ظ„ط©
2. ط¥ط¯ط®ط§ظ„ ط¹ظ†ظˆط§ظ† ط§ظ„طھط³ظ„ظٹظ…
3. ط§ط®طھظٹط§ط± ط·ط±ظٹظ‚ط© ط§ظ„ط´ط­ظ†
4. ط§ط®طھظٹط§ط± ط·ط±ظٹظ‚ط© ط§ظ„ط¯ظپط¹
5. طھط£ظƒظٹط¯ ط§ظ„ط·ظ„ط¨

### ط·ط±ظ‚ ط§ظ„ط¯ظپط¹ ط§ظ„ظ…ط¯ط¹ظˆظ…ط©:
- Stripe (ط¨ط·ط§ظ‚ط§طھ ط§ط¦طھظ…ط§ظ†)
- PayPal
- Crypto (Bitcoin, Ethereum)
- BNPL (Buy Now Pay Later)

### ط§ظ„ظ…ظ„ظپط§طھ:
```
lib/features/
â”œâ”€â”€ checkout/
â”‚   â”œâ”€â”€ screens/checkout_screen.dart
â”‚   â”œâ”€â”€ screens/payment_screen.dart
â”‚   â””â”€â”€ screens/order_success_screen.dart
â””â”€â”€ orders/
    â”œâ”€â”€ screens/orders_screen.dart
    â”œâ”€â”€ screens/order_details_screen.dart
    â””â”€â”€ models/order_model.dart
```

---

## ًں‘¤ ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط®طµظٹ (Profile)

### ط§ظ„ظ…ط¹ظ„ظˆظ…ط§طھ:
- ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…
- ط§ظ„ط¹ظ†ط§ظˆظٹظ† ط§ظ„ظ…ط­ظپظˆط¸ط©
- ط§ظ„ط·ظ„ط¨ط§طھ ط§ظ„ط³ط§ط¨ظ‚ط©
- ط§ظ„ظ…ظپط¶ظ„ط©
- ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ

### ط§ظ„ظ…ظ„ظپط§طھ:
```
lib/features/profile/
â”œâ”€â”€ screens/profile_screen.dart
â”œâ”€â”€ screens/edit_profile_screen.dart
â”œâ”€â”€ screens/addresses_screen.dart
â”œâ”€â”€ screens/add_address_screen.dart
â””â”€â”€ providers/address_provider.dart
```

---

## ًںژ¤ ط§ظ„ط¨ط­ط« ط¨ط§ظ„طµظˆطھ (Voice Search)

### ط§ظ„ظ…ظٹط²ط§طھ:
- طھط­ظˆظٹظ„ ط§ظ„طµظˆطھ ط¥ظ„ظ‰ ظ†طµ
- ط§ظ„ط¨ط­ط« ط§ظ„ظپظˆط±ظٹ
- ط§ظ„ط£ظˆط§ظ…ط± ط§ظ„طµظˆطھظٹط©

### ط§ظ„ظ…ظ„ظپط§طھ:
```
lib/features/voice_commerce/
â”œâ”€â”€ screens/voice_search_screen.dart
â”œâ”€â”€ services/voice_service.dart
â””â”€â”€ models/voice_model.dart
```

---

## ًں“چ ط§ظ„طھطھط¨ط¹ ط§ظ„ط­ظٹ (Live Tracking)

### ط§ظ„ظ…ظٹط²ط§طھ:
- طھطھط¨ط¹ ط§ظ„ط·ظ„ط¨ ظپظٹ ط§ظ„ظˆظ‚طھ ط§ظ„ظپط¹ظ„ظٹ
- ظ…ظˆظ‚ط¹ ط§ظ„ظ…ظ†ط¯ظˆط¨ ط¹ظ„ظ‰ ط§ظ„ط®ط±ظٹط·ط©
- ط¥ط´ط¹ط§ط±ط§طھ ط§ظ„طھط­ط¯ظٹط«
- ط¥ط«ط¨ط§طھ ط§ظ„طھط³ظ„ظٹظ…

### ط§ظ„ظ…ظ„ظپط§طھ:
```
lib/features/buyer/
â”œâ”€â”€ screens/live_tracking_screen.dart
â”œâ”€â”€ services/location_websocket_service.dart
â”œâ”€â”€ providers/location_tracking_provider.dart
â””â”€â”€ models/traveler_location_model.dart
```

---

## ًںڈھ ط§ظ„ط¨ظٹط¹ ظˆط§ظ„ظ…طھط¬ط± (Seller)

### ط¥ظ†ط´ط§ط، ظ‚ط§ط¦ظ…ط©:
- ط§ط®طھظٹط§ط± ط§ظ„ظپط¦ط©
- ط¥ط¯ط®ط§ظ„ ط§ظ„طھظپط§طµظٹظ„
- ط±ظپط¹ ط§ظ„طµظˆط±
- طھط­ط¯ظٹط¯ ط§ظ„ط³ط¹ط±
- ط§ط®طھظٹط§ط± ظ†ظˆط¹ ط§ظ„ط¨ظٹط¹ (Auction/Buy Now)

### ط¥ط¯ط§ط±ط© ط§ظ„ظ…طھط¬ط±:
- ط¹ط±ط¶ ط§ظ„ظ‚ظˆط§ط¦ظ…
- طھط­ظ„ظٹظ„ط§طھ ط§ظ„ظ…ط¨ظٹط¹ط§طھ
- ط¥ط¯ط§ط±ط© ط§ظ„ط·ظ„ط¨ط§طھ
- طھظ‚ظٹظٹظ…ط§طھ ط§ظ„ط¨ط§ط¦ط¹

### ط§ظ„ظ…ظ„ظپط§طھ:
```
lib/features/seller/
â”œâ”€â”€ screens/seller_dashboard_screen.dart
â”œâ”€â”€ screens/create_listing_screen.dart
â”œâ”€â”€ screens/my_listings_screen.dart
â””â”€â”€ screens/seller_analytics_screen.dart
```

---

## ًں¤– ط§ظ„ظ…ظٹط²ط§طھ ط§ظ„ظ…طھظ‚ط¯ظ…ط©

### 1. ظ…ط¹ط§ظٹظ†ط© AR
```
lib/features/ar_preview/
â”œâ”€â”€ screens/ar_preview_screen.dart
â””â”€â”€ services/ar_service.dart
```

### 2. ط¹ط±ط¶ VR
```
lib/features/vr_showroom/
â”œâ”€â”€ screens/vr_showroom_screen.dart
â””â”€â”€ services/vr_service.dart
```

### 3. ط§ظ„طھظˆطµظٹط§طھ ط¨ظ€ AI
```
lib/features/smart_buyer/
â”œâ”€â”€ screens/smart_buyer_screen.dart
â”œâ”€â”€ services/smart_buyer_service.dart
â””â”€â”€ providers/smart_buyer_provider.dart
```

### 4. ط§ظ„ظ…ط­ظپط¸ط© ظˆط§ظ„ط¹ظ…ظ„ط§طھ ط§ظ„ط±ظ‚ظ…ظٹط©
```
lib/features/crypto_wallet/
â”œâ”€â”€ screens/crypto_wallet_screen.dart
â””â”€â”€ services/crypto_service.dart
```

---

## ًں“ٹ ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ ظˆط§ظ„طھط­ظ„ظٹظ„ط§طھ

### ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…:
- ط¹ط¯ط¯ ط§ظ„ط·ظ„ط¨ط§طھ
- ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¨ظٹط¹ط§طھ
- ظ…ط¹ط¯ظ„ ط§ظ„طھط­ظˆظٹظ„
- ط£ظپط¶ظ„ ط§ظ„ظ…ظ†طھط¬ط§طھ

### ط§ظ„ظ…ظ„ظپط§طھ:
```
lib/features/analytics/
â”œâ”€â”€ screens/analytics_dashboard_screen.dart
â””â”€â”€ services/analytics_service.dart
```

---

## ًں”” ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ

### ط£ظ†ظˆط§ط¹ ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ:
- طھط­ط¯ظٹط«ط§طھ ط§ظ„ط·ظ„ط¨ط§طھ
- ط¹ط±ظˆط¶ ط®ط§طµط©
- ط±ط³ط§ط¦ظ„ ظ…ظ† ط§ظ„ط¨ط§ط¦ط¹
- طھظ†ط¨ظٹظ‡ط§طھ ط§ظ„ط£ط³ط¹ط§ط±

### ط§ظ„ظ…ظ„ظپط§طھ:
```
lib/features/notifications/
â”œâ”€â”€ screens/notifications_screen.dart
â”œâ”€â”€ screens/notification_settings_screen.dart
â””â”€â”€ providers/notifications_provider.dart
```

---

## âڑ™ï¸ڈ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ

### ط§ظ„ط®ظٹط§ط±ط§طھ:
- ط§ظ„ظ„ط؛ط© ظˆط§ظ„ظ…ظ†ط·ظ‚ط© ط§ظ„ط²ظ…ظ†ظٹط©
- ط¥ط´ط¹ط§ط±ط§طھ
- ط§ظ„ط®طµظˆطµظٹط©
- ط§ظ„ط£ظ…ط§ظ†
- طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬

### ط§ظ„ظ…ظ„ظپط§طھ:
```
lib/features/settings/
â”œâ”€â”€ screens/settings_screen.dart
â””â”€â”€ providers/settings_provider.dart
```

---

**ط¢ط®ط± طھط­ط¯ظٹط«:** 28 ط¯ظٹط³ظ…ط¨ط± 2025


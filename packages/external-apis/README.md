# @mnbara/external-apis

Centralized external APIs integration package for all Mnbara microservices. Provides unified interfaces for maps, payments, notifications, validation, and data services.

## Features

- 🗺️ **Maps & Geocoding**: Google Maps, Mapbox, HERE Maps, OpenStreetMap
- 💳 **Payments**: Stripe, PayPal, Wise
- 💱 **Currency**: Real-time exchange rates
- 📧 **Notifications**: Email (SendGrid), SMS (Twilio, Vonage), Push (Firebase)
- ✅ **Validation**: Email, Phone, Address validation
- 🌤️ **Data**: Weather information
- 🔄 **Built-in Retry Logic**: Automatic retries with exponential backoff
- 💾 **Caching**: Configurable TTL-based caching
- 🛡️ **Error Handling**: Comprehensive error types and handling

## Installation

```bash
npm install @mnbara/external-apis
```

## Configuration

Set up environment variables in your `.env` file:

```env
# Maps
GOOGLE_MAPS_API_KEY=your_key
MAPBOX_API_KEY=your_key
HERE_MAPS_API_KEY=your_key

# Payments
STRIPE_SECRET_KEY=your_key
PAYPAL_CLIENT_ID=your_key
WISE_API_KEY=your_key
EXCHANGE_RATE_API_KEY=your_key

# Notifications
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
SENDGRID_API_KEY=your_key
FIREBASE_SERVER_KEY=your_key
VONAGE_API_KEY=your_key

# Validation
EMAIL_VALIDATION_API_KEY=your_key
PHONE_VALIDATION_API_KEY=your_key
ADDRESS_VALIDATION_API_KEY=your_key

# Data
WEATHER_API_KEY=your_key

# Global
ENABLE_API_CACHE=true
```

## Usage

### Maps & Geocoding

```typescript
import { MapsService } from '@mnbara/external-apis';

// Initialize with provider (google, mapbox, here, osm)
const mapsService = new MapsService('google');

// Geocode an address
const location = await mapsService.geocode('1600 Amphitheatre Parkway, Mountain View, CA');
if (location.success) {
  console.log(location.data); // { latitude, longitude, address }
}

// Reverse geocode
const address = await mapsService.reverseGeocode(37.4224764, -122.0842499);

// Get route between two points
const route = await mapsService.getRoute(origin, destination);
if (route.success) {
  console.log(`Distance: ${route.data.distance}m`);
  console.log(`Duration: ${route.data.duration}s`);
}

// Calculate distance
const distance = await mapsService.getDistance(origin, destination);
```

### Payments

```typescript
import { PaymentService, CurrencyService } from '@mnbara/external-apis';

// Initialize payment service
const paymentService = new PaymentService('stripe');

// Create payment intent
const payment = await paymentService.createPaymentIntent(100, 'USD', {
  orderId: '12345',
});

if (payment.success) {
  console.log(payment.data.clientSecret); // Use in frontend
}

// Capture payment
await paymentService.capturePayment(payment.data.id);

// Refund payment
await paymentService.refundPayment(payment.data.id, 50); // Partial refund

// Currency conversion
const currencyService = new CurrencyService();
const rate = await currencyService.getExchangeRate('USD', 'EUR');
const converted = await currencyService.convertAmount(100, 'USD', 'EUR');
```

### Notifications

```typescript
import { 
  SmsService, 
  EmailService, 
  PushNotificationService 
} from '@mnbara/external-apis';

// SMS
const smsService = new SmsService('twilio');
await smsService.sendSms({
  to: '+1234567890',
  body: 'Your verification code is 123456',
});

// Email
const emailService = new EmailService();
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to Mnbara',
  body: 'Thank you for signing up!',
  html: '<h1>Welcome!</h1><p>Thank you for signing up!</p>',
});

// Push Notifications
const pushService = new PushNotificationService();
await pushService.sendPushNotification({
  token: 'device_token',
  title: 'New Order',
  body: 'You have a new order #12345',
  data: { orderId: '12345' },
});

// Send to topic
await pushService.sendToTopic('all-users', {
  title: 'Announcement',
  body: 'New features available!',
});
```

### Validation

```typescript
import { 
  EmailValidationService,
  PhoneValidationService,
  AddressValidationService 
} from '@mnbara/external-apis';

// Email validation
const emailValidator = new EmailValidationService();
const emailResult = await emailValidator.validateEmail('user@example.com');
if (emailResult.success && emailResult.data.valid) {
  console.log('Email is valid');
  console.log('Disposable:', emailResult.data.disposable);
}

// Phone validation
const phoneValidator = new PhoneValidationService();
const phoneResult = await phoneValidator.validatePhone('+1234567890');
if (phoneResult.success && phoneResult.data.valid) {
  console.log('Phone is valid');
  console.log('Carrier:', phoneResult.data.carrier);
}

// Address validation
const addressValidator = new AddressValidationService();
const addressResult = await addressValidator.validateAddress('123 Main St, City, State');
if (addressResult.success && addressResult.data.valid) {
  console.log('Normalized:', addressResult.data.normalized);
}
```

### Weather Data

```typescript
import { WeatherService } from '@mnbara/external-apis';

const weatherService = new WeatherService();

// Current weather
const weather = await weatherService.getCurrentWeather({
  latitude: 37.4224764,
  longitude: -122.0842499,
});

if (weather.success) {
  console.log(`Temperature: ${weather.data.temperature}°C`);
  console.log(`Condition: ${weather.data.condition}`);
}

// 5-day forecast
const forecast = await weatherService.getForecast(location, 5);
```

## Integration Examples

### For Trips Service (Crowdshipping)

```typescript
import { MapsService } from '@mnbara/external-apis';

export class TripsService {
  private mapsService: MapsService;

  constructor() {
    this.mapsService = new MapsService('google');
  }

  async calculateTripDistance(pickup: string, dropoff: string) {
    const pickupLocation = await this.mapsService.geocode(pickup);
    const dropoffLocation = await this.mapsService.geocode(dropoff);
    
    if (pickupLocation.success && dropoffLocation.success) {
      const distance = await this.mapsService.getDistance(
        pickupLocation.data,
        dropoffLocation.data
      );
      return distance.data; // Distance in meters
    }
  }
}
```

### For Payment Service (Financial)

```typescript
import { PaymentService, CurrencyService } from '@mnbara/external-apis';

export class PaymentProcessor {
  private paymentService: PaymentService;
  private currencyService: CurrencyService;

  constructor() {
    this.paymentService = new PaymentService('stripe');
    this.currencyService = new CurrencyService();
  }

  async processPayment(amount: number, currency: string) {
    // Convert to USD if needed
    let finalAmount = amount;
    if (currency !== 'USD') {
      const converted = await this.currencyService.convertAmount(
        amount,
        currency,
        'USD'
      );
      if (converted.success) {
        finalAmount = converted.data;
      }
    }

    // Create payment
    return await this.paymentService.createPaymentIntent(finalAmount, 'USD');
  }
}
```

### For Notification Service

```typescript
import { EmailService, SmsService } from '@mnbara/external-apis';

export class NotificationService {
  private emailService: EmailService;
  private smsService: SmsService;

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SmsService('twilio');
  }

  async sendOrderConfirmation(order: Order, user: User) {
    // Send email
    await this.emailService.sendEmail({
      to: user.email,
      subject: `Order Confirmation #${order.id}`,
      html: this.generateOrderEmailTemplate(order),
    });

    // Send SMS if phone provided
    if (user.phone) {
      await this.smsService.sendSms({
        to: user.phone,
        body: `Your order #${order.id} has been confirmed!`,
      });
    }
  }
}
```

### For User Service (Validation)

```typescript
import { 
  EmailValidationService,
  PhoneValidationService 
} from '@mnbara/external-apis';

export class UserService {
  private emailValidator: EmailValidationService;
  private phoneValidator: PhoneValidationService;

  constructor() {
    this.emailValidator = new EmailValidationService();
    this.phoneValidator = new PhoneValidationService();
  }

  async validateUserData(email: string, phone: string) {
    const [emailResult, phoneResult] = await Promise.all([
      this.emailValidator.validateEmail(email),
      this.phoneValidator.validatePhone(phone),
    ]);

    return {
      emailValid: emailResult.success && emailResult.data.valid,
      phoneValid: phoneResult.success && phoneResult.data.valid,
      emailDisposable: emailResult.data?.disposable,
    };
  }
}
```

## Error Handling

```typescript
import { 
  ExternalApiError,
  RateLimitError,
  AuthenticationError 
} from '@mnbara/external-apis';

try {
  const result = await mapsService.geocode(address);
  
  if (!result.success) {
    // Handle API error
    console.error(result.error);
  }
} catch (error) {
  if (error instanceof RateLimitError) {
    // Handle rate limit
    console.log('Rate limit exceeded, retry later');
  } else if (error instanceof AuthenticationError) {
    // Handle auth error
    console.log('Invalid API key');
  } else if (error instanceof ExternalApiError) {
    // Handle other API errors
    console.log(error.code, error.message);
  }
}
```

## Caching

The package includes built-in caching for GET requests:

```typescript
import { cache } from '@mnbara/external-apis';

// Clear cache
cache.clear();

// Delete specific key
cache.delete('geocode:google:address');

// Get cache stats
const stats = cache.getStats();
console.log(`Cache size: ${stats.size}`);
```

## Health Checks

```typescript
const isHealthy = await mapsService.healthCheck();
console.log('Service healthy:', isHealthy);
```

## Microservices Integration Matrix

| Service | Maps | Payments | Currency | Notifications | Validation | Weather |
|---------|------|----------|----------|---------------|------------|---------|
| trips-service | ✅ | | | ✅ | | |
| matching-service | ✅ | | | | | |
| payment-service | | ✅ | ✅ | ✅ | | |
| wallet-service | | ✅ | ✅ | ✅ | | |
| user-service | | | | ✅ | ✅ | |
| auth-service | | | | ✅ | ✅ | |
| notification-service | | | | ✅ | | |
| product-service | | | ✅ | | | |
| order-service | | ✅ | ✅ | ✅ | | |

## License

MIT

## Support

For issues or questions, contact the Mnbara Platform team.

# External APIs Integration Examples

Complete integration examples for all 87 Mnbara microservices.

## Phase 1 Services (Core MVP)

### 1. trips-service (Crowdshipping)

```typescript
// services/crowdshipping/trips-service/src/services/trip-calculator.service.ts
import { MapsService } from '@mnbara/external-apis';

export class TripCalculatorService {
  private mapsService: MapsService;

  constructor() {
    this.mapsService = new MapsService('google');
  }

  async calculateTripDetails(pickupAddress: string, dropoffAddress: string) {
    const [pickup, dropoff] = await Promise.all([
      this.mapsService.geocode(pickupAddress),
      this.mapsService.geocode(dropoffAddress),
    ]);

    if (!pickup.success || !dropoff.success) {
      throw new Error('Failed to geocode addresses');
    }

    const route = await this.mapsService.getRoute(pickup.data, dropoff.data);

    return {
      pickup: pickup.data,
      dropoff: dropoff.data,
      distance: route.data.distance,
      duration: route.data.duration,
      estimatedCost: this.calculateCost(route.data.distance),
    };
  }

  private calculateCost(distanceInMeters: number): number {
    const distanceInKm = distanceInMeters / 1000;
    const baseFare = 5;
    const perKmRate = 2;
    return baseFare + (distanceInKm * perKmRate);
  }
}
```

### 2. matching-service (Crowdshipping)

```typescript
// services/crowdshipping/matching-service/src/services/route-matcher.service.ts
import { MapsService } from '@mnbara/external-apis';

export class RouteMatcherService {
  private mapsService: MapsService;

  constructor() {
    this.mapsService = new MapsService('google');
  }

  async findMatchingTrips(deliveryRequest: DeliveryRequest, availableTrips: Trip[]) {
    const requestLocation = await this.mapsService.geocode(deliveryRequest.pickupAddress);

    const matches = await Promise.all(
      availableTrips.map(async (trip) => {
        const tripLocation = await this.mapsService.geocode(trip.origin);
        const distance = await this.mapsService.getDistance(
          requestLocation.data,
          tripLocation.data
        );

        return {
          trip,
          distance: distance.data,
          score: this.calculateMatchScore(distance.data, trip),
        };
      })
    );

    return matches
      .filter(m => m.distance < 5000) // Within 5km
      .sort((a, b) => b.score - a.score);
  }

  private calculateMatchScore(distance: number, trip: Trip): number {
    // Lower distance = higher score
    return 100 - (distance / 100);
  }
}
```

### 3. payment-service (Financial)

```typescript
// services/financial/payment-service/src/services/payment-processor.service.ts
import { PaymentService, CurrencyService } from '@mnbara/external-apis';

export class PaymentProcessorService {
  private stripeService: PaymentService;
  private paypalService: PaymentService;
  private currencyService: CurrencyService;

  constructor() {
    this.stripeService = new PaymentService('stripe');
    this.paypalService = new PaymentService('paypal');
    this.currencyService = new CurrencyService();
  }

  async processPayment(
    amount: number,
    currency: string,
    provider: 'stripe' | 'paypal',
    metadata?: any
  ) {
    const service = provider === 'stripe' ? this.stripeService : this.paypalService;

    // Convert to USD if needed
    let finalAmount = amount;
    let finalCurrency = currency;

    if (currency !== 'USD') {
      const converted = await this.currencyService.convertAmount(amount, currency, 'USD');
      if (converted.success) {
        finalAmount = converted.data;
        finalCurrency = 'USD';
      }
    }

    return await service.createPaymentIntent(finalAmount, finalCurrency, metadata);
  }

  async refundPayment(paymentId: string, amount?: number, provider: 'stripe' | 'paypal' = 'stripe') {
    const service = provider === 'stripe' ? this.stripeService : this.paypalService;
    return await service.refundPayment(paymentId, amount);
  }
}
```

### 4. wallet-service (Financial)

```typescript
// services/financial/wallet-service/src/services/currency-converter.service.ts
import { CurrencyService } from '@mnbara/external-apis';

export class CurrencyConverterService {
  private currencyService: CurrencyService;

  constructor() {
    this.currencyService = new CurrencyService();
  }

  async convertWalletBalance(balance: number, fromCurrency: string, toCurrency: string) {
    const rate = await this.currencyService.getExchangeRate(fromCurrency, toCurrency);
    
    if (rate.success) {
      const converted = await this.currencyService.convertAmount(balance, fromCurrency, toCurrency);
      
      return {
        originalAmount: balance,
        originalCurrency: fromCurrency,
        convertedAmount: converted.data,
        convertedCurrency: toCurrency,
        exchangeRate: rate.data.rate,
        timestamp: rate.data.timestamp,
      };
    }

    throw new Error('Currency conversion failed');
  }

  async getSupportedCurrencies() {
    // Return list of supported currencies
    return ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP'];
  }
}
```

### 5. notification-service

```typescript
// services/core/notification-service/src/services/multi-channel-notifier.service.ts
import { 
  EmailService, 
  SmsService, 
  PushNotificationService 
} from '@mnbara/external-apis';

export class MultiChannelNotifierService {
  private emailService: EmailService;
  private smsService: SmsService;
  private pushService: PushNotificationService;

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SmsService('twilio');
    this.pushService = new PushNotificationService();
  }

  async sendOrderNotification(order: Order, user: User) {
    const promises = [];

    // Email notification
    if (user.email) {
      promises.push(
        this.emailService.sendEmail({
          to: user.email,
          subject: `Order #${order.id} Confirmed`,
          html: this.generateOrderEmailTemplate(order),
        })
      );
    }

    // SMS notification
    if (user.phone && user.preferences.smsNotifications) {
      promises.push(
        this.smsService.sendSms({
          to: user.phone,
          body: `Your order #${order.id} has been confirmed! Track it at: ${order.trackingUrl}`,
        })
      );
    }

    // Push notification
    if (user.deviceToken) {
      promises.push(
        this.pushService.sendPushNotification({
          token: user.deviceToken,
          title: 'Order Confirmed',
          body: `Order #${order.id} is being processed`,
          data: { orderId: order.id, type: 'order_confirmation' },
        })
      );
    }

    await Promise.allSettled(promises);
  }

  async sendBulkAnnouncement(title: string, message: string, topic: string = 'all-users') {
    return await this.pushService.sendToTopic(topic, {
      title,
      body: message,
      data: { type: 'announcement' },
    });
  }

  private generateOrderEmailTemplate(order: Order): string {
    return `
      <h1>Order Confirmation</h1>
      <p>Thank you for your order!</p>
      <p>Order ID: ${order.id}</p>
      <p>Total: ${order.total} ${order.currency}</p>
    `;
  }
}
```

### 6. user-service

```typescript
// services/core/user-service/src/services/user-validator.service.ts
import { 
  EmailValidationService,
  PhoneValidationService 
} from '@mnbara/external-apis';

export class UserValidatorService {
  private emailValidator: EmailValidationService;
  private phoneValidator: PhoneValidationService;

  constructor() {
    this.emailValidator = new EmailValidationService();
    this.phoneValidator = new PhoneValidationService();
  }

  async validateUserRegistration(email: string, phone: string) {
    const [emailResult, phoneResult] = await Promise.all([
      this.emailValidator.validateEmail(email),
      this.phoneValidator.validatePhone(phone),
    ]);

    const errors = [];

    if (!emailResult.success || !emailResult.data.valid) {
      errors.push('Invalid email address');
    }

    if (emailResult.data?.disposable) {
      errors.push('Disposable email addresses are not allowed');
    }

    if (!phoneResult.success || !phoneResult.data.valid) {
      errors.push('Invalid phone number');
    }

    return {
      valid: errors.length === 0,
      errors,
      emailInfo: emailResult.data,
      phoneInfo: phoneResult.data,
    };
  }

  async validateBulkEmails(emails: string[]) {
    return await this.emailValidator.validateBulkEmails(emails);
  }
}
```

### 7. auth-service

```typescript
// services/core/auth-service/src/services/verification.service.ts
import { SmsService, EmailService } from '@mnbara/external-apis';

export class VerificationService {
  private smsService: SmsService;
  private emailService: EmailService;

  constructor() {
    this.smsService = new SmsService('twilio');
    this.emailService = new EmailService();
  }

  async sendEmailVerification(email: string, code: string) {
    return await this.emailService.sendEmail({
      to: email,
      subject: 'Verify Your Email',
      html: `
        <h1>Email Verification</h1>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `,
    });
  }

  async sendPhoneVerification(phone: string, code: string) {
    return await this.smsService.sendSms({
      to: phone,
      body: `Your Mnbara verification code is: ${code}. Valid for 10 minutes.`,
    });
  }

  async send2FACode(user: User, code: string) {
    if (user.twoFactorMethod === 'sms') {
      return await this.sendPhoneVerification(user.phone, code);
    } else {
      return await this.sendEmailVerification(user.email, code);
    }
  }
}
```

## Phase 2 Services

### 8. p2p-exchange-service

```typescript
// archive/legacy-services/p2p-exchange-service/src/services/exchange-notifier.service.ts
import { EmailService, SmsService } from '@mnbara/external-apis';

export class ExchangeNotifierService {
  private emailService: EmailService;
  private smsService: SmsService;

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SmsService('twilio');
  }

  async notifyMatchFound(exchange: Exchange, user: User) {
    await Promise.all([
      this.emailService.sendEmail({
        to: user.email,
        subject: 'Match Found for Your Exchange Request',
        html: this.generateMatchEmailTemplate(exchange),
      }),
      user.phone ? this.smsService.sendSms({
        to: user.phone,
        body: `Match found for your exchange request! Check your email for details.`,
      }) : Promise.resolve(),
    ]);
  }

  private generateMatchEmailTemplate(exchange: Exchange): string {
    return `
      <h1>Match Found!</h1>
      <p>We found a match for your exchange request.</p>
      <p>Amount: ${exchange.amount} ${exchange.fromCurrency} → ${exchange.toCurrency}</p>
    `;
  }
}
```

### 9. bnpl-service (Buy Now Pay Later)

```typescript
// archive/legacy-services/bnpl-service/src/services/bnpl-payment.service.ts
import { PaymentService, CurrencyService } from '@mnbara/external-apis';

export class BnplPaymentService {
  private paymentService: PaymentService;
  private currencyService: CurrencyService;

  constructor() {
    this.paymentService = new PaymentService('stripe');
    this.currencyService = new CurrencyService();
  }

  async createInstallmentPlan(totalAmount: number, currency: string, installments: number) {
    const installmentAmount = totalAmount / installments;

    // Create first payment
    const firstPayment = await this.paymentService.createPaymentIntent(
      installmentAmount,
      currency,
      { installment: 1, total: installments }
    );

    return {
      totalAmount,
      installmentAmount,
      installments,
      firstPaymentId: firstPayment.data?.id,
      schedule: this.generatePaymentSchedule(installments),
    };
  }

  private generatePaymentSchedule(installments: number) {
    const schedule = [];
    const now = new Date();

    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + i);
      schedule.push({
        installment: i + 1,
        dueDate,
      });
    }

    return schedule;
  }
}
```

## Phase 3 Services (AI)

### 10. recommendation-service

```typescript
// archive/legacy-services/recommendation-service/src/services/location-based-recommendations.service.ts
import { MapsService, WeatherService } from '@mnbara/external-apis';

export class LocationBasedRecommendationsService {
  private mapsService: MapsService;
  private weatherService: WeatherService;

  constructor() {
    this.mapsService = new MapsService('google');
    this.weatherService = new WeatherService();
  }

  async getRecommendations(userLocation: GeoLocation) {
    // Get weather data
    const weather = await this.weatherService.getCurrentWeather(userLocation);

    // Get nearby locations
    const address = await this.mapsService.reverseGeocode(
      userLocation.latitude,
      userLocation.longitude
    );

    // Generate recommendations based on weather and location
    const recommendations = this.generateRecommendations(weather.data, address.data);

    return recommendations;
  }

  private generateRecommendations(weather: WeatherData, location: GeoLocation) {
    const recommendations = [];

    if (weather.temperature > 30) {
      recommendations.push({
        type: 'product',
        category: 'cooling',
        reason: 'Hot weather detected',
      });
    }

    return recommendations;
  }
}
```

## Summary

All 87 microservices can integrate with the external APIs package using similar patterns:

1. **Import the required service** from `@mnbara/external-apis`
2. **Initialize in constructor** with appropriate configuration
3. **Use async/await** for all API calls
4. **Handle errors** using try/catch or checking `response.success`
5. **Leverage caching** for frequently accessed data

The package provides a consistent interface across all services, making it easy to switch providers or add new integrations without changing service code.

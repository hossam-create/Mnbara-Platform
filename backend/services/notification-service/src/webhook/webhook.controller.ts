import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EventWorkerService } from '../channels/event-worker.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly eventWorker: EventWorkerService) {}

  @Post('fcm/delivery')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle FCM delivery receipts' })
  async handleFCMDelivery(@Body() body: any) {
    this.logger.log(`FCM delivery webhook: ${body.event} for message ${body.messageId}`);
    return { success: true };
  }

  @Post('sendgrid/event')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle SendGrid email events' })
  async handleSendGridEvent(@Body() body: any) {
    const events = Array.isArray(body) ? body : [body];
    events.forEach((event: any) => this.logger.log(`SendGrid event: ${event.event} for ${event.email}`));
    return { success: true, processed: events.length };
  }

  @Post('twilio/sms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Twilio SMS status callbacks' })
  async handleTwilioSMS(@Body() body: any) {
    this.logger.log(`Twilio SMS callback: ${body.MessageStatus} for ${body.MessageSid}`);
    return 'OK';
  }

  @Post('events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generic event webhook for internal services' })
  async handleGenericEvent(@Body() body: { source: string; event: string; data: any }) {
    this.logger.log(`Generic webhook event from ${body.source}: ${body.event}`);

    const channelMap: Record<string, string> = {
      'auction-service': 'mnbara:events:auction',
      'order-service': 'mnbara:events:order',
      'payment-service': 'mnbara:events:payment',
      'chat-service': 'mnbara:events:chat',
    };

    const channel = channelMap[body.source] || 'mnbara:events:system';
    await this.eventWorker.publishEvent(channel, { event: body.event, data: body.data, source: body.source });

    return { success: true };
  }
}

import { Global, Module } from '@nestjs/common';
import { EmailChannelService } from './email.service';
import { SmsChannelService } from './sms.service';
import { FcmChannelService } from './fcm.service';
import { WebsocketChannelService } from './websocket.service';
import { EventWorkerService } from './event-worker.service';

@Global()
@Module({
  providers: [
    EmailChannelService,
    SmsChannelService,
    FcmChannelService,
    WebsocketChannelService,
    EventWorkerService,
  ],
  exports: [
    EmailChannelService,
    SmsChannelService,
    FcmChannelService,
    WebsocketChannelService,
    EventWorkerService,
  ],
})
export class ChannelsModule {}

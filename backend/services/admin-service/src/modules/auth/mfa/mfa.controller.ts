import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('auth/mfa')
@UseGuards(JwtAuthGuard)
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('setup')
  async setup(@CurrentUser() user: any) {
    return this.mfaService.generateSecret(user.id, user.email);
  }

  @Post('verify')
  async verify(@CurrentUser() user: any, @Body('token') token: string) {
    return this.mfaService.verifyAndEnable(user.id, token);
  }

  @Post('disable')
  async disable(@CurrentUser() user: any, @Body('token') token: string) {
    return this.mfaService.disableMfa(user.id, token);
  }
}

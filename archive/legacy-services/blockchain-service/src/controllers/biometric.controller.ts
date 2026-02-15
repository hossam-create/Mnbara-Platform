import { Controller, Post, Get, Body, Param, UseGuards, Request, Logger } from '@nestjs/common';
import { BiometricService } from '../services/biometric.service';

@Controller('auth/biometric')
export class BiometricController {
  private readonly logger = new Logger(BiometricController.name);

  constructor(private readonly biometricService: BiometricService) {}

  @Get('register/options')
  async getRegistrationOptions(@Request() req) {
    // In real app, user comes from JWT/Session
    const userId = 'user_123'; 
    const username = 'user@example.com';
    return this.biometricService.generateRegistrationOptions(userId, username);
  }

  @Post('register/verify')
  async verifyRegistration(@Request() req, @Body() response: any) {
    const userId = 'user_123';
    return this.biometricService.verifyRegistration(userId, response);
  }

  @Get('authenticate/options')
  async getAuthenticationOptions(@Request() req) {
    const userId = 'user_123';
    return this.biometricService.generateAuthenticationOptions(userId);
  }

  @Post('authenticate/verify')
  async verifyAuthentication(@Request() req, @Body() response: any) {
    const userId = 'user_123';
    return this.biometricService.verifyAuthentication(userId, response);
  }
}

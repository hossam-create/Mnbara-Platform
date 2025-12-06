import { Controller, Get, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('role') role?: string,
    @Query('kycStatus') kycStatus?: string,
  ) {
    return this.usersService.getAllUsers({ page, limit, role, kycStatus });
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(parseInt(id));
  }

  @Get(':id/sessions')
  async getUserSessions(@Param('id') id: string) {
    return this.usersService.getUserSessions(parseInt(id));
  }

  @Get(':id/activity')
  async getUserActivity(@Param('id') id: string) {
    return this.usersService.getUserActivity(parseInt(id));
  }
}

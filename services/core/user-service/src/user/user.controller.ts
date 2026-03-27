import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create user' })
  async create(@Body() body: any) {
    const user = await this.userService.createUser(body);
    return { success: true, data: user };
  }

  @Get()
  @ApiOperation({ summary: 'Get users with pagination' })
  async getAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string, @Query('role') role?: string, @Query('search') search?: string) {
    return { success: true, data: await this.userService.getUsers({ page: parseInt(page || '1'), limit: parseInt(limit || '20'), status, role, search }) };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user stats' })
  async getStats() { return { success: true, data: await this.userService.getUserStats() }; }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getById(@Param('id') id: string) {
    return { success: true, data: await this.userService.getUserById(id) };
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get user by email' })
  async getByEmail(@Param('email') email: string) {
    return { success: true, data: await this.userService.getUserByEmail(email) };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.userService.updateUser(id, body) };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update user status' })
  async updateStatus(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.userService.updateUserStatus(id, body.status) };
  }

  @Put(':id/verify-email')
  @ApiOperation({ summary: 'Verify email' })
  async verifyEmail(@Param('id') id: string) {
    return { success: true, data: await this.userService.verifyEmail(id) };
  }

  @Put(':id/verify-phone')
  @ApiOperation({ summary: 'Verify phone number' })
  async verifyPhone(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.userService.verifyPhoneNumber(id, body.phoneNumber) };
  }

  @Put(':id/password')
  @ApiOperation({ summary: 'Update password' })
  async updatePassword(@Param('id') id: string, @Body() body: any) {
    await this.userService.updatePassword(id, body.password);
    return { success: true, message: 'Password updated' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete user' })
  async delete(@Param('id') id: string) {
    return { success: true, data: await this.userService.deleteUser(id) };
  }

  @Put(':id/suspend')
  @ApiOperation({ summary: 'Suspend user' })
  async suspend(@Param('id') id: string) {
    return { success: true, data: await this.userService.suspendUser(id) };
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activate user' })
  async activate(@Param('id') id: string) {
    return { success: true, data: await this.userService.activateUser(id) };
  }
}

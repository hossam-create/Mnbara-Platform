import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CountryService } from './country.service';

@ApiTags('Countries')
@Controller('api/v1/countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all countries' })
  @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'active', required: false })
  async getAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('active') active?: string) {
    const activeFilter = active === 'true' ? true : active === 'false' ? false : null;
    const countries = await this.countryService.getAllCountries({
      page: parseInt(page || '1'), limit: parseInt(limit || '50'),
      ...(activeFilter !== null && { active: activeFilter }),
    });
    return { success: true, data: countries, pagination: { page: parseInt(page || '1'), limit: parseInt(limit || '50'), total: countries.length } };
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get country by code' })
  async getByCode(@Param('code') code: string) {
    return { success: true, data: await this.countryService.getCountryByCode(code) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create country' })
  async create(@Body() body: any) {
    return { success: true, data: await this.countryService.createCountry(body), message: 'Country created successfully' };
  }

  @Put(':code')
  @ApiOperation({ summary: 'Update country' })
  async update(@Param('code') code: string, @Body() body: any) {
    const country = await this.countryService.updateCountry(code, body);
    if (!country) throw new NotFoundException('Country not found');
    return { success: true, data: country, message: 'Country updated successfully' };
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Delete country' })
  async delete(@Param('code') code: string) {
    const deleted = await this.countryService.deleteCountry(code);
    if (!deleted) throw new NotFoundException('Country not found');
    return { success: true, message: 'Country deleted successfully' };
  }

  @Get('products/:productId/countries')
  @ApiOperation({ summary: 'Get product countries' })
  async getProductCountries(@Param('productId') productId: string) {
    return { success: true, data: await this.countryService.getProductCountries(productId) };
  }

  @Post('products/:productId/countries')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add product country' })
  async addProductCountry(@Param('productId') productId: string, @Body() body: any) {
    return { success: true, data: await this.countryService.addProductCountry(productId, body), message: 'Product country added successfully' };
  }

  @Put('products/:productId/countries/:countryCode')
  @ApiOperation({ summary: 'Update product country' })
  async updateProductCountry(@Param('productId') productId: string, @Param('countryCode') countryCode: string, @Body() body: any) {
    const result = await this.countryService.updateProductCountry(productId, countryCode, body);
    if (!result) throw new NotFoundException('Product country not found');
    return { success: true, data: result, message: 'Product country updated successfully' };
  }

  @Delete('products/:productId/countries/:countryCode')
  @ApiOperation({ summary: 'Remove product country' })
  async removeProductCountry(@Param('productId') productId: string, @Param('countryCode') countryCode: string) {
    const result = await this.countryService.removeProductCountry(productId, countryCode);
    if (!result) throw new NotFoundException('Product country not found');
    return { success: true, message: 'Product country removed successfully' };
  }

  @Get('travelers/:travelerId/routes')
  @ApiOperation({ summary: 'Get traveler routes' })
  async getTravelerRoutes(@Param('travelerId') travelerId: string) {
    return { success: true, data: await this.countryService.getTravelerRoutes(travelerId) };
  }

  @Post('travelers/:travelerId/routes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add traveler route' })
  async addTravelerRoute(@Param('travelerId') travelerId: string, @Body() body: any) {
    return { success: true, data: await this.countryService.addTravelerRoute(travelerId, body), message: 'Traveler route added successfully' };
  }

  @Delete('travelers/:travelerId/routes/:routeId')
  @ApiOperation({ summary: 'Remove traveler route' })
  async removeTravelerRoute(@Param('travelerId') travelerId: string, @Param('routeId') routeId: string) {
    const result = await this.countryService.removeTravelerRoute(travelerId, routeId);
    if (!result) throw new NotFoundException('Traveler route not found');
    return { success: true, message: 'Traveler route removed successfully' };
  }
}

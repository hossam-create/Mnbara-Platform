import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CountryService {
  private readonly logger = new Logger(CountryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllCountries(filters: { page?: number; limit?: number; active?: boolean }) {
    const { page = 1, limit = 50, active } = filters;
    const where: any = {};
    if (active !== undefined) where.isActive = active;
    return this.prisma.country.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' } });
  }

  async getCountryByCode(code: string) {
    const country = await this.prisma.country.findFirst({ where: { OR: [{ iso2: code }, { iso3: code }] } as any });
    if (!country) throw new NotFoundException('Country not found');
    return country;
  }

  async createCountry(data: any) {
    const country = await this.prisma.country.create({ data } as any);
    this.logger.log(`Country created: ${country.id}`);
    return country;
  }

  async updateCountry(code: string, data: any) {
    const existing = await this.prisma.country.findFirst({ where: { OR: [{ iso2: code }, { iso3: code }] } as any });
    if (!existing) return null;
    return this.prisma.country.update({ where: { id: existing.id }, data });
  }

  async deleteCountry(code: string) {
    const existing = await this.prisma.country.findFirst({ where: { OR: [{ iso2: code }, { iso3: code }] } as any });
    if (!existing) return null;
    return this.prisma.country.delete({ where: { id: existing.id } });
  }

  async getProductCountries(productId: string) {
    return this.prisma.productCountry.findMany({ where: { productId }, include: { country: true } } as any);
  }

  async addProductCountry(productId: string, data: any) {
    return this.prisma.productCountry.create({ data: { ...data, productId } } as any);
  }

  async updateProductCountry(productId: string, countryCode: string, data: any) {
    const existing = await this.prisma.productCountry.findFirst({ where: { productId, countryCode } } as any);
    if (!existing) return null;
    return this.prisma.productCountry.update({ where: { id: (existing as any).id }, data } as any);
  }

  async removeProductCountry(productId: string, countryCode: string) {
    const existing = await this.prisma.productCountry.findFirst({ where: { productId, countryCode } } as any);
    if (!existing) return null;
    return this.prisma.productCountry.delete({ where: { id: (existing as any).id } } as any);
  }

  async getTravelerRoutes(travelerId: string) {
    return this.prisma.travelerRoute.findMany({ where: { travelerId }, include: { originCountry: true, destinationCountry: true } } as any);
  }

  async addTravelerRoute(travelerId: string, data: any) {
    return this.prisma.travelerRoute.create({ data: { ...data, travelerId } } as any);
  }

  async removeTravelerRoute(travelerId: string, routeId: string) {
    const existing = await this.prisma.travelerRoute.findFirst({ where: { id: routeId, travelerId } } as any);
    if (!existing) return null;
    return this.prisma.travelerRoute.delete({ where: { id: routeId } } as any);
  }
}

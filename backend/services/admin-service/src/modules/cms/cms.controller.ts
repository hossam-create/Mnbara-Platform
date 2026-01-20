import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Header,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CmsService } from './cms.service';
import {
  CreateSectionDto,
  UpdateSectionDto,
  CreateSectionItemDto,
  UpdateSectionItemDto,
  ReorderSectionsDto,
} from './cms.dto';

@Controller()
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // ============ PUBLIC API ============

  /**
   * GET /api/v1/cms/pages/:slug
   * Public endpoint to fetch page with all enabled sections
   * Improved with HTTP Caching (Cache-Control + ETag)
   */
  @Get('api/v1/cms/pages/:slug')
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  async getPageBySlug(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.cmsService.getPageBySlug(slug);
    
    // Generate ETag from updated_at
    const etag = `"${new Date(data.page.updatedAt).getTime().toString(36)}"`;
    res.header('ETag', etag);

    // Check If-None-Match
    if (req.headers['if-none-match'] === etag) {
      res.status(HttpStatus.NOT_MODIFIED);
      return;
    }

    return data;
  }

  // ============ ADMIN API - PAGES ============

  /**
   * GET /admin/cms/pages
   * List all CMS pages
   */
  @Get('admin/cms/pages')
  async getAllPages() {
    return this.cmsService.getAllPages();
  }

  /**
   * GET /admin/cms/pages/:id
   * Get single page by ID
   */
  @Get('admin/cms/pages/:id')
  async getPageById(@Param('id') id: string) {
    return this.cmsService.getPageById(id);
  }

  /**
   * GET /admin/cms/pages/:pageId/sections
   * Get all sections for a page
   */
  @Get('admin/cms/pages/:pageId/sections')
  async getSectionsByPageId(@Param('pageId') pageId: string) {
    return this.cmsService.getSectionsByPageId(pageId);
  }

  // ============ ADMIN API - SECTIONS ============

  /**
   * POST /admin/cms/sections
   * Create a new section
   */
  @Post('admin/cms/sections')
  async createSection(@Body() dto: CreateSectionDto) {
    return this.cmsService.createSection(dto);
  }

  /**
   * GET /admin/cms/sections/:id
   * Get section by ID
   */
  @Get('admin/cms/sections/:id')
  async getSectionById(@Param('id') id: string) {
    return this.cmsService.getSectionById(id);
  }

  /**
   * PUT /admin/cms/sections/:id
   * Update a section
   */
  @Put('admin/cms/sections/:id')
  async updateSection(
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.cmsService.updateSection(id, dto);
  }

  /**
   * DELETE /admin/cms/sections/:id
   * Delete a section
   */
  @Delete('admin/cms/sections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSection(@Param('id') id: string) {
    await this.cmsService.deleteSection(id);
  }

  /**
   * PUT /admin/cms/sections/reorder
   * Reorder sections
   */
  @Put('admin/cms/sections/reorder')
  async reorderSections(@Body() dto: ReorderSectionsDto) {
    await this.cmsService.reorderSections(dto.sections);
    return { success: true };
  }

  // ============ ADMIN API - SECTION ITEMS ============

  /**
   * GET /admin/cms/sections/:sectionId/items
   * Get all items for a section
   */
  @Get('admin/cms/sections/:sectionId/items')
  async getItemsBySectionId(@Param('sectionId') sectionId: string) {
    return this.cmsService.getItemsBySectionId(sectionId);
  }

  /**
   * POST /admin/cms/sections/:sectionId/items
   * Create a new section item
   */
  @Post('admin/cms/sections/:sectionId/items')
  async createSectionItem(
    @Param('sectionId') sectionId: string,
    @Body() dto: Omit<CreateSectionItemDto, 'sectionId'>,
  ) {
    return this.cmsService.createSectionItem({ ...dto, sectionId });
  }

  /**
   * GET /admin/cms/items/:id
   * Get item by ID
   */
  @Get('admin/cms/items/:id')
  async getSectionItemById(@Param('id') id: string) {
    return this.cmsService.getSectionItemById(id);
  }

  /**
   * PUT /admin/cms/items/:id
   * Update a section item
   */
  @Put('admin/cms/items/:id')
  async updateSectionItem(
    @Param('id') id: string,
    @Body() dto: UpdateSectionItemDto,
  ) {
    return this.cmsService.updateSectionItem(id, dto);
  }

  /**
   * DELETE /admin/cms/items/:id
   * Delete a section item
   */
  @Delete('admin/cms/items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSectionItem(@Param('id') id: string) {
    await this.cmsService.deleteSectionItem(id);
  }
}

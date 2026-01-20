import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DatabaseService } from '../../database/database.service';
import {
  PageDto,
  SectionDto,
  SectionItemDto,
  CreateSectionDto,
  UpdateSectionDto,
  CreateSectionItemDto,
  UpdateSectionItemDto,
  HomepageResponseDto,
} from './cms.dto';

@Injectable()
export class CmsService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  private getCacheKey(slug: string): string {
    return `cms:page:${slug}`;
  }

  // ============ CACHE INVALIDATION HELPERS ============

  /**
   * Invalidate page cache by slug
   */
  private async invalidateCacheBySlug(slug: string): Promise<void> {
    const key = this.getCacheKey(slug);
    await this.cacheManager.del(key);
    console.log(`[Cache] Invalidated key: ${key}`);
  }

  /**
   * Invalidate page cache by page ID
   */
  private async invalidateCacheByPageId(pageId: string): Promise<void> {
    const result = await this.db.query<{ slug: string }>(
      `SELECT slug FROM cms_pages WHERE id = $1`,
      [pageId]
    );
    if (result.rows.length > 0) {
      await this.invalidateCacheBySlug(result.rows[0].slug);
    }
  }

  /**
   * Invalidate page cache by section ID
   */
  private async invalidateCacheBySectionId(sectionId: string): Promise<void> {
    const result = await this.db.query<{ slug: string }>(
      `SELECT p.slug 
       FROM cms_pages p
       JOIN cms_sections s ON s.page_id = p.id
       WHERE s.id = $1`,
      [sectionId]
    );
    if (result.rows.length > 0) {
      await this.invalidateCacheBySlug(result.rows[0].slug);
    }
  }

  /**
   * Invalidate page cache by item ID
   */
  private async invalidateCacheByItemId(itemId: string): Promise<void> {
    const result = await this.db.query<{ slug: string }>(
      `SELECT p.slug 
       FROM cms_pages p
       JOIN cms_sections s ON s.page_id = p.id
       JOIN cms_section_items i ON i.section_id = s.id
       WHERE i.id = $1`,
      [itemId]
    );
    if (result.rows.length > 0) {
      await this.invalidateCacheBySlug(result.rows[0].slug);
    }
  }

  // ============ PUBLIC API ============

  /**
   * Get page with all enabled sections and items (public endpoint)
   * CACHED: Read-through strategy
   */
  async getPageBySlug(slug: string): Promise<HomepageResponseDto> {
    const cacheKey = this.getCacheKey(slug);
    
    // 1. Check cache
    const cachedData = await this.cacheManager.get<HomepageResponseDto>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // 2. Fetch from DB (Cache Miss)
    // Get page
    const pageResult = await this.db.query<any>(
      `SELECT id, slug, title, description, is_active as "isActive", 
              created_at as "createdAt", updated_at as "updatedAt"
       FROM cms_pages 
       WHERE slug = $1 AND is_active = true`,
      [slug]
    );

    if (pageResult.rows.length === 0) {
      throw new NotFoundException(`Page with slug '${slug}' not found`);
    }

    const page = pageResult.rows[0];

    // Get enabled sections ordered by sort_order
    const sectionsResult = await this.db.query<any>(
      `SELECT id, page_id as "pageId", type, title, enabled, 
              sort_order as "sortOrder", config, 
              created_at as "createdAt", updated_at as "updatedAt"
       FROM cms_sections 
       WHERE page_id = $1 AND enabled = true 
       ORDER BY sort_order ASC`,
      [page.id]
    );

    const sections = sectionsResult.rows;

    // Get items for each section
    const sectionsWithItems = await Promise.all(
      sections.map(async (section: any) => {
        const itemsResult = await this.db.query<any>(
          `SELECT id, section_id as "sectionId", sort_order as "sortOrder", 
                  data, created_at as "createdAt", updated_at as "updatedAt"
           FROM cms_section_items 
           WHERE section_id = $1 
           ORDER BY sort_order ASC`,
          [section.id]
        );
        return { ...section, items: itemsResult.rows };
      })
    );

    const response = {
      page,
      sections: sectionsWithItems,
    };

    // 3. Store in cache (TTL: 60 seconds)
    await this.cacheManager.set(cacheKey, response, 60 * 1000);

    return response;
  }

  // ============ ADMIN API - PAGES ============

  async getAllPages(): Promise<PageDto[]> {
    const result = await this.db.query<any>(
      `SELECT id, slug, title, description, is_active as "isActive",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM cms_pages 
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async getPageById(id: string): Promise<PageDto> {
    const result = await this.db.query<any>(
      `SELECT id, slug, title, description, is_active as "isActive",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM cms_pages 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Page with id '${id}' not found`);
    }

    return result.rows[0];
  }

  // ============ ADMIN API - SECTIONS ============

  async getSectionsByPageId(pageId: string): Promise<SectionDto[]> {
    const result = await this.db.query<any>(
      `SELECT id, page_id as "pageId", type, title, enabled, 
              sort_order as "sortOrder", config,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM cms_sections 
       WHERE page_id = $1 
       ORDER BY sort_order ASC`,
      [pageId]
    );
    return result.rows;
  }

  async createSection(dto: CreateSectionDto): Promise<SectionDto> {
    const { pageId, type, title, enabled = true, sortOrder = 0, config = {} } = dto;

    const result = await this.db.query<any>(
      `INSERT INTO cms_sections (page_id, type, title, enabled, sort_order, config)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, page_id as "pageId", type, title, enabled, 
                 sort_order as "sortOrder", config,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [pageId, type, title, enabled, sortOrder, JSON.stringify(config)]
    );

    // Invalidate Cache
    await this.invalidateCacheByPageId(pageId);

    return result.rows[0];
  }

  async updateSection(id: string, dto: UpdateSectionDto): Promise<SectionDto> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(dto.title);
    }
    if (dto.enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(dto.enabled);
    }
    if (dto.sortOrder !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      values.push(dto.sortOrder);
    }
    if (dto.config !== undefined) {
      updates.push(`config = $${paramIndex++}`);
      values.push(JSON.stringify(dto.config));
    }

    if (updates.length === 0) {
      return this.getSectionById(id);
    }

    values.push(id);

    const result = await this.db.query<any>(
      `UPDATE cms_sections 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, page_id as "pageId", type, title, enabled, 
                 sort_order as "sortOrder", config,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Section with id '${id}' not found`);
    }

    // Invalidate Cache
    await this.invalidateCacheBySectionId(id);

    return result.rows[0];
  }

  async deleteSection(id: string): Promise<void> {
    // Need to find page_id before deletion for invalidation
    await this.invalidateCacheBySectionId(id);

    const result = await this.db.query(
      `DELETE FROM cms_sections WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      throw new NotFoundException(`Section with id '${id}' not found`);
    }
  }

  async reorderSections(sections: Array<{ id: string; sortOrder: number }>): Promise<void> {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      // Invalidate cache for the first section (assuming all belong to same page)
      if (sections.length > 0) {
        // We do this inside try/catch but execute query separately or just use helper after commit
        // For simplicity, we'll invalidate after commit
      }

      for (const section of sections) {
        await client.query(
          `UPDATE cms_sections SET sort_order = $1 WHERE id = $2`,
          [section.sortOrder, section.id]
        );
      }

      await client.query('COMMIT');
      
      // Post-commit invalidation
      if (sections.length > 0) {
        await this.invalidateCacheBySectionId(sections[0].id);
      }

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getSectionById(id: string): Promise<SectionDto> {
    const result = await this.db.query<any>(
      `SELECT id, page_id as "pageId", type, title, enabled, 
              sort_order as "sortOrder", config,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM cms_sections 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Section with id '${id}' not found`);
    }

    return result.rows[0];
  }

  // ============ ADMIN API - SECTION ITEMS ============

  async getItemsBySectionId(sectionId: string): Promise<SectionItemDto[]> {
    const result = await this.db.query<any>(
      `SELECT id, section_id as "sectionId", sort_order as "sortOrder", 
              data, created_at as "createdAt", updated_at as "updatedAt"
       FROM cms_section_items 
       WHERE section_id = $1 
       ORDER BY sort_order ASC`,
      [sectionId]
    );
    return result.rows;
  }

  async createSectionItem(dto: CreateSectionItemDto): Promise<SectionItemDto> {
    const { sectionId, sortOrder = 0, data } = dto;

    const result = await this.db.query<any>(
      `INSERT INTO cms_section_items (section_id, sort_order, data)
       VALUES ($1, $2, $3)
       RETURNING id, section_id as "sectionId", sort_order as "sortOrder", 
                 data, created_at as "createdAt", updated_at as "updatedAt"`,
      [sectionId, sortOrder, JSON.stringify(data)]
    );

    // Invalidate Cache
    await this.invalidateCacheBySectionId(sectionId);

    return result.rows[0];
  }

  async updateSectionItem(id: string, dto: UpdateSectionItemDto): Promise<SectionItemDto> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.sortOrder !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      values.push(dto.sortOrder);
    }
    if (dto.data !== undefined) {
      updates.push(`data = $${paramIndex++}`);
      values.push(JSON.stringify(dto.data));
    }

    if (updates.length === 0) {
      return this.getSectionItemById(id);
    }

    values.push(id);

    const result = await this.db.query<any>(
      `UPDATE cms_section_items 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, section_id as "sectionId", sort_order as "sortOrder", 
                 data, created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Section item with id '${id}' not found`);
    }

    // Invalidate Cache
    await this.invalidateCacheByItemId(id);

    return result.rows[0];
  }

  async deleteSectionItem(id: string): Promise<void> {
    // Invalidate before delete or fetch relations then delete
    await this.invalidateCacheByItemId(id);

    const result = await this.db.query(
      `DELETE FROM cms_section_items WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      throw new NotFoundException(`Section item with id '${id}' not found`);
    }
  }

  async getSectionItemById(id: string): Promise<SectionItemDto> {
    const result = await this.db.query<any>(
      `SELECT id, section_id as "sectionId", sort_order as "sortOrder", 
              data, created_at as "createdAt", updated_at as "updatedAt"
       FROM cms_section_items 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Section item with id '${id}' not found`);
    }

    return result.rows[0];
  }
}

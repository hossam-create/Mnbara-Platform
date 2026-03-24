import axios from 'axios';

// CMS API Types
export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CmsSectionItem {
  id: string;
  sectionId: string;
  sortOrder: number;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CmsSection {
  id: string;
  pageId: string;
  type: 'carousel' | 'deals' | 'categories' | 'banner' | 'values' | 'products';
  title: string;
  enabled: boolean;
  sortOrder: number;
  config: Record<string, any>;
  items: CmsSectionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CmsPageResponse {
  page: CmsPage;
  sections: CmsSection[];
}

// API Base URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

/**
 * CMS Service - Fetches dynamic content from CMS API
 */
export const cmsService = {
  /**
   * Get page content by slug (e.g., 'homepage')
   */
  async getPageBySlug(slug: string): Promise<CmsPageResponse> {
    const response = await axios.get<CmsPageResponse>(
      `${API_BASE_URL}/api/v1/cms/pages/${slug}`
    );
    return response.data;
  },

  /**
   * Get homepage content (convenience method)
   */
  async getHomepage(): Promise<CmsPageResponse> {
    return this.getPageBySlug('homepage');
  },

  // ============ ADMIN METHODS ============

  /**
   * Get all CMS pages
   */
  async getAllPages(): Promise<CmsPage[]> {
    const response = await axios.get<CmsPage[]>(`${API_BASE_URL}/admin/cms/pages`);
    return response.data;
  },

  /**
   * Get all sections for a page
   */
  async getSectionsByPageId(pageId: string): Promise<CmsSection[]> {
    const response = await axios.get<CmsSection[]>(
      `${API_BASE_URL}/admin/cms/pages/${pageId}/sections`
    );
    return response.data;
  },

  /**
   * Update a section (enable/disable, sort order, etc.)
   */
  async updateSection(id: string, data: Partial<CmsSection>): Promise<CmsSection> {
    const response = await axios.put<CmsSection>(
      `${API_BASE_URL}/admin/cms/sections/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Reorder sections
   */
  async reorderSections(sections: { id: string; sortOrder: number }[]): Promise<void> {
    await axios.put(`${API_BASE_URL}/admin/cms/sections/reorder`, { sections });
  },

  /**
   * Create a new section
   */
  async createSection(pageId: string, data: Omit<CmsSection, 'id' | 'createdAt' | 'updatedAt' | 'items'>): Promise<CmsSection> {
    const response = await axios.post<CmsSection>(
      `${API_BASE_URL}/admin/cms/pages/${pageId}/sections`,
      data
    );
    return response.data;
  },

  /**
   * Delete a section
   */
  async deleteSection(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/admin/cms/sections/${id}`);
  },

  /**
   * Update section items
   */
  async updateSectionItems(sectionId: string, items: CmsSectionItem[]): Promise<CmsSection> {
    const response = await axios.put<CmsSection>(
      `${API_BASE_URL}/admin/cms/sections/${sectionId}/items`,
      { items }
    );
    return response.data;
  },

  /**
   * Get section by ID
   */
  async getSectionById(id: string): Promise<CmsSection> {
    const response = await axios.get<CmsSection>(`${API_BASE_URL}/admin/cms/sections/${id}`);
    return response.data;
  },
};

export default cmsService;

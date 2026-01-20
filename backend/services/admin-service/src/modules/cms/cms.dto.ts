// CMS DTOs for Phase 2.5

// Page DTOs
export interface PageDto {
  id: string;
  slug: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  sections?: SectionDto[];
}

export interface CreatePageDto {
  slug: string;
  title: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePageDto {
  title?: string;
  description?: string;
  isActive?: boolean;
}

// Section DTOs
export interface SectionDto {
  id: string;
  pageId: string;
  type: SectionType;
  title: string;
  enabled: boolean;
  sortOrder: number;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  items?: SectionItemDto[];
}

export type SectionType = 'carousel' | 'deals' | 'categories' | 'banner' | 'values' | 'products';

export interface CreateSectionDto {
  pageId: string;
  type: SectionType;
  title: string;
  enabled?: boolean;
  sortOrder?: number;
  config?: Record<string, any>;
}

export interface UpdateSectionDto {
  title?: string;
  enabled?: boolean;
  sortOrder?: number;
  config?: Record<string, any>;
}

export interface ReorderSectionsDto {
  sections: Array<{ id: string; sortOrder: number }>;
}

// Section Item DTOs
export interface SectionItemDto {
  id: string;
  sectionId: string;
  sortOrder: number;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSectionItemDto {
  sectionId: string;
  sortOrder?: number;
  data: Record<string, any>;
}

export interface UpdateSectionItemDto {
  sortOrder?: number;
  data?: Record<string, any>;
}

// Homepage Response DTO (public API)
export interface HomepageResponseDto {
  page: PageDto;
  sections: Array<SectionDto & { items: SectionItemDto[] }>;
}

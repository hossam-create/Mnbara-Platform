import { apiClient } from './api.service';

interface CrafterContentItem {
  id: string;
  path: string;
  contentType: string;
  locale: string;
  content?: Record<string, any>;
  metadata?: { key: string; value: string }[];
}

interface CrafterContentResponse {
  success: boolean;
  data: CrafterContentItem;
}

export async function getCmsContent(
  path: string,
  options?: { siteId?: string; locale?: string }
): Promise<CrafterContentResponse | null> {
  const siteId = options?.siteId || 'mnbara';
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  try {
    const response = await apiClient.get<CrafterContentResponse>(
      `/api/v1/content/sites/${siteId}/content/${normalizedPath}`,
      {
        params: options?.locale ? { locale: options.locale } : undefined,
      }
    );
    return response.data;
  } catch (error) {
    // Fail silently and let callers fall back to static content
    return null;
  }
}


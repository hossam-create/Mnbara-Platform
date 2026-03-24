// Matching Repository - API Integration
import {
  Match,
  MatchFilter,
  MatchResponse,
  MatchListResponse,
  AcceptMatchRequest,
} from '../../domain/entities/matching.entity';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.mnbara.com';

class MatchingRepository {
  private getAuthHeaders(): HeadersInit {
    const token = ''; // Get from secure storage
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async getMatches(filter?: MatchFilter): Promise<MatchListResponse> {
    const params = new URLSearchParams();
    if (filter?.status?.length) {
      params.append('status', filter.status.join(','));
    }
    if (filter?.dateFrom) {
      params.append('dateFrom', filter.dateFrom);
    }
    if (filter?.dateTo) {
      params.append('dateTo', filter.dateTo);
    }
    if (filter?.minScore) {
      params.append('minScore', filter.minScore.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/matches?${params.toString()}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch matches');
    }

    return response.json();
  }

  async getMatchById(id: string): Promise<MatchResponse> {
    const response = await fetch(`${API_BASE_URL}/matches/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch match');
    }

    return response.json();
  }

  async acceptMatch(request: AcceptMatchRequest): Promise<MatchResponse> {
    const response = await fetch(`${API_BASE_URL}/matches/${request.matchId}/accept`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ shopperNote: request.shopperNote }),
    });

    if (!response.ok) {
      throw new Error('Failed to accept match');
    }

    return response.json();
  }

  async declineMatch(matchId: string): Promise<MatchResponse> {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}/decline`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to decline match');
    }

    return response.json();
  }

  async completeMatch(matchId: string): Promise<MatchResponse> {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}/complete`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to complete match');
    }

    return response.json();
  }

  async getSuggestedMatches(): Promise<MatchListResponse> {
    const response = await fetch(`${API_BASE_URL}/matches/suggested`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch suggested matches');
    }

    return response.json();
  }

  async searchTrips(params: {
    origin?: string;
    destination?: string;
    dateFrom?: string;
    dateTo?: string;
    weight?: number;
  }): Promise<MatchListResponse> {
    const searchParams = new URLSearchParams();
    if (params.origin) searchParams.append('origin', params.origin);
    if (params.destination) searchParams.append('destination', params.destination);
    if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.append('dateTo', params.dateTo);
    if (params.weight) searchParams.append('weight', params.weight.toString());

    const response = await fetch(
      `${API_BASE_URL}/trips/search?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search trips');
    }

    return response.json();
  }

  async searchDeliveries(params: {
    origin?: string;
    destination?: string;
    dateFrom?: string;
    dateTo?: string;
    maxPrice?: number;
  }): Promise<MatchListResponse> {
    const searchParams = new URLSearchParams();
    if (params.origin) searchParams.append('origin', params.origin);
    if (params.destination) searchParams.append('destination', params.destination);
    if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.append('dateTo', params.dateTo);
    if (params.maxPrice) searchParams.append('maxPrice', params.maxPrice.toString());

    const response = await fetch(
      `${API_BASE_URL}/deliveries/search?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search deliveries');
    }

    return response.json();
  }
}

export const matchingRepository = new MatchingRepository();

import { NextRequest, NextResponse } from 'next/server';
import { listRequests, RequestFilters } from '@/data/marketplace';

const parseNumber = (value?: string | null) =>
  value && !Number.isNaN(Number(value)) ? Number(value) : undefined;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const filters: RequestFilters = {
    categoryId: params.get('categoryId') || undefined,
    destinationCountry: params.get('destinationCountry') || undefined,
    minReward: parseNumber(params.get('minReward')),
    maxReward: parseNumber(params.get('maxReward')),
    travelDate: params.get('travelDate') || undefined,
    sort: (params.get('sort') as RequestFilters['sort']) || 'latest',
    limit: parseNumber(params.get('limit')),
  };

  const data = listRequests(filters);
  return NextResponse.json({
    data,
    total: data.length,
    filters,
  });
}

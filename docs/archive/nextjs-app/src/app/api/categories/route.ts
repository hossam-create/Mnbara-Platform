import { NextResponse } from 'next/server';
import { listCategories } from '@/data/marketplace';

export async function GET() {
  const categories = listCategories();
  return NextResponse.json({ data: categories, total: categories.length });
}

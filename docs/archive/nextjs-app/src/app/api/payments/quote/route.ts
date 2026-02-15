import { NextRequest, NextResponse } from 'next/server';
import { getPaymentQuote } from '@/services/payments/payment_quote.service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const priceParam = searchParams.get('product_price');
  const product_price = priceParam ? Number(priceParam) : 0;
  const traveler_currency = searchParams.get('traveler_currency') ?? undefined;

  if (Number.isNaN(product_price) || product_price < 0) {
    return NextResponse.json({ error: 'Invalid product_price' }, { status: 400 });
  }

  const quote = getPaymentQuote({ product_price, traveler_currency });
  return NextResponse.json(quote);
}

import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${apiUrl}/health`, {
      next: { revalidate: 0 },
    });
    const data = await response.json();
    return NextResponse.json({ status: 'ok', backend: data });
  } catch (error) {
    return NextResponse.json(
      { status: 'ok', backend: 'unreachable', message: 'Backend gateway not running' },
      { status: 200 }
    );
  }
}

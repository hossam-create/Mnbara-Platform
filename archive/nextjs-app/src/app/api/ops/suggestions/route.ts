import { NextResponse } from 'next/server';
import { generateAutomationSuggestions } from '@/services/ops/automation_advisor';

export async function GET() {
  const report = generateAutomationSuggestions();
  return NextResponse.json(report);
}

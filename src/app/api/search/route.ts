import { NextRequest, NextResponse } from 'next/server';
import { searchModel } from '@/app/api/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const model = searchParams.get('model');
    const target = searchParams.get('target');
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!model) {
      return NextResponse.json({ error: 'Model parameter is required' }, { status: 400 });
    }

    const result = await searchModel(model, target || '', q || '', page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
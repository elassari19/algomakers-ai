import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.TW_SECRET_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TwelveData API key not configured' },
        { status: 500 }
      );
    }

    const url = new URL('https://api.twelvedata.com/quote');
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('apikey', apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`TwelveData API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Check if TwelveData returned an error
    if (data.status === 'error') {
      return NextResponse.json(
        { error: data.message || 'TwelveData API error' },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching quote from TwelveData:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote data' },
      { status: 500 }
    );
  }
}

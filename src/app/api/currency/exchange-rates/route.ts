import { NextRequest, NextResponse } from 'next/server';

interface ExchangeRatesResponse {
  data: {
    [currency: string]: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const baseCurrency = searchParams.get('base_currency') || 'USD';
    const currencies = searchParams.get('currencies') || 'USD,EUR,GBP,JPY,CAD,AUD,CHF,CNY,INR,BRL';

    const apiKey = process.env.FREECURRENCY_API_KEY;
    const baseUrl = process.env.FREECURRENCY_BASE_URL;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'FreeCurrency API key is not configured' },
        { status: 500 }
      );
    }

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'FreeCurrency base URL is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${baseUrl}?apikey=${apiKey}&base_currency=${baseCurrency}&currencies=${currencies}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        // Cache for 12 hours
        next: { revalidate: 43200 }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FreeCurrency API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to fetch exchange rates: ${response.status}` },
        { status: response.status }
      );
    }

    const data: ExchangeRatesResponse = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Currency API error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching exchange rates' },
      { status: 500 }
    );
  }
}

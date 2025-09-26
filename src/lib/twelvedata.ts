interface TwelveDataSymbol {
  symbol: string;
  instrument_name: string;
  exchange: string;
  mic_code: string;
  exchange_timezone: string;
  instrument_type: string;
  country: string;
  currency: string;
}

interface TwelveDataResponse {
  data: TwelveDataSymbol[];
  status: string;
}

class TwelveDataService {
  private apiKey: string;
  private baseUrl = 'https://api.twelvedata.com';

  constructor() {
    this.apiKey = process.env.TW_SECRET_KEY || '';
    if (!this.apiKey) {
      console.warn('TwelveData API key not found in environment variables');
    }
  }

  async getSymbolList(symbol?: string): Promise<TwelveDataSymbol[]> {
    try {
      const url = new URL(`${this.baseUrl}/symbol_search`);
      url.searchParams.append('apikey', this.apiKey);
      if (symbol) {
        url.searchParams.append('symbol', symbol);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`TwelveData API error: ${response.statusText}`);
      }

      const data: TwelveDataResponse = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching symbol data from TwelveData:', error);
      return [];
    }
  }

  async getQuote(symbol: string) {
    try {
      const url = new URL(`${this.baseUrl}/quote`);
      url.searchParams.append('symbol', symbol);
      url.searchParams.append('apikey', this.apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`TwelveData API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching quote from TwelveData:', error);
      return null;
    }
  }

  // Get currency flag/icon URL based on currency code
  getCurrencyIconUrl(currencyCode: string): string {
    // Using a free currency flag API service
    return `https://flagcdn.com/24x18/${this.getCurrencyCountryCode(
      currencyCode
    )}.png`;
  }

  // Map currency codes to country codes for flag icons
  private getCurrencyCountryCode(currencyCode: string): string {
    const currencyToCountry: Record<string, string> = {
      USD: 'us',
      EUR: 'eu',
      GBP: 'gb',
      JPY: 'jp',
      CHF: 'ch',
      CAD: 'ca',
      AUD: 'au',
      NZD: 'nz',
      CNY: 'cn',
      INR: 'in',
      KRW: 'kr',
      SGD: 'sg',
      HKD: 'hk',
      NOK: 'no',
      SEK: 'se',
      DKK: 'dk',
      PLN: 'pl',
      CZK: 'cz',
      HUF: 'hu',
      RUB: 'ru',
      BRL: 'br',
      MXN: 'mx',
      ZAR: 'za',
      TRY: 'tr',
      THB: 'th',
      MYR: 'my',
      IDR: 'id',
      PHP: 'ph',
      VND: 'vn',
    };

    return currencyToCountry[currencyCode.toUpperCase()] || 'us';
  }

  // Get crypto icon URL
  getCryptoIconUrl(cryptoSymbol: string): string {
    const cryptoIcons: Record<string, string> = {
      BTC: '₿',
      ETH: 'Ξ',
      XAU: '🥇', // Gold
      XAG: '🥈', // Silver
    };

    return cryptoIcons[cryptoSymbol.toUpperCase()] || '💰';
  }

  // Parse trading pair and get appropriate icons
  getPairIcons(pair: string): {
    base: string;
    quote: string;
    baseIcon: string;
    quoteIcon: string;
  } {
    const [base, quote] = pair.split('/');

    const isCrypto = (symbol: string) =>
      ['BTC', 'ETH', 'XAU', 'XAG'].includes(symbol.toUpperCase());

    return {
      base,
      quote,
      baseIcon: isCrypto(base)
        ? this.getCryptoIconUrl(base)
        : this.getCurrencyIconUrl(base),
      quoteIcon: isCrypto(quote)
        ? this.getCryptoIconUrl(quote)
        : this.getCurrencyIconUrl(quote),
    };
  }
}

export const twelveDataService = new TwelveDataService();
export type { TwelveDataSymbol };

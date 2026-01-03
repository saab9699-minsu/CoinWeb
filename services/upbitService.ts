import { UpbitMarket, UpbitTicker, UpbitCandle, Timeframe, NewsArticle } from '../types';

const BASE_URL = 'https://min-api.cryptocompare.com/data';

// Helper to generate the Upbit-style market code (e.g., KRW-BTC)
const formatMarketCode = (symbol: string) => `KRW-${symbol}`;

// Manual mapping for popular coins to ensure Korean names
const COIN_NAME_MAP: Record<string, string> = {
  'BTC': '비트코인',
  'ETH': '이더리움',
  'XRP': '리플',
  'SOL': '솔라나',
  'DOGE': '도지코인',
  'ADA': '에이다',
  'AVAX': '아발란체',
  'DOT': '폴카닷',
  'MATIC': '폴리곤',
  'TRX': '트론',
  'ETC': '이더리움클래식',
  'LINK': '체인링크',
  'BCH': '비트코인캐시',
  'ATOM': '코스모스',
  'LTC': '라이트코인',
  'UNI': '유니스왑',
  'NEAR': '니어프로토콜',
  'APT': '앱토스',
  'SUI': '수이',
  'XLM': '스텔라루멘',
  'EOS': '이오스',
  'SAND': '샌드박스',
  'STX': '스택스',
  'AAVE': '에이브',
  'ARB': '아비트럼',
  'SEI': '세이',
  'SHIB': '시바이누',
  'USDT': '테더',
  'BNB': '비앤비',
  'USDC': '유에스디씨',
  'LEO': '레오',
  'OKB': '오케이비',
  'CRO': '크로노스',
  'FIL': '파일코인',
  'HBAR': '헤데라',
  'VET': '비체인',
  'QNT': '퀀트',
  'MANTRA': '만트라',
  'RNDR': '렌더토큰',
  'INJ': '인젝티브',
  'GRT': '더그래프',
  'OP': '옵티미즘'
};

// Fetch Top Market Cap Coins in KRW to simulate "All Markets"
export const getMarkets = async (): Promise<UpbitMarket[]> => {
  try {
    // Fetch top 50 coins by volume in KRW
    const response = await fetch(`${BASE_URL}/top/totalvolfull?limit=50&tsym=KRW`);
    if (!response.ok) throw new Error('Failed to fetch markets');
    const data = await response.json();
    
    if (!data.Data) return [];

    return data.Data.map((coin: any) => {
        const symbol = coin.CoinInfo.Name;
        // Use mapped Korean name if available, otherwise fallback to English FullName or Name
        const koreanName = COIN_NAME_MAP[symbol] || coin.CoinInfo.FullName || symbol;
        
        return {
            market: formatMarketCode(symbol),
            korean_name: koreanName,
            english_name: coin.CoinInfo.Name
        };
    });
  } catch (error) {
    console.error('API Error (Markets):', error);
    return [];
  }
};

// Fetch current ticker data
export const getTicker = async (market: string): Promise<UpbitTicker | null> => {
  try {
    const symbol = market.replace('KRW-', '');
    const response = await fetch(`${BASE_URL}/pricemultifull?fsyms=${symbol}&tsyms=KRW`);
    if (!response.ok) throw new Error('Failed to fetch ticker');
    const data = await response.json();

    const raw = data.RAW?.[symbol]?.KRW;
    if (!raw) return null;

    return {
      market: market,
      trade_date: new Date().toISOString().split('T')[0].replace(/-/g, ''),
      trade_time: new Date().toTimeString().split(' ')[0].replace(/:/g, ''),
      trade_date_kst: new Date().toISOString().split('T')[0],
      trade_time_kst: new Date().toTimeString().split(' ')[0],
      trade_timestamp: Date.now(),
      opening_price: raw.OPEN24HOUR,
      high_price: raw.HIGH24HOUR,
      low_price: raw.LOW24HOUR,
      trade_price: raw.PRICE,
      prev_closing_price: raw.OPEN24HOUR, // Approximate
      change: raw.CHANGEPCT24HOUR > 0 ? 'RISE' : raw.CHANGEPCT24HOUR < 0 ? 'FALL' : 'EVEN',
      change_price: raw.CHANGE24HOUR,
      change_rate: raw.CHANGEPCT24HOUR / 100, // API returns percentage (e.g. 5.5), we need rate (0.055)
      signed_change_price: raw.CHANGE24HOUR,
      signed_change_rate: raw.CHANGEPCT24HOUR / 100,
      trade_volume: raw.VOLUME24HOUR, // 24h volume
      acc_trade_price: raw.VOLUME24HOURTO, // Total volume in KRW
      acc_trade_price_24h: raw.VOLUME24HOURTO,
      acc_trade_volume: raw.VOLUME24HOUR,
      acc_trade_volume_24h: raw.VOLUME24HOUR,
      highest_52_week_price: raw.HIGH24HOUR, // API limitation: 24h high used as placeholder or separate call needed
      highest_52_week_date: '',
      lowest_52_week_price: raw.LOW24HOUR, // API limitation
      lowest_52_week_date: '',
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('API Error (Ticker):', error);
    return null;
  }
};

// Fetch candle data (chart data)
export const getCandles = async (
  market: string,
  timeframe: Timeframe,
  count: number = 200
): Promise<UpbitCandle[]> => {
  try {
    const symbol = market.replace('KRW-', '');
    let endpoint = 'v2/histominute';
    let aggregate = 1;

    // Map timeframe to CryptoCompare params
    switch (timeframe) {
      case 'minutes/1':
        endpoint = 'v2/histominute';
        aggregate = 1;
        break;
      case 'minutes/15':
        endpoint = 'v2/histominute';
        aggregate = 15;
        break;
      case 'minutes/60':
        endpoint = 'v2/histohour';
        aggregate = 1;
        break;
      case 'minutes/240':
        endpoint = 'v2/histohour';
        aggregate = 4;
        break;
      case 'days':
        endpoint = 'v2/histoday';
        aggregate = 1;
        break;
      case 'weeks':
        endpoint = 'v2/histoday';
        aggregate = 7;
        break;
      default: // months and others fallback to day
        endpoint = 'v2/histoday';
        aggregate = 1;
    }

    const url = `${BASE_URL}/${endpoint}?fsym=${symbol}&tsym=KRW&limit=${count}&aggregate=${aggregate}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch candles');
    const data = await response.json();

    if (!data.Data || !data.Data.Data) return [];

    return data.Data.Data.map((candle: any) => ({
      market: market,
      candle_date_time_utc: new Date(candle.time * 1000).toISOString(),
      candle_date_time_kst: new Date(candle.time * 1000).toLocaleString('sv-SE').replace(' ', 'T'), // Format YYYY-MM-DDTHH:mm:ss for compatibility
      opening_price: candle.open,
      high_price: candle.high,
      low_price: candle.low,
      trade_price: candle.close,
      timestamp: candle.time * 1000,
      candle_acc_trade_price: candle.volumeto,
      candle_acc_trade_volume: candle.volumefrom,
      unit: aggregate
    }));
  } catch (error) {
    console.error('API Error (Candles):', error);
    return [];
  }
};

// Fetch Crypto News
export const getNews = async (market: string): Promise<NewsArticle[]> => {
  try {
    const symbol = market.replace('KRW-', '');
    // Fetch news for the specific coin, fall back to general crypto news if needed
    const response = await fetch(`${BASE_URL}/v2/news/?lang=EN&categories=${symbol},General`);
    if (!response.ok) throw new Error('Failed to fetch news');
    const data = await response.json();
    return data.Data || [];
  } catch (error) {
    console.error('API Error (News):', error);
    return [];
  }
};

// Helper to format currency
export const formatKRW = (price: number) => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(price);
};
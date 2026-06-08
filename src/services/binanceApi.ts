export interface KlineData {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const BINANCE_API_URL = 'https://api.binance.com/api/v3';

export const fetchHistoricalData = async (symbol: string = 'BTCUSDT', interval: string = '1h', limit: number = 500): Promise<KlineData[]> => {
  try {
    const response = await fetch(`${BINANCE_API_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch data from Binance API');
    }
    
    const data = await response.json();
    
    // Binance kline format: [Open time, Open, High, Low, Close, Volume, Close time, ...]
    return data.map((k: any) => ({
      time: k[0] / 1000, // Lightweight charts uses seconds for unix timestamps
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
};

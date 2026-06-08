import type { KlineData } from '../services/binanceApi';

export interface IndicatorSeriesData {
  time: number;
  value: number;
}

// Simple Moving Average (SMA)
export const calculateSMA = (data: KlineData[], period: number): IndicatorSeriesData[] => {
  const result: IndicatorSeriesData[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({
      time: data[i].time,
      value: sum / period,
    });
  }
  return result;
};

// Exponential Moving Average (EMA)
export const calculateEMA = (data: KlineData[], period: number): IndicatorSeriesData[] => {
  const result: IndicatorSeriesData[] = [];
  if (data.length < period) return result;

  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((sum, d) => sum + d.close, 0) / period;
  
  result.push({ time: data[period - 1].time, value: ema });

  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * k + ema;
    result.push({ time: data[i].time, value: ema });
  }

  return result;
};

// Relative Strength Index (RSI)
export const calculateRSI = (data: KlineData[], period: number): IndicatorSeriesData[] => {
  const result: IndicatorSeriesData[] = [];
  if (data.length < period + 1) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));

  result.push({ time: data[period].time, value: rsi });

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));

    result.push({ time: data[i].time, value: rsi });
  }

  return result;
};

// Moving Average Convergence Divergence (MACD)
export interface MACDResult {
  macdLine: IndicatorSeriesData[];
  signalLine: IndicatorSeriesData[];
  histogram: IndicatorSeriesData[];
}

export const calculateMACD = (
  data: KlineData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult => {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  const macdLine: IndicatorSeriesData[] = [];
  
  // Create a map for quick slowEMA lookup
  const slowEMAMap = new Map<number, number>();
  slowEMA.forEach(item => slowEMAMap.set(item.time, item.value));

  fastEMA.forEach(item => {
    if (slowEMAMap.has(item.time)) {
      macdLine.push({
        time: item.time,
        value: item.value - slowEMAMap.get(item.time)!,
      });
    }
  });

  // Calculate Signal Line (EMA of MACD Line)
  // We need to convert MACD line back to mock KlineData for calculateEMA
  const macdKlineMock: KlineData[] = macdLine.map(item => ({
    time: item.time,
    close: item.value,
    open: 0, high: 0, low: 0, volume: 0
  }));

  const signalLine = calculateEMA(macdKlineMock, signalPeriod);
  
  const histogram: IndicatorSeriesData[] = [];
  const signalMap = new Map<number, number>();
  signalLine.forEach(item => signalMap.set(item.time, item.value));

  macdLine.forEach(item => {
    if (signalMap.has(item.time)) {
      histogram.push({
        time: item.time,
        value: item.value - signalMap.get(item.time)!,
      });
    }
  });

  return { macdLine, signalLine, histogram };
};

// Auto Trendlines based on Pivot Points
export interface TrendlineResult {
  support: IndicatorSeriesData[];
  resistance: IndicatorSeriesData[];
}

export const calculateTrendlines = (data: KlineData[], leftBars: number = 10, rightBars: number = 10): TrendlineResult => {
  const support: IndicatorSeriesData[] = [];
  const resistance: IndicatorSeriesData[] = [];

  if (data.length < leftBars + rightBars + 1) return { support, resistance };

  const pivotHighs: {index: number, time: number, value: number}[] = [];
  const pivotLows: {index: number, time: number, value: number}[] = [];

  // Find pivots
  for (let i = leftBars; i < data.length - rightBars; i++) {
    let isHigh = true;
    let isLow = true;

    for (let j = i - leftBars; j <= i + rightBars; j++) {
      if (i === j) continue;
      if (data[j].high >= data[i].high) isHigh = false;
      if (data[j].low <= data[i].low) isLow = false;
    }

    if (isHigh) pivotHighs.push({ index: i, time: data[i].time, value: data[i].high });
    if (isLow) pivotLows.push({ index: i, time: data[i].time, value: data[i].low });
  }

  const lastCandle = data[data.length - 1];
  const lastIndex = data.length - 1;

  // Connect last two pivot highs for Resistance
  if (pivotHighs.length >= 2) {
    const p1 = pivotHighs[pivotHighs.length - 2];
    const p2 = pivotHighs[pivotHighs.length - 1];
    
    const slope = (p2.value - p1.value) / (p2.index - p1.index);
    const endValue = p2.value + slope * (lastIndex - p2.index);

    resistance.push({ time: p1.time, value: p1.value });
    resistance.push({ time: p2.time, value: p2.value });
    if (lastCandle.time !== p2.time) {
      resistance.push({ time: lastCandle.time, value: endValue });
    }
  }

  // Connect last two pivot lows for Support
  if (pivotLows.length >= 2) {
    const p1 = pivotLows[pivotLows.length - 2];
    const p2 = pivotLows[pivotLows.length - 1];
    
    const slope = (p2.value - p1.value) / (p2.index - p1.index);
    const endValue = p2.value + slope * (lastIndex - p2.index);

    support.push({ time: p1.time, value: p1.value });
    support.push({ time: p2.time, value: p2.value });
    if (lastCandle.time !== p2.time) {
      support.push({ time: lastCandle.time, value: endValue });
    }
  }

  return { support, resistance };
};

export interface RegressionChannelResult {
  middle: IndicatorSeriesData[];
  upper: IndicatorSeriesData[];
  lower: IndicatorSeriesData[];
}

// Calculate Linear Regression Channel over the entire data set
export const calculateLinearRegressionChannel = (data: KlineData[], devMultiplier: number = 2): RegressionChannelResult => {
  const result: RegressionChannelResult = { middle: [], upper: [], lower: [] };
  const N = data.length;
  if (N < 2) return result;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < N; i++) {
    const y = data[i].close;
    sumX += i;
    sumY += y;
    sumXY += i * y;
    sumXX += i * i;
  }

  const m = (N * sumXY - sumX * sumY) / (N * sumXX - sumX * sumX);
  const b = (sumY - m * sumX) / N;

  // Calculate standard deviation of residuals
  let sumSqRes = 0;
  for (let i = 0; i < N; i++) {
    const y_fit = m * i + b;
    const res = data[i].close - y_fit;
    sumSqRes += res * res;
  }
  const variance = sumSqRes / N;
  const stdDev = Math.sqrt(variance);

  // We only need the first and last point to draw a straight line across the entire chart
  const p1_time = data[0].time;
  const p1_mid = b;
  const p1_up = b + stdDev * devMultiplier;
  const p1_down = b - stdDev * devMultiplier;

  const p2_time = data[N - 1].time;
  const p2_mid = m * (N - 1) + b;
  const p2_up = p2_mid + stdDev * devMultiplier;
  const p2_down = p2_mid - stdDev * devMultiplier;

  result.middle = [
    { time: p1_time, value: p1_mid },
    { time: p2_time, value: p2_mid }
  ];
  result.upper = [
    { time: p1_time, value: p1_up },
    { time: p2_time, value: p2_up }
  ];
  result.lower = [
    { time: p1_time, value: p1_down },
    { time: p2_time, value: p2_down }
  ];

  return result;
};

export interface TradePerformance {
  totalTrades: number;
  winRate: number; // percentage
  totalRealizedPnlPercent: number; // percentage
  unrealizedPnlPercent: number | null; // currently held trade
  lastEntryPrice: number | null;
  lastExitPrice: number | null;
}

export const calculateStrategyPerformance = (
  data: KlineData[],
  strategyName: 'cdc' | 'macd' | 'rsi',
  ema12Data: IndicatorSeriesData[] | null,
  ema26Data: IndicatorSeriesData[] | null,
  macdData: MACDResult | null,
  rsiData: IndicatorSeriesData[] | null
): TradePerformance => {
  let trades = 0;
  let winningTrades = 0;
  let totalPnl = 0;
  let currentEntryPrice: number | null = null;
  
  let prevCdcTrend: 'bull' | 'bear' | 'none' = 'none';
  let prevMacdDiff = 0;
  let prevRsi = 50;

  const ema12Map = new Map(ema12Data?.map(d => [d.time, d.value]) || []);
  const ema26Map = new Map(ema26Data?.map(d => [d.time, d.value]) || []);
  const rsiMap = new Map(rsiData?.map(d => [d.time, d.value]) || []);
  const macdLineMap = new Map(macdData?.macdLine?.map(d => [d.time, d.value]) || []);
  const signalLineMap = new Map(macdData?.signalLine?.map(d => [d.time, d.value]) || []);

  const closeTrade = (exitPrice: number) => {
    if (currentEntryPrice !== null) {
      trades++;
      const pnl = ((exitPrice - currentEntryPrice) / currentEntryPrice) * 100;
      totalPnl += pnl;
      if (pnl > 0) winningTrades++;
      currentEntryPrice = null;
    }
  };

  const openTrade = (entryPrice: number) => {
    if (currentEntryPrice === null) {
      currentEntryPrice = entryPrice;
    }
  };

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    
    if (strategyName === 'cdc' && ema12Map.has(d.time as number) && ema26Map.has(d.time as number)) {
      const ema12 = ema12Map.get(d.time as number)!;
      const ema26 = ema26Map.get(d.time as number)!;

      let currentCdcTrend: 'bull' | 'bear' | 'none' = 'none';
      if (ema12 > ema26) currentCdcTrend = 'bull';
      else if (ema12 < ema26) currentCdcTrend = 'bear';

      if (currentCdcTrend === 'bull' && prevCdcTrend === 'bear') {
        closeTrade(d.close); // Close any existing short (we only do long entries for now)
        openTrade(d.close);
      } else if (currentCdcTrend === 'bear' && prevCdcTrend === 'bull') {
        closeTrade(d.close);
      }
      
      if (prevCdcTrend === 'none' && currentCdcTrend !== 'none') {
        prevCdcTrend = currentCdcTrend;
      } else if (currentCdcTrend !== 'none') {
        prevCdcTrend = currentCdcTrend;
      }
    } 
    else if (strategyName === 'macd' && macdData && macdLineMap.has(d.time as number) && signalLineMap.has(d.time as number)) {
      const macd = macdLineMap.get(d.time as number)!;
      const signal = signalLineMap.get(d.time as number)!;
      const diff = macd - signal;

      if (i > 0 && prevMacdDiff < 0 && diff >= 0) {
        closeTrade(d.close);
        openTrade(d.close);
      } else if (i > 0 && prevMacdDiff > 0 && diff <= 0) {
        closeTrade(d.close);
      }
      prevMacdDiff = diff;
    }
    else if (strategyName === 'rsi' && rsiData && rsiMap.has(d.time as number)) {
      const rsi = rsiMap.get(d.time as number)!;
      
      if (i > 0 && prevRsi <= 30 && rsi > 30) {
        closeTrade(d.close);
        openTrade(d.close);
      } else if (i > 0 && prevRsi >= 70 && rsi < 70) {
        closeTrade(d.close);
      }
      prevRsi = rsi;
    }
  }

  let unrealizedPnlPercent = null;
  const currentPrice = data.length > 0 ? data[data.length - 1].close : 0;
  if (currentEntryPrice !== null && currentPrice > 0) {
    unrealizedPnlPercent = ((currentPrice - currentEntryPrice) / currentEntryPrice) * 100;
  }

  return {
    totalTrades: trades,
    winRate: trades > 0 ? (winningTrades / trades) * 100 : 0,
    totalRealizedPnlPercent: totalPnl,
    unrealizedPnlPercent: unrealizedPnlPercent,
    lastEntryPrice: currentEntryPrice,
    lastExitPrice: null
  };
};

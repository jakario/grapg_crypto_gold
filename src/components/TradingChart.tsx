import React, { useEffect, useRef } from 'react';
import { 
  createChart, 
  ColorType, 
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  type IChartApi, 
  type ISeriesApi 
} from 'lightweight-charts';
import type { KlineData } from '../services/binanceApi';
import type { IndicatorSeriesData, MACDResult, TrendlineResult, RegressionChannelResult } from '../utils/indicatorUtils';

export interface TradingChartProps {
  data: KlineData[];
  smaData: IndicatorSeriesData[] | null;
  emaData: IndicatorSeriesData[] | null;
  rsiData: IndicatorSeriesData[] | null;
  macdData: MACDResult | null;
  actionZoneActive: boolean;
  ema12Data: IndicatorSeriesData[] | null;
  ema26Data: IndicatorSeriesData[] | null;
  trendlineData: TrendlineResult | null;
  regressionData: RegressionChannelResult | null;
  isLoading: boolean;
  symbol: string;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  data,
  smaData,
  emaData,
  rsiData,
  macdData,
  actionZoneActive,
  ema12Data,
  ema26Data,
  trendlineData,
  regressionData,
  isLoading,
  symbol
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<Record<string, ISeriesApi<any>>>({});

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    });

    chartRef.current = chart;

    // Main Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    seriesRefs.current.candles = candleSeries as any;

    // Volume Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', 
    });
    chart.priceScale('').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    seriesRefs.current.volume = volumeSeries as any;

    // SMA Series
    const smaSeries = chart.addSeries(LineSeries, {
      color: '#eab308',
      lineWidth: 2,
      crosshairMarkerVisible: false,
    });
    seriesRefs.current.sma = smaSeries as any;

    // EMA Series
    const emaSeries = chart.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 2,
      crosshairMarkerVisible: false,
    });
    seriesRefs.current.ema = emaSeries as any;
    
    // CDC Action Zone EMAs (Hidden but exist for tooltip optionally, or just visible as visual aids)
    const actionZoneEma12 = chart.addSeries(LineSeries, {
      color: 'rgba(16, 185, 129, 0.4)',
      lineWidth: 1,
      crosshairMarkerVisible: false,
    });
    const actionZoneEma26 = chart.addSeries(LineSeries, {
      color: 'rgba(239, 68, 68, 0.4)',
      lineWidth: 1,
      crosshairMarkerVisible: false,
    });
    seriesRefs.current.azEma12 = actionZoneEma12 as any;
    seriesRefs.current.azEma26 = actionZoneEma26 as any;

    // Trendline Series
    const resistanceLine = chart.addSeries(LineSeries, {
      color: '#ef4444', // Red for resistance
      lineWidth: 2,
      lineStyle: 1, // Dotted
      crosshairMarkerVisible: false,
    });
    const supportLine = chart.addSeries(LineSeries, {
      color: '#10b981', // Green for support
      lineWidth: 2,
      lineStyle: 1, // Dotted
      crosshairMarkerVisible: false,
    });
    seriesRefs.current.resistanceLine = resistanceLine as any;
    seriesRefs.current.supportLine = supportLine as any;

    // Regression Channel Series
    const regMiddle = chart.addSeries(LineSeries, {
      color: '#8b5cf6',
      lineWidth: 2,
      crosshairMarkerVisible: false,
    });
    const regUpper = chart.addSeries(LineSeries, {
      color: 'rgba(139, 92, 246, 0.5)',
      lineWidth: 2,
      lineStyle: 1, // Dotted
      crosshairMarkerVisible: false,
    });
    const regLower = chart.addSeries(LineSeries, {
      color: 'rgba(139, 92, 246, 0.5)',
      lineWidth: 2,
      lineStyle: 1, // Dotted
      crosshairMarkerVisible: false,
    });
    seriesRefs.current.regMiddle = regMiddle as any;
    seriesRefs.current.regUpper = regUpper as any;
    seriesRefs.current.regLower = regLower as any;

    // RSI Series (Custom scale)
    const rsiSeries = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 2,
      priceScaleId: 'rsi',
    });
    chart.priceScale('rsi').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    seriesRefs.current.rsi = rsiSeries as any;

    // MACD Series (Custom scale)
    const macdLine = chart.addSeries(LineSeries, {
      color: '#ec4899',
      lineWidth: 2,
      priceScaleId: 'macd',
    });
    const signalLine = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 2,
      priceScaleId: 'macd',
    });
    const macdHistogram = chart.addSeries(HistogramSeries, {
      priceScaleId: 'macd',
    });
    chart.priceScale('macd').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    seriesRefs.current.macdLine = macdLine as any;
    seriesRefs.current.signalLine = signalLine as any;
    seriesRefs.current.macdHistogram = macdHistogram as any;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update Data Effect
  useEffect(() => {
    if (!seriesRefs.current.candles || data.length === 0) return;

    const ema12Map = new Map(ema12Data?.map(d => [d.time, d.value]) || []);
    const ema26Map = new Map(ema26Data?.map(d => [d.time, d.value]) || []);
    const rsiMap = new Map(rsiData?.map(d => [d.time, d.value]) || []);
    const macdLineMap = new Map(macdData?.macdLine.map(d => [d.time, d.value]) || []);
    const signalLineMap = new Map(macdData?.signalLine.map(d => [d.time, d.value]) || []);

    const markers: any[] = [];
    let prevColorType: 'none' | 'green' | 'blue' | 'red' | 'orange' = 'none';
    let prevMacdDiff = 0;
    let prevRsi = 50;

    // Map Kline to Candlestick format with CDC Action Zone colors and markers
    const formattedData = data.map((d, index) => {
      let candleColor = undefined;
      let wickColor = undefined;
      let currentColorType: 'none' | 'green' | 'blue' | 'red' | 'orange' = 'none';
      
      // 1. CDC Action Zone
      if (actionZoneActive && ema12Map.has(d.time as number) && ema26Map.has(d.time as number)) {
        const ema12 = ema12Map.get(d.time as number)!;
        const ema26 = ema26Map.get(d.time as number)!;
        const close = d.close;

        if (ema12 > ema26 && close > ema12) {
          candleColor = '#10b981'; wickColor = '#10b981'; currentColorType = 'green';
        } else if (ema12 > ema26 && close <= ema12) {
          candleColor = '#3b82f6'; wickColor = '#3b82f6'; currentColorType = 'blue';
        } else if (ema12 < ema26 && close < ema12) {
          candleColor = '#ef4444'; wickColor = '#ef4444'; currentColorType = 'red';
        } else if (ema12 < ema26 && close >= ema12) {
          candleColor = '#f59e0b'; wickColor = '#f59e0b'; currentColorType = 'orange';
        }

        if (currentColorType === 'green' && prevColorType !== 'green' && prevColorType !== 'none') {
          markers.push({ time: d.time as any, position: 'belowBar', color: '#10b981', shape: 'arrowUp', text: 'CDC BUY', size: 2 });
        } else if (currentColorType === 'red' && prevColorType !== 'red' && prevColorType !== 'none') {
          markers.push({ time: d.time as any, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'CDC SELL', size: 2 });
        }
        
        if (currentColorType !== 'none') {
          prevColorType = currentColorType;
        }
      }

      // 2. MACD Signals
      if (macdData && macdLineMap.has(d.time as number) && signalLineMap.has(d.time as number)) {
        const macd = macdLineMap.get(d.time as number)!;
        const signal = signalLineMap.get(d.time as number)!;
        const diff = macd - signal;

        if (index > 0 && prevMacdDiff < 0 && diff >= 0) {
          markers.push({ time: d.time as any, position: 'belowBar', color: '#ec4899', shape: 'circle', text: 'MACD Buy' });
        } else if (index > 0 && prevMacdDiff > 0 && diff <= 0) {
          markers.push({ time: d.time as any, position: 'aboveBar', color: '#ec4899', shape: 'circle', text: 'MACD Sell' });
        }
        prevMacdDiff = diff;
      }

      // 3. RSI Signals
      if (rsiData && rsiMap.has(d.time as number)) {
        const rsi = rsiMap.get(d.time as number)!;
        
        if (index > 0 && prevRsi <= 30 && rsi > 30) {
          markers.push({ time: d.time as any, position: 'belowBar', color: '#06b6d4', shape: 'arrowUp', text: 'RSI Buy' });
        } else if (index > 0 && prevRsi >= 70 && rsi < 70) {
          markers.push({ time: d.time as any, position: 'aboveBar', color: '#06b6d4', shape: 'arrowDown', text: 'RSI Sell' });
        }
        prevRsi = rsi;
      }

      return {
        time: d.time as any,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        ...(candleColor ? { color: candleColor, wickColor: wickColor } : {})
      };
    });

    // Sort markers by time
    markers.sort((a, b) => (a.time as number) - (b.time as number));
    
    // Deduplicate markers by time (Lightweight Charts throws error if multiple markers have the EXACT same time)
    const uniqueMarkers: any[] = [];
    let lastTime = 0;
    for (const m of markers) {
      if (m.time !== lastTime) {
        uniqueMarkers.push(m);
        lastTime = m.time;
      } else {
        // If same time, merge text and keep the first marker's visual
        uniqueMarkers[uniqueMarkers.length - 1].text += ` & ${m.text}`;
      }
    }
    
    const volumeData = data.map(d => ({
      time: d.time as any,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    }));

    seriesRefs.current.candles.setData(formattedData);
    try {
      (seriesRefs.current.candles as any).setMarkers(uniqueMarkers);
    } catch (e) {
      console.error("Error setting markers:", e);
    }
    seriesRefs.current.volume.setData(volumeData);

    // Update Action Zone EMAs
    if (actionZoneActive && ema12Data && ema26Data) {
      seriesRefs.current.azEma12.setData(ema12Data as any);
      seriesRefs.current.azEma26.setData(ema26Data as any);
    } else {
      seriesRefs.current.azEma12.setData([]);
      seriesRefs.current.azEma26.setData([]);
    }

    // Update SMA
    if (smaData) seriesRefs.current.sma.setData(smaData as any);
    else seriesRefs.current.sma.setData([]);

    // Update EMA
    if (emaData) seriesRefs.current.ema.setData(emaData as any);
    else seriesRefs.current.ema.setData([]);

    // Update RSI
    if (rsiData) {
      seriesRefs.current.rsi.setData(rsiData as any);
      chartRef.current?.priceScale('rsi').applyOptions({
        scaleMargins: { top: macdData ? 0.6 : 0.8, bottom: macdData ? 0.2 : 0 },
      });
    } else {
      seriesRefs.current.rsi.setData([]);
    }

    // Update MACD
    if (macdData) {
      seriesRefs.current.macdLine.setData(macdData.macdLine as any);
      seriesRefs.current.signalLine.setData(macdData.signalLine as any);
      seriesRefs.current.macdHistogram.setData(
        macdData.histogram.map(h => ({
          time: h.time as any,
          value: h.value,
          color: h.value >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)',
        }))
      );
      chartRef.current?.priceScale('macd').applyOptions({
        scaleMargins: { top: rsiData ? 0.8 : 0.8, bottom: 0 },
      });
    } else {
      seriesRefs.current.macdLine.setData([]);
      seriesRefs.current.signalLine.setData([]);
      seriesRefs.current.macdHistogram.setData([]);
    }

    // Update Trendlines
    if (trendlineData) {
      seriesRefs.current.supportLine.setData(trendlineData.support as any);
      seriesRefs.current.resistanceLine.setData(trendlineData.resistance as any);
    } else {
      seriesRefs.current.supportLine.setData([]);
      seriesRefs.current.resistanceLine.setData([]);
    }

    // Update Regression
    if (regressionData) {
      seriesRefs.current.regMiddle.setData(regressionData.middle as any);
      seriesRefs.current.regUpper.setData(regressionData.upper as any);
      seriesRefs.current.regLower.setData(regressionData.lower as any);
    } else {
      seriesRefs.current.regMiddle.setData([]);
      seriesRefs.current.regUpper.setData([]);
      seriesRefs.current.regLower.setData([]);
    }

    if (data.length > 0) {
      // Don't auto fit content on every tick to avoid jumping, 
      // but do it on large data changes or initial load
      if (data.length === 1000) {
        chartRef.current?.timeScale().fitContent();
      }
    }
  }, [data, smaData, emaData, rsiData, macdData, actionZoneActive, ema12Data, ema26Data, trendlineData, regressionData]);

  const currentPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const previousPrice = data.length > 1 ? data[data.length - 2].close : 0;
  const isUp = currentPrice >= previousPrice;

  return (
    <div className="glass-panel chart-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <div>Loading Market Data...</div>
        </div>
      )}
      <div className="chart-header">
        <div className="pair-info">
          <div className="pair-name">{symbol === 'BTCUSDT' ? 'BTC / USDT' : symbol === 'ETHUSDT' ? 'ETH / USDT' : 'GOLD / USDT'}</div>
          <div className={`price-display ${isUp ? 'price-up' : 'price-down'}`}>
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
      <div className="chart-wrapper" ref={chartContainerRef} />
    </div>
  );
};

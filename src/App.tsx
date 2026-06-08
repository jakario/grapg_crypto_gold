import { useState, useEffect, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { TradingChart } from './components/TradingChart';
import { IndicatorsPanel } from './components/IndicatorsPanel';
import type { IndicatorConfig } from './components/IndicatorsPanel';
import { fetchHistoricalData } from './services/binanceApi';
import type { KlineData } from './services/binanceApi';
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD, calculateTrendlines, calculateLinearRegressionChannel, calculateStrategyPerformance } from './utils/indicatorUtils';
import { PerformancePanel } from './components/PerformancePanel';

function App() {
  const [data, setData] = useState<KlineData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [intervalTime, setIntervalTime] = useState<string>('1h');
  const [symbol, setSymbol] = useState<string>('BTCUSDT');
  const [toastMsg, setToastMsg] = useState<{title: string, message: string, type: 'buy' | 'sell' | 'hold' | 'rebound'} | null>(null);
  
  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>({
    actionZone: false,
    autoTrendline: false,
    regressionTrend: false,
    sma: { active: true, period: 20 },
    ema: { active: false, period: 50 },
    rsi: { active: false, period: 14 },
    macd: { active: false, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const klines = await fetchHistoricalData(symbol, intervalTime, 1000);
        setData(klines);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();

    // Set up polling for real-time feel (every 1 minute)
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [intervalTime, symbol]);

  // Compute indicators using useMemo so it only recalculates when config or data changes
  const smaData = useMemo(() => {
    if (!indicatorConfig.sma.active || data.length === 0) return null;
    return calculateSMA(data, indicatorConfig.sma.period);
  }, [data, indicatorConfig.sma]);

  const emaData = useMemo(() => {
    if (!indicatorConfig.ema.active || data.length === 0) return null;
    return calculateEMA(data, indicatorConfig.ema.period);
  }, [data, indicatorConfig.ema]);

  const rsiData = useMemo(() => {
    if (!indicatorConfig.rsi.active || data.length === 0) return null;
    return calculateRSI(data, indicatorConfig.rsi.period);
  }, [data, indicatorConfig.rsi]);

  const macdData = useMemo(() => {
    if (!indicatorConfig.macd.active || data.length === 0) return null;
    return calculateMACD(
      data,
      indicatorConfig.macd.fastPeriod,
      indicatorConfig.macd.slowPeriod,
      indicatorConfig.macd.signalPeriod
    );
  }, [data, indicatorConfig.macd]);

  // CDC Action Zone always uses EMA 12 and 26
  const ema12Data = useMemo(() => {
    if (!indicatorConfig.actionZone || data.length === 0) return null;
    return calculateEMA(data, 12);
  }, [data, indicatorConfig.actionZone]);

  const ema26Data = useMemo(() => {
    if (!indicatorConfig.actionZone || data.length === 0) return null;
    return calculateEMA(data, 26);
  }, [data, indicatorConfig.actionZone]);

  const trendlineData = useMemo(() => {
    if (!indicatorConfig.autoTrendline || data.length === 0) return null;
    return calculateTrendlines(data, 10, 10);
  }, [data, indicatorConfig.autoTrendline]);

  const regressionData = useMemo(() => {
    if (!indicatorConfig.regressionTrend || data.length === 0) return null;
    return calculateLinearRegressionChannel(data, 2);
  }, [data, indicatorConfig.regressionTrend]);

  const activeStrategy = useMemo(() => {
    if (indicatorConfig.actionZone) return 'cdc';
    if (indicatorConfig.macd.active) return 'macd';
    if (indicatorConfig.rsi.active) return 'rsi';
    return null;
  }, [indicatorConfig]);

  const strategyPerformance = useMemo(() => {
    if (!activeStrategy || data.length === 0) return null;
    return calculateStrategyPerformance(
      data,
      activeStrategy,
      ema12Data,
      ema26Data,
      macdData,
      rsiData
    );
  }, [data, activeStrategy, ema12Data, ema26Data, macdData, rsiData]);

  // Effect to persistently show CDC Action Zone status
  useEffect(() => {
    if (!indicatorConfig.actionZone || data.length < 2 || !ema12Data || !ema26Data) {
      setToastMsg(null);
      return;
    }

    const currentCandle = data[data.length - 1];
    const currentEma12 = ema12Data.find(d => d.time === currentCandle.time)?.value;
    const currentEma26 = ema26Data.find(d => d.time === currentCandle.time)?.value;

    if (!currentEma12 || !currentEma26) return;

    if (currentEma12 > currentEma26) {
      if (currentCandle.close > currentEma12) {
        setToastMsg({ 
          title: '🟢 BUY ZONE', 
          message: `Strong uptrend. Current Price: $${currentCandle.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
          type: 'buy' 
        });
      } else {
        setToastMsg({ 
          title: '🔵 TAKE PROFIT / HOLD', 
          message: `Weakening uptrend. Current Price: $${currentCandle.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
          type: 'hold' 
        });
      }
    } else {
      if (currentCandle.close < currentEma12) {
        setToastMsg({ 
          title: '🔴 SELL ZONE', 
          message: `Strong downtrend. Current Price: $${currentCandle.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
          type: 'sell' 
        });
      } else {
        setToastMsg({ 
          title: '🟠 REBOUND ZONE', 
          message: `Potential reversal. Current Price: $${currentCandle.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
          type: 'rebound' 
        });
      }
    }
  }, [data, ema12Data, ema26Data, indicatorConfig.actionZone]);

  return (
    <div className="app-container">
      <header className="app-header glass-panel">
        <div className="logo-section">
          <Activity size={32} className="logo-icon" />
          <div className="logo-text">ชาวดอย Trading</div>
        </div>
        
        <div className="timeframe-selector">
          {['BTCUSDT', 'ETHUSDT', 'PAXGUSDT'].map(s => (
            <button 
              key={s} 
              className={`tf-btn ${symbol === s ? 'active' : ''}`}
              onClick={() => setSymbol(s)}
            >
              {s === 'BTCUSDT' ? 'BTC' : s === 'ETHUSDT' ? 'ETH' : 'GOLD'}
            </button>
          ))}
          <div className="separator" style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>
          {['5m', '15m', '1h', '4h', '1d'].map(t => (
            <button 
              key={t} 
              className={`tf-btn ${intervalTime === t ? 'active' : ''}`}
              onClick={() => setIntervalTime(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </header>
      
      <main className="main-content">
        <IndicatorsPanel 
          config={indicatorConfig} 
          onChange={setIndicatorConfig} 
        />
        
        <div className="chart-wrapper">
          <TradingChart 
            data={data} 
            isLoading={isLoading} 
            symbol={symbol}
            actionZoneActive={indicatorConfig.actionZone}
            smaData={smaData}
            emaData={emaData}
            rsiData={rsiData}
            macdData={macdData}
            ema12Data={ema12Data}
            ema26Data={ema26Data}
            trendlineData={trendlineData}
            regressionData={regressionData}
          />
          {toastMsg && (
            <div className={`toast-notification glass-panel ${toastMsg.type}`}>
              <div className="toast-title">{toastMsg.title}</div>
              <div className="toast-message">{toastMsg.message}</div>
            </div>
          )}
          <PerformancePanel 
            performance={strategyPerformance} 
            strategyName={activeStrategy === 'cdc' ? 'CDC Action Zone' : activeStrategy === 'macd' ? 'MACD' : 'RSI'} 
            isActive={!!activeStrategy} 
          />
        </div>
      </main>
    </div>
  );
}

export default App;

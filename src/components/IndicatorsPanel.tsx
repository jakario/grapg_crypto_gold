import React from 'react';
import { Activity } from 'lucide-react';

export interface IndicatorConfig {
  actionZone: boolean;
  autoTrendline: boolean;
  regressionTrend: boolean;
  sma: { active: boolean; period: number };
  ema: { active: boolean; period: number };
  rsi: { active: boolean; period: number };
  macd: { active: boolean; fastPeriod: number; slowPeriod: number; signalPeriod: number };
}

interface IndicatorsPanelProps {
  config: IndicatorConfig;
  onChange: (newConfig: IndicatorConfig) => void;
}

export const IndicatorsPanel: React.FC<IndicatorsPanelProps> = ({ config, onChange }) => {
  const toggleIndicator = (key: keyof IndicatorConfig) => {
    if (key === 'actionZone') {
      onChange({ ...config, actionZone: !config.actionZone });
    } else {
      onChange({
        ...config,
        [key]: {
          ...(config[key] as any),
          active: !(config[key] as any).active,
        },
      });
    }
  };

  const updateNumber = (key: keyof IndicatorConfig, field: string, value: number) => {
    onChange({
      ...config,
      [key]: {
        ...(config[key] as any),
        [field]: value,
      },
    });
  };

  return (
    <div className="glass-panel indicators-sidebar">
      <div className="sidebar-title">
        <Activity size={20} className="logo-icon" />
        Indicators
      </div>

      {/* CDC Action Zone Card */}
      <div className="indicator-card" style={{ borderColor: config.actionZone ? 'var(--up-color)' : 'var(--glass-border)' }}>
        <div className="indicator-header">
          <div className="indicator-name" style={{ color: config.actionZone ? 'var(--up-color)' : 'var(--text-primary)' }}>CDC Action Zone</div>
          <label className="switch">
            <input type="checkbox" checked={config.actionZone} onChange={() => toggleIndicator('actionZone')} />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* Auto Trendline Card */}
      <div className="indicator-card" style={{ borderColor: config.autoTrendline ? '#0ea5e9' : 'var(--glass-border)' }}>
        <div className="indicator-header">
          <div className="indicator-name" style={{ color: config.autoTrendline ? '#0ea5e9' : 'var(--text-primary)' }}>Auto Trendlines</div>
          <label className="switch">
            <input type="checkbox" checked={config.autoTrendline} onChange={() => toggleIndicator('autoTrendline')} />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* Regression Trend Card */}
      <div className="indicator-card" style={{ borderColor: config.regressionTrend ? '#8b5cf6' : 'var(--glass-border)' }}>
        <div className="indicator-header">
          <div className="indicator-name" style={{ color: config.regressionTrend ? '#8b5cf6' : 'var(--text-primary)' }}>Regression Channel</div>
          <label className="switch">
            <input type="checkbox" checked={config.regressionTrend} onChange={() => toggleIndicator('regressionTrend')} />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* SMA Card */}
      <div className="indicator-card">
        <div className="indicator-header">
          <div className="indicator-name" style={{ color: 'var(--sma-color)' }}>SMA</div>
          <label className="switch">
            <input type="checkbox" checked={config.sma.active} onChange={() => toggleIndicator('sma')} />
            <span className="slider"></span>
          </label>
        </div>
        {config.sma.active && (
          <div className="input-group">
            <label>Length</label>
            <input 
              type="number" 
              className="number-input" 
              value={config.sma.period} 
              onChange={(e) => updateNumber('sma', 'period', parseInt(e.target.value) || 1)}
            />
          </div>
        )}
      </div>

      {/* EMA Card */}
      <div className="indicator-card">
        <div className="indicator-header">
          <div className="indicator-name" style={{ color: 'var(--ema-color)' }}>EMA</div>
          <label className="switch">
            <input type="checkbox" checked={config.ema.active} onChange={() => toggleIndicator('ema')} />
            <span className="slider"></span>
          </label>
        </div>
        {config.ema.active && (
          <div className="input-group">
            <label>Length</label>
            <input 
              type="number" 
              className="number-input" 
              value={config.ema.period} 
              onChange={(e) => updateNumber('ema', 'period', parseInt(e.target.value) || 1)}
            />
          </div>
        )}
      </div>

      {/* RSI Card */}
      <div className="indicator-card">
        <div className="indicator-header">
          <div className="indicator-name" style={{ color: 'var(--rsi-color)' }}>RSI</div>
          <label className="switch">
            <input type="checkbox" checked={config.rsi.active} onChange={() => toggleIndicator('rsi')} />
            <span className="slider"></span>
          </label>
        </div>
        {config.rsi.active && (
          <div className="input-group">
            <label>Length</label>
            <input 
              type="number" 
              className="number-input" 
              value={config.rsi.period} 
              onChange={(e) => updateNumber('rsi', 'period', parseInt(e.target.value) || 1)}
            />
          </div>
        )}
      </div>

      {/* MACD Card */}
      <div className="indicator-card">
        <div className="indicator-header">
          <div className="indicator-name" style={{ color: 'var(--macd-color)' }}>MACD</div>
          <label className="switch">
            <input type="checkbox" checked={config.macd.active} onChange={() => toggleIndicator('macd')} />
            <span className="slider"></span>
          </label>
        </div>
        {config.macd.active && (
          <>
            <div className="input-group">
              <label>Fast Length</label>
              <input 
                type="number" 
                className="number-input" 
                value={config.macd.fastPeriod} 
                onChange={(e) => updateNumber('macd', 'fastPeriod', parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="input-group">
              <label>Slow Length</label>
              <input 
                type="number" 
                className="number-input" 
                value={config.macd.slowPeriod} 
                onChange={(e) => updateNumber('macd', 'slowPeriod', parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="input-group">
              <label>Signal Length</label>
              <input 
                type="number" 
                className="number-input" 
                value={config.macd.signalPeriod} 
                onChange={(e) => updateNumber('macd', 'signalPeriod', parseInt(e.target.value) || 1)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

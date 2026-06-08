import React from 'react';
import type { TradePerformance } from '../utils/indicatorUtils';

interface PerformancePanelProps {
  performance: TradePerformance | null;
  strategyName: string;
  isActive: boolean;
}

export const PerformancePanel: React.FC<PerformancePanelProps> = ({ performance, strategyName, isActive }) => {
  if (!isActive || !performance) return null;

  return (
    <div className="performance-panel glass-panel">
      <div className="performance-header">
        <h3>{strategyName} Performance</h3>
      </div>
      
      <div className="performance-grid">
        <div className="perf-metric">
          <span className="perf-label">Total Trades</span>
          <span className="perf-value">{performance.totalTrades}</span>
        </div>
        
        <div className="perf-metric">
          <span className="perf-label">Win Rate</span>
          <span className="perf-value" style={{ color: performance.winRate > 50 ? '#10b981' : performance.winRate < 50 ? '#ef4444' : '#fff' }}>
            {performance.winRate.toFixed(1)}%
          </span>
        </div>
        
        <div className="perf-metric">
          <span className="perf-label">Net Profit (Realized)</span>
          <span className="perf-value" style={{ color: performance.totalRealizedPnlPercent >= 0 ? '#10b981' : '#ef4444' }}>
            {performance.totalRealizedPnlPercent >= 0 ? '+' : ''}{performance.totalRealizedPnlPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="current-trade-section">
        <h4>Current Open Position</h4>
        {performance.unrealizedPnlPercent !== null && performance.lastEntryPrice !== null ? (
          <div className="current-trade-stats">
            <div className="perf-metric">
              <span className="perf-label">Entry Price</span>
              <span className="perf-value">${performance.lastEntryPrice.toFixed(2)}</span>
            </div>
            <div className="perf-metric">
              <span className="perf-label">Unrealized PnL</span>
              <span className="perf-value" style={{ color: performance.unrealizedPnlPercent >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                {performance.unrealizedPnlPercent >= 0 ? '+' : ''}{performance.unrealizedPnlPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="no-trade">Waiting for Signal...</div>
        )}
      </div>
    </div>
  );
};

"use client";
import React, { useMemo } from 'react';
import type { TradeTick } from '@/store/slices/liveTradesSlice';

interface SparklineProps {
  ticks: TradeTick[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
}

// Simple SVG sparkline (newest first ticks expected; will be reversed)
export const Sparkline: React.FC<SparklineProps> = ({
  ticks,
  width = 300,
  height = 60,
  // stroke prop reserved for future customization
  strokeWidth = 1.5,
}) => {
  const pathData = useMemo(() => {
    if (!ticks.length) return '';
    const points = [...ticks].slice(0, 120).reverse(); // oldest -> newest limited to 120
    const prices = points.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1; // avoid div by zero
    const stepX = width / Math.max(points.length - 1, 1);
    const coords = points.map((p, i) => {
      const x = i * stepX;
      const norm = (p.price - min) / range; // 0..1
      const y = height - norm * height; // invert
      return [x, y];
    });
    return coords.reduce((acc, [x, y], idx) => acc + `${idx === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`, '');
  }, [ticks, width, height]);

  const last = ticks[0];
  const first = ticks.length ? ticks[ticks.length - 1] : undefined;
  const change = last && first ? last.price - first.price : 0;
  const positive = change >= 0;

  return (
    <div className="flex flex-col gap-1">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <path d={pathData} fill="none" stroke={positive ? 'var(--success, #16a34a)' : 'var(--destructive, #dc2626)'} strokeWidth={strokeWidth} />
      </svg>
      <div className="text-xs text-muted-foreground flex gap-3">
        <span>Δ {change ? (change > 0 ? '+' : '') + change.toFixed(2) : '0.00'}</span>
        {first && last && <span>Range {Math.min(first.price, last.price).toFixed(2)} - {Math.max(first.price, last.price).toFixed(2)}</span>}
      </div>
    </div>
  );
};

export default Sparkline;
"use client";

import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getChartColors, formatChartNumber } from '@/lib/chart-utils';
import type { ChartComponentProps } from '@/types/chart';

export function LineChartComponent({ data, config, compact = false }: ChartComponentProps) {
  const colors = getChartColors(config.theme);
  const height = compact ? 200 : (config.height || 300);

  // Get Y-axis fields
  const yFields = Array.isArray(config.yAxis) ? config.yAxis : [config.yAxis].filter(Boolean);
  
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: compact ? 5 : 20,
            right: compact ? 5 : 30,
            left: compact ? 5 : 20,
            bottom: compact ? 5 : 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey={config.xAxis || 'name'}
            tick={{ fontSize: compact ? 10 : 12 }}
            hide={compact && !config.xAxis}
          />
          <YAxis 
            tick={{ fontSize: compact ? 10 : 12 }}
            tickFormatter={(value) => formatChartNumber(value)}
            hide={compact}
          />
          {!compact && (
            <Tooltip 
              formatter={(value: number) => [formatChartNumber(value), '']}
              labelStyle={{ color: 'var(--foreground)' }}
              contentStyle={{ 
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '6px'
              }}
            />
          )}
          {config.showLegend && !compact && <Legend />}
          
          {yFields.map((field, index) => (
            <Line
              key={field || `line-${index}`}
              type="monotone"
              dataKey={field || 'value'}
              stroke={colors[index % colors.length]}
              strokeWidth={compact ? 1.5 : 2}
              dot={compact ? false : { fill: colors[index % colors.length], strokeWidth: 2, r: 3 }}
              activeDot={compact ? false : { r: 5 }}
              animationDuration={config.animations !== false ? 750 : 0}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getChartColors, formatChartNumber } from '@/lib/chart-utils';
import type { ChartComponentProps } from '@/types/chart';

export function BarChartComponent({ data, config, compact = false }: ChartComponentProps) {
  const colors = getChartColors(config.theme);
  const height = compact ? 200 : (config.height || 300);

  // Get Y-axis fields
  const yFields = Array.isArray(config.yAxis) ? config.yAxis : [config.yAxis].filter(Boolean);
  
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
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
            <Bar
              key={field || `bar-${index}`}
              dataKey={field || 'value'}
              fill={colors[index % colors.length]}
              radius={[2, 2, 0, 0]}
              animationDuration={config.animations !== false ? 750 : 0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

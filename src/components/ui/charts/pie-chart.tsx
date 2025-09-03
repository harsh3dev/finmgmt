"use client";

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { getChartColors, formatChartNumber } from '@/lib/chart-utils';
import type { ChartComponentProps } from '@/types/chart';

export function PieChartComponent({ data, config, compact = false }: ChartComponentProps) {
  const colors = getChartColors(config.theme);
  const height = compact ? 200 : (config.height || 300);

  // Transform data for pie chart - use first Y field or 'value'
  const yField = Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis || 'value';
  
  const pieData = data.map((item, index) => ({
    name: item[config.xAxis || 'name'] || `Item ${index + 1}`,
    value: Number(item[yField]) || 0,
  }));
  
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={compact ? 60 : 80}
            fill="#8884d8"
            dataKey="value"
            animationDuration={config.animations !== false ? 750 : 0}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
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
          {config.showLegend && !compact && (
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";
import React, { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, Tooltip, Area } from "recharts";
import type { TradeTick } from "@/store/slices/liveTradesSlice";

interface Props {
  ticks: TradeTick[];          // newest first
  maxPoints?: number;
  height?: number;
}

const LiveLineChart: React.FC<Props> = ({ ticks, maxPoints = 300, height = 220 }) => {
  const data = useMemo(() => {
    if (!ticks.length) return [];
    const slice = [...ticks].slice(0, maxPoints).reverse();
    return slice.map(t => ({ t: t.ts, price: t.price }));
  }, [ticks, maxPoints]);

  const { stroke, min, max } = useMemo(() => {
    if (data.length < 2) {
      return { stroke: "hsl(var(--chart-line-primary))", min: 0, max: 1 };
    }
    const first = data[0].price;
    const last = data[data.length - 1].price;
    const up = last >= first;
    const prices = data.map(d => d.price);
    const pMin = Math.min(...prices);
    const pMax = Math.max(...prices);
    const range = Math.max(0.01, pMax - pMin);
    const pad = range * 0.01;
    return {
      stroke: up ? "var(--green-500, #16a34a)" : "var(--red-500, #dc2626)",
      min: pMin - pad,
      max: pMax + pad,
    };
  }, [data]);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="priceLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={stroke} />
              <stop offset="100%" stopColor={stroke} />
            </linearGradient>
          </defs>

          {/* Minimal X axis (time) - can hide if not needed */}
          <XAxis
            dataKey="t"
            tickFormatter={(v) =>
              new Date(v).toLocaleTimeString([], { hour12: false, minute: "2-digit", second: "2-digit" })
            }
            minTickGap={48}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />

            {/* Price scale on right only */}
          <YAxis
            orientation="right"
            dataKey="price"
            domain={[min, max]}
            width={50}
            tickFormatter={(v) => v.toFixed(2)}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
            labelFormatter={(v) =>
              new Date(v).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
            }
            formatter={(val) => [Number(val as number).toFixed(2), "Price"]}
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              fontSize: 12,
              padding: "4px 8px",
            }}
          />

          <Area
            dataKey="price"
            type="monotone"
            stroke="none"
            fill="url(#priceArea)"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="url(#priceLine)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LiveLineChart;
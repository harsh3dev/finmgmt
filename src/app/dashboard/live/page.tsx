"use client";
import React, { useState, useRef, useEffect } from 'react';
import LiveLineChart from '@/components/live/live-line-chart';
import { useLiveTrades } from '@/hooks/use-live-trades';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function LiveTradesPage() {
  const { symbol, setSymbol, ticks, status, lastTick, change, changePct, reconnect, error } = useLiveTrades();
  const [input, setInput] = useState(symbol);
  const prevPriceRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (!lastTick) return;
    const prev = prevPriceRef.current;
    if (prev != null && lastTick.price !== prev) {
      setFlash(lastTick.price > prev ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), 550);
      return () => clearTimeout(t);
    }
    prevPriceRef.current = lastTick.price;
  }, [lastTick]);

  const totalVolume = ticks.reduce((s, t) => s + t.volume, 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) setSymbol(input.trim());
  };

  return (
    <DashboardLayout>
    <div className="p-0 space-y-4">
      <h1 className="text-xl font-semibold">Live Trades (MVP)</h1>
      <div className="rounded-md border bg-card/60 backdrop-blur px-3 py-3 space-y-3">
        <form onSubmit={submit} className="flex flex-wrap gap-2 items-center">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Symbol (e.g. AAPL, BINANCE:BTCUSDT)"
            className="border px-3 py-1.5 rounded bg-background/70 flex-1 min-w-[200px] text-sm focus:outline-none focus:ring focus:ring-blue-500/40"
          />
          <button type="submit" className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 transition text-white text-sm font-medium">Subscribe</button>
          <StatusBadge status={status} />
          {status === 'error' && (
            <button type="button" onClick={() => reconnect()} className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-medium">Reconnect</button>
          )}
          {error && <div className="basis-full text-xs text-red-500 mt-1">{error}</div>}
        </form>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Symbol" value={symbol} subtle />
          <StatCard
            label="Last Price"
            value={lastTick ? lastTick.price.toFixed(2) : '—'}
            highlight
            flash={flash}
            loading={status === 'connecting'}
          />
          <StatCard
            label="Change"
            value={change != null && changePct != null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePct.toFixed(2)}%)` : '—'}
            intent={change != null ? (change > 0 ? 'up' : change < 0 ? 'down' : undefined) : undefined}
          />
          <div className="sm:col-span-3 grid md:grid-cols-4 gap-4">
            <div className="md:col-span-3 flex-1 border rounded p-3 bg-background/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Live Price Chart</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{ticks.length} ticks • Vol {totalVolume}</div>
              </div>
              <LiveLineChart ticks={ticks} />
            </div>
            <div className="w-full md:w-auto border rounded p-3 bg-background/40 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Recent Trades</div>
                <div className="text-[10px] text-muted-foreground">latest first</div>
              </div>
              <div className="text-[11px] grid grid-cols-3 font-medium text-muted-foreground border-b pb-1 mb-1">
                <span>Time</span>
                <span className="text-right">Price</span>
                <span className="text-right">Vol</span>
              </div>
              <ul className="max-h-72 overflow-auto text-sm font-mono space-y-0.5 pr-1">
                {ticks.map(t => (
                  <li
                    key={t.id}
                    className="grid grid-cols-3 text-xs items-center tabular-nums rounded px-1 py-0.5 odd:bg-muted/20"
                  >
                    <span>{new Date(t.ts).toLocaleTimeString()}</span>
                    <span className="text-right">{t.price.toFixed(2)}</span>
                    <span className="text-right text-muted-foreground">{t.volume}</span>
                  </li>
                ))}
                {!ticks.length && <li className="text-muted-foreground px-1 py-1 text-xs">Waiting for ticks...</li>}
              </ul>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">Auto-retries on disconnect with exponential backoff & rate limit detection. Price flashes green/red briefly on movement.</p>
      </div>
    </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'live' ? 'bg-green-600' : status === 'error' ? 'bg-red-600' : status === 'connecting' ? 'bg-amber-500' : 'bg-gray-500';
  return <span className={`text-white px-2 py-0.5 rounded text-xs ${color}`}>{status}</span>;
}

interface StatCardProps {
  label: string; value: React.ReactNode; intent?: 'up' | 'down'; subtle?: boolean; highlight?: boolean; flash?: 'up' | 'down' | null; loading?: boolean;
}

function StatCard({ label, value, intent, subtle, highlight, flash, loading }: StatCardProps) {
  const intentColor = intent === 'up' ? 'text-green-600' : intent === 'down' ? 'text-red-600' : 'text-muted-foreground';
  const flashBg = flash === 'up' ? 'bg-green-500/20' : flash === 'down' ? 'bg-red-500/20' : '';
  return (
    <div className={`relative border rounded p-3 bg-background/40 ${highlight ? 'shadow-sm' : ''}`}>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className={`text-lg font-semibold tabular-nums transition-colors ${flashBg} ${highlight ? 'leading-tight' : ''} ${subtle ? 'font-medium' : ''}`}>
        {loading ? <span className="inline-block h-5 w-16 rounded animate-pulse bg-muted/60" /> : (
          <span className={intent ? intentColor : ''}>{value}</span>
        )}
      </div>
    </div>
  );
}
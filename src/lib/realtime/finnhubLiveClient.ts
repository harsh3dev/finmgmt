import { Store } from 'redux';
import { connectRequested, connectSuccess, connectError, ticksAdded } from '@/store/slices/liveTradesSlice';
import type { RootState } from '@/store/rootReducer';

interface FinnhubTradeMsg {
  type: string;
  data?: { p: number; v: number; t: number; s: string }[];
  msg?: string; // error or info message
}

export class FinnhubLiveClient {
  private ws: WebSocket | null = null;
  private symbol: string | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private store: Store<RootState>;
  private apiKey: string;
  private failures = 0;
  private lastConnectTs = 0;
  private explicitlyClosed = false;
  private debug = typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_DEBUG_WS === '1' || process.env.NEXT_PUBLIC_DEBUG_WS === 'true');

  constructor(store: Store<RootState>, apiKey: string) {
    this.store = store;
    this.apiKey = apiKey;
  }

  connect(symbol: string) {
  if (this.debug) console.log('[FinnhubWS] connect requested for', symbol, 'state=', this.ws?.readyState);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.symbol !== symbol) {
        try {
          if (this.symbol) {
            this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol: this.symbol }));
          }
          this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
          this.symbol = symbol;
      if (this.debug) console.log('[FinnhubWS] re-used socket, switched symbol to', symbol);
        } catch {/* ignore */}
      }
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      if (this.debug) console.log('[FinnhubWS] still CONNECTING, will subscribe to new symbol after open', symbol);
      this.symbol = symbol;
      return;
    }

    const now = Date.now();
    if (now - this.lastConnectTs < 800) {
      // throttle rapid reconnect attempts
      setTimeout(() => this.connect(symbol), 800 - (now - this.lastConnectTs));
      return;
    }
    this.lastConnectTs = now;

  this.cleanup({ reconnecting: true });
    this.explicitlyClosed = false;
    this.symbol = symbol;
    this.store.dispatch(connectRequested());
    try {
      this.ws = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);
      if (this.debug) console.log('[FinnhubWS] opening new socket');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'WebSocket init failed';
      this.store.dispatch(connectError(msg));
      this.failures += 1;
      this.scheduleRetry();
      return;
    }
  this.ws.onopen = () => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      try {
    if (this.symbol) this.ws.send(JSON.stringify({ type: 'subscribe', symbol: this.symbol }));
      } catch {/* ignore */}
      this.store.dispatch(connectSuccess());
      this.failures = 0;
      if (this.debug) console.log('[FinnhubWS] open, subscribed to', symbol);
    };
    this.ws.onmessage = (ev) => {
      try {
        const msg: FinnhubTradeMsg = JSON.parse(ev.data);
        if (msg.type === 'trade' && msg.data && msg.data.length) {
          const ticks = msg.data
      .filter(d => !this.symbol || d.s === this.symbol)
            .map(d => ({ price: d.p, volume: d.v, ts: d.t }));
          if (ticks.length) this.store.dispatch(ticksAdded(ticks));
  } else if (msg.type === 'error') {
          const text = msg.msg?.toLowerCase() || '';
            if (text.includes('rate') || text.includes('limit')) {
              this.store.dispatch(connectError('Rate limited – backing off 60s'));
              this.failures += 1;
              this.scheduleRetry(60000); // hard backoff 60s for rate limit
        if (this.debug) console.warn('[FinnhubWS] rate limited, backing off 60s');
            } else {
              this.store.dispatch(connectError(msg.msg || 'Stream error'));
              this.failures += 1;
              this.scheduleRetry();
        if (this.debug) console.warn('[FinnhubWS] stream error', msg.msg);
            }
        }
      } catch { /* ignore parse errors */ }
    };
    this.ws.onerror = () => {
      this.store.dispatch(connectError('WebSocket error'));
      this.failures += 1;
      this.scheduleRetry();
      if (this.debug) console.warn('[FinnhubWS] onerror, failures=', this.failures);
    };
    this.ws.onclose = () => {
      if (this.explicitlyClosed) return; // manual cleanup, don't auto retry
      this.store.dispatch(connectError('Connection closed'));
      this.failures += 1;
      this.scheduleRetry();
      if (this.debug) console.warn('[FinnhubWS] onclose, scheduling retry, failures=', this.failures);
    };
  }

  private scheduleRetry(forcedDelay?: number) {
    if (this.retryTimer) return;
    const base = forcedDelay != null ? forcedDelay : 3000 * Math.min(5, Math.pow(2, this.failures - 1));
    const delay = Math.min(base, 60000); // cap 60s
    if (this.debug) console.log('[FinnhubWS] scheduling retry in', delay, 'ms');
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (this.symbol) this.connect(this.symbol);
    }, delay);
  }

  cleanup(opts?: { reconnecting?: boolean }) {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.ws) {
      this.explicitlyClosed = !opts?.reconnecting;
      try { this.ws.close(); } catch { /* noop */ }
    }
    this.ws = null;
  }
}

export function createFinnhubClient(store: Store<RootState>) {
  const key = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!key) {
    console.warn('Finnhub API key missing');
  }
  return new FinnhubLiveClient(store, key || '');
}
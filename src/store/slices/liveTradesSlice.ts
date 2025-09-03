import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../rootReducer';

export interface TradeTick {
  id: string;
  price: number;
  volume: number;
  ts: number; // epoch ms
}

interface LiveMvpState {
  status: 'idle' | 'connecting' | 'live' | 'error';
  symbol: string;
  ticks: TradeTick[];
  firstPrice?: number;
  error?: string;
  lastTs?: number;
  retryCount: number;
}

const MAX_TICKS = 100;

const initialState: LiveMvpState = {
  status: 'idle',
  symbol: 'AAPL',
  ticks: [],
  retryCount: 0,
};

const liveTradesSlice = createSlice({
  name: 'liveTrades',
  initialState,
  reducers: {
    setSymbol(state, action: PayloadAction<string>) {
      state.symbol = action.payload.toUpperCase().trim();
      state.ticks = [];
      state.firstPrice = undefined;
      state.error = undefined;
    },
    connectRequested(state) {
      state.status = 'connecting';
      state.error = undefined;
    },
    connectSuccess(state) {
      state.status = 'live';
      state.retryCount = 0;
    },
    connectError(state, action: PayloadAction<string>) {
      state.status = 'error';
      state.error = action.payload;
      state.retryCount += 1;
    },
    ticksAdded(state, action: PayloadAction<Omit<TradeTick, 'id'>[]>) {
      if (!action.payload.length) return;
      const existingKeys = new Set(state.ticks.map(t => t.ts + '-' + t.price + '-' + t.volume));
      let added = 0;
      for (const raw of action.payload) {
        const key = raw.ts + '-' + raw.price + '-' + raw.volume;
        if (existingKeys.has(key)) continue; // skip duplicate
        const tick: TradeTick = { id: key + '-' + (state.lastTs ?? 0) + '-' + added, ...raw };
        if (state.firstPrice == null) state.firstPrice = tick.price;
        state.ticks.unshift(tick);
        existingKeys.add(key);
        added++;
      }
      if (state.ticks.length > MAX_TICKS) state.ticks.length = MAX_TICKS;
      if (action.payload.length) {
        state.lastTs = action.payload[action.payload.length - 1].ts;
      }
    },
    clear(state) {
      state.ticks = [];
      state.firstPrice = undefined;
    },
  }
});

export const {
  setSymbol,
  connectRequested,
  connectSuccess,
  connectError,
  ticksAdded,
  clear
} = liveTradesSlice.actions;

export default liveTradesSlice.reducer;

// Selectors
export const selectLiveTradesState = (s: RootState) => s.liveTrades as LiveMvpState;
export const selectLiveSymbol = (s: RootState) => s.liveTrades.symbol;
export const selectLiveTicks = (s: RootState) => s.liveTrades.ticks;
export const selectLiveStatus = (s: RootState) => s.liveTrades.status;
export const selectLiveError = (s: RootState) => s.liveTrades.error;
export const selectFirstPrice = (s: RootState) => s.liveTrades.firstPrice;
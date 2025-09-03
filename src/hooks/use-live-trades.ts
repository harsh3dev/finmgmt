import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createFinnhubClient, FinnhubLiveClient } from '@/lib/realtime/finnhubLiveClient';
import type { Store } from 'redux';
import type { RootState } from '@/store/rootReducer';
import { selectLiveTicks, selectLiveStatus, selectLiveSymbol, selectFirstPrice, setSymbol, clear, selectLiveError } from '@/store/slices/liveTradesSlice';
import { useStore } from 'react-redux';

export function useLiveTrades() {
  const dispatch = useDispatch();
  const store = useStore() as Store<RootState>;
  const ticks = useSelector(selectLiveTicks);
  const status = useSelector(selectLiveStatus);
  const symbol = useSelector(selectLiveSymbol);
  const firstPrice = useSelector(selectFirstPrice);
  const clientRef = useRef<FinnhubLiveClient | null>(null);
  const error = useSelector(selectLiveError);

  // Compute derived values
  const lastTick = ticks[0];
  const change = firstPrice != null && lastTick ? lastTick.price - firstPrice : undefined;
  const changePct = change != null && firstPrice ? (change / firstPrice) * 100 : undefined;

  // Initiate connection
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = createFinnhubClient(store);
    }
    clientRef.current.connect(symbol);
    return () => {
      clientRef.current?.cleanup();
    };
  }, [symbol, store]);

  const updateSymbol = useCallback((next: string) => {
    dispatch(setSymbol(next));
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch(clear());
  }, [dispatch]);

  const reconnect = useCallback(() => {
    if (clientRef.current) clientRef.current.connect(symbol);
  }, [symbol]);

  return {
    symbol,
    ticks,
    status,
    lastTick,
    change,
    changePct,
    setSymbol: updateSymbol,
    reset,
    reconnect,
    error
  };
}

export type UseLiveTradesReturn = ReturnType<typeof useLiveTrades>;
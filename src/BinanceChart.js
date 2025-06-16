import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { calculateEMA } from './utils/indicators';
import { fetchCandleData } from './hooks/useCandles';

export const BinanceChart = ({ symbol = 'BTCUSDT', interval = '5m' }) => {
  const chartContainerRef = useRef();

  useEffect(() => {
    const initChart = async () => {
      const chart = createChart(chartContainerRef.current, {
        width: 800,
        height: 400,
        layout: { backgroundColor: '#ffffff', textColor: '#000' },
        grid: { vertLines: { color: '#eee' }, horzLines: { color: '#eee' } },
        timeScale: { timeVisible: true, secondsVisible: false },
      });

      const candleSeries = chart.addCandlestickSeries();
      const lineSeries = chart.addLineSeries({ color: 'blue' });

      const candles = await fetchCandleData(symbol, interval, 100);
      if (!candles || candles.length === 0) return;

      const transformed = candles.map((c) => ({
        time: c.time / 1000,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      candleSeries.setData(transformed);

      const closes = candles.map(c => c.close);
      const ema = calculateEMA(closes, 12);
      const emaLine = candles.slice(-ema.length).map((c, i) => ({
        time: c.time / 1000,
        value: ema[i],
      }));

      lineSeries.setData(emaLine);

      return () => chart.remove();
    };

    initChart();
  }, [symbol, interval]);

  return <div ref={chartContainerRef} />;
};

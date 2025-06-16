// src/App.js
import React, { useEffect, useState } from 'react';
import { fetchCandleData, fetchAllSymbols } from './hooks/useCandles';
import { calculateRSI, calculateEMA, calculateMACD } from './utils/indicators';
import { getAdvice } from './utils/advisor';
import { getGPTAnalysis } from './utils/gpt';

function App() {
  const [signals, setSignals] = useState({ buy: [], sell: [], neutral: [] });
  const [loading, setLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [gptResult, setGptResult] = useState("");

  const loadSignals = async () => {
    setLoading(true);
    const allSymbols = await fetchAllSymbols();
    const filteredSymbols = allSymbols.slice(0, 30); // 상위 30개만 분석
    const buy = [];
    const sell = [];
    const neutral = [];

    for (const symbol of filteredSymbols) {
      try {
        const candles = await fetchCandleData(symbol, "15m", 100);
        const closes = candles.map(c => c.close);
        if (closes.length < 30) continue;

        const rsi = calculateRSI(closes).at(-1);
        const { histogram } = calculateMACD(closes);
        const macdHist = histogram.at(-1);
        const ema12 = calculateEMA(closes, 12).at(-1);
        const ema26 = calculateEMA(closes, 26).at(-1);

        const advice = getAdvice({ rsi, macdHist, emaShort: ema12, emaLong: ema26 });

        const entry = { symbol, rsi, macdHist, ema12, ema26 };

        if (advice.recommendation === "매수") buy.push(entry);
        else if (advice.recommendation === "매도") sell.push(entry);
        else neutral.push(entry);
      } catch (err) {
        console.warn(symbol + ' 분석 실패:', err);
        continue;
      }
    }

    setSignals({ buy, sell, neutral });
    setLoading(false);
  };

  const handleSymbolClick = async (entry) => {
    setSelectedSymbol(entry.symbol);
    setGptResult("분석 중...");
    const gptText = await getGPTAnalysis({
      rsi: entry.rsi.toFixed(2),
      macdHist: entry.macdHist.toFixed(4),
      emaShort: entry.ema12.toFixed(2),
      emaLong: entry.ema26.toFixed(2)
    });
    setGptResult(gptText);
  };

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>📊 15분봉 기준 롱/숏 신호 코인</h1>
      <button onClick={loadSignals} disabled={loading}>
        {loading ? "분석 중..." : "🔍 신호 분석하기"}
      </button>

      <div style={{ marginTop: 30, padding: 10, background: "#f2f2f2", borderRadius: 8 }}>
        <p>📦 총 분석 코인 수: {signals.buy.length + signals.sell.length + signals.neutral.length}</p>
        <p>🟢 매수 신호: {signals.buy.length}</p>
        <p>🔴 매도 신호: {signals.sell.length}</p>
        <p>⏸️ 관망 신호: {signals.neutral.length}</p>
      </div>

      <div style={{ marginTop: 30 }}>
        <h2>🟢 매수 신호</h2>
        {signals.buy.length === 0 ? <p>없음</p> : (
          <ul>
            {signals.buy.map((s, idx) => (
              <li key={idx} style={{ cursor: 'pointer', color: '#007bff' }} onClick={() => handleSymbolClick(s)}>{s.symbol}</li>
            ))}
          </ul>
        )}

        <h2>🔴 매도 신호</h2>
        {signals.sell.length === 0 ? <p>없음</p> : (
          <ul>
            {signals.sell.map((s, idx) => (
              <li key={idx} style={{ cursor: 'pointer', color: '#d63333' }} onClick={() => handleSymbolClick(s)}>{s.symbol}</li>
            ))}
          </ul>
        )}

        <h2>⏸️ 관망 신호</h2>
        {signals.neutral.length === 0 ? <p>없음</p> : (
          <ul>
            {signals.neutral.map((s, idx) => (
              <li key={idx} style={{ cursor: 'pointer', color: '#666' }} onClick={() => handleSymbolClick(s)}>{s.symbol}</li>
            ))}
          </ul>
        )}
      </div>

      {selectedSymbol && (
        <div style={{ marginTop: 40, background: '#f9f9f9', padding: 20, borderRadius: 10 }}>
          <h2>🧠 GPT 분석 요약 - {selectedSymbol}</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{gptResult}</p>
        </div>
      )}
    </div>
  );
}

export default App;

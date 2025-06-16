import React, { useState } from 'react';
import { fetchCandleData } from './hooks/useCandles';
import { calculateRSI, calculateEMA, calculateMACD } from './utils/indicators';
import { getAdvice } from './utils/advisor';
import { getGPTAnalysis } from './utils/gpt';
import { BinanceChart } from './BinanceChart'; // 차트 컴포넌트 import

const TIMEFRAMES = [
  { label: "1분봉", value: "1m" },
  { label: "5분봉", value: "5m" },
  { label: "15분봉", value: "15m" },
  { label: "30분봉", value: "30m" },
  { label: "4시간봉", value: "4h" },
  { label: "1일봉", value: "1d" },
];

function App() {
  const [selectedFrame, setSelectedFrame] = useState("5m");
  const [results, setResults] = useState({});

  const loadIndicators = async () => {
    const closes = await fetchCandleData("BTCUSDT", selectedFrame, 100);
    if (!closes || closes.length < 30) return;

    const rsiValues = calculateRSI(closes);
    const { histogram } = calculateMACD(closes);
    const emaShort = calculateEMA(closes, 12);
    const emaLong = calculateEMA(closes, 26);

    const latestRSI = rsiValues.at(-1);
    const latestMACD = histogram.at(-1);
    const latestEMA12 = emaShort.at(-1);
    const latestEMA26 = emaLong.at(-1);

    if (
      latestRSI === undefined ||
      latestMACD === undefined ||
      latestEMA12 === undefined ||
      latestEMA26 === undefined
    ) return;

    const advice = getAdvice({
      rsi: latestRSI,
      macdHist: latestMACD,
      emaShort: latestEMA12,
      emaLong: latestEMA26,
    });

    const gptText = await getGPTAnalysis({
      rsi: latestRSI.toFixed(2),
      macdHist: latestMACD.toFixed(4),
      emaShort: latestEMA12.toFixed(2),
      emaLong: latestEMA26.toFixed(2),
    });

    setResults({
      [selectedFrame]: {
        rsi: latestRSI.toFixed(2),
        macdHist: latestMACD.toFixed(4),
        ema12: latestEMA12.toFixed(2),
        ema26: latestEMA26.toFixed(2),
        advice,
        gptText,
      },
    });
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>🤖 AI 트레이딩 분석</h1>

      <h2>🕒 시간 프레임 선택</h2>
      {TIMEFRAMES.map((tf) => (
        <label key={tf.value} style={{ marginRight: "12px" }}>
          <input
            type="radio"
            name="timeframe"
            checked={selectedFrame === tf.value}
            onChange={() => setSelectedFrame(tf.value)}
          /> {tf.label}
        </label>
      ))}

      <div style={{ marginTop: 20 }}>
        <button onClick={loadIndicators}>📊 분석 시작</button>
      </div>

      <div style={{ marginTop: "40px" }}>
        <BinanceChart symbol="BTCUSDT" interval={selectedFrame} />
      </div>

      {Object.entries(results).map(([frame, res]) => (
        <div key={frame} style={{ marginTop: "40px" }}>
          <h2>📈 {TIMEFRAMES.find(f => f.value === frame)?.label} 결과</h2>
          <p>RSI: {res.rsi}</p>
          <p>MACD 히스토그램: {res.macdHist}</p>
          <p>EMA(12): {res.ema12}</p>
          <p>EMA(26): {res.ema26}</p>

          <div style={{ marginTop: "20px", padding: "16px", border: "1px solid #ccc", borderRadius: "10px" }}>
            <h3>💡 AI 판단</h3>
            <p><strong>추천:</strong> {res.advice.recommendation}</p>
            <ul>
              {res.advice.reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: "20px", background: "#f9f9f9", padding: "16px", borderRadius: "10px" }}>
            <h3>🧠 GPT 분석 요약</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{res.gptText}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;

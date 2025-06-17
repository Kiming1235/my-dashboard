// src/App.js
import React, { useState } from 'react';
import { fetchCandleData, fetchAllSymbols } from './hooks/useCandles';
import { calculateRSI, calculateEMA, calculateMACD } from './utils/indicators';
import { getAdvice } from './utils/advisor';
import { getGPTAnalysis } from './utils/gpt';

// 거래 모드별 시간 프레임 옵션
const TIMEFRAME_OPTIONS = {
  short: ["1m", "5m", "15m", "30m"],
  long: ["1h", "4h", "1d"]
};

function App() {
  const [mode, setMode] = useState('short');                // 단기/장기 모드
  const [frame, setFrame] = useState('5m');                  // 선택된 시간 프레임
  const [signals, setSignals] = useState({ buy: [], sell: [], hold: [] });
  const [gptSummaries, setGptSummaries] = useState({});
  const [loading, setLoading] = useState(false);

  const loadSignals = async () => {
    setLoading(true);
    const allSymbols = await fetchAllSymbols();
    const filteredSymbols = allSymbols.slice(0,10); // 상위 10개만 분석
    const buy = [], sell = [], hold = [];
    const summaries = {};

    for (const symbol of filteredSymbols) {
      try {
        const candles = await fetchCandleData(symbol, frame, 100);
        const closes = candles.map(c => c.close);
        if (closes.length < 30) continue;

        const rsi = calculateRSI(closes).at(-1);
        const { histogram } = calculateMACD(closes);
        const macdHist = histogram.at(-1);
        const ema12 = calculateEMA(closes, 12).at(-1);
        const ema26 = calculateEMA(closes, 26).at(-1);

        const advice = getAdvice({ rsi, macdHist, emaShort: ema12, emaLong: ema26 });
        const gpt = await getGPTAnalysis({
          rsi: rsi.toFixed(2),
          macdHist: macdHist.toFixed(4),
          emaShort: ema12.toFixed(2),
          emaLong: ema26.toFixed(2)
        });

        summaries[symbol] = gpt;
        if (advice.recommendation === '매수') buy.push(symbol);
        else if (advice.recommendation === '매도') sell.push(symbol);
        else hold.push(symbol);
      } catch (e) {
        console.warn(symbol, '분석 실패', e);
      }
    }

    setSignals({ buy, sell, hold });
    setGptSummaries(summaries);
    setLoading(false);
  };

  return (
    <div style={{ padding: 40, fontFamily: 'Arial' }}>
      <h1>📊 AI 트레이딩 신호 스캐너</h1>
      {/* 모드 선택 */}
      <div>
        <label style={{ marginRight: 12 }}>
          <input type="radio" checked={mode==='short'} onChange={()=>{ setMode('short'); setFrame('5m'); }} /> 단기 매매
        </label>
        <label>
          <input type="radio" checked={mode==='long'} onChange={()=>{ setMode('long'); setFrame('1h'); }} /> 장기 매매
        </label>
      </div>
      {/* 프레임 선택 */}
      <div style={{ marginTop: 12 }}>
        {TIMEFRAME_OPTIONS[mode].map(tf => (
          <label key={tf} style={{ marginRight: 12 }}>
            <input
              type="radio"
              name="timeframe"
              checked={frame===tf}
              onChange={()=>setFrame(tf)}
            /> {tf}
          </label>
        ))}
      </div>
      {/* 분석 버튼 */}
      <div style={{ marginTop: 20 }}>
        <button onClick={loadSignals} disabled={loading}>
          {loading ? '분석 중...' : `🔍 ${frame} 신호 분석`}
        </button>
      </div>

      {/* 통계 요약 */}
      <div style={{ marginTop: 30, background: '#f2f2f2', padding: 10, borderRadius: 8 }}>
        <p>총 분석 종목: {signals.buy.length + signals.sell.length + signals.hold.length}</p>
        <p>🟢 매수: {signals.buy.length}</p>
        <p>🔴 매도: {signals.sell.length}</p>
        <p>⏸️ 관망: {signals.hold.length}</p>
      </div>

      {/* 신호 리스트 및 GPT 요약 */}
      {['매수','매도','관망'].map((type, idx) => {
        const list = type==='매수'?signals.buy: type==='매도'?signals.sell: signals.hold;
        const icon = type==='매수'?'📈': type==='매도'?'📉':'⏸️';
        const color = type==='매수'?'green': type==='매도'?'red':'gray';
        return (
          <div key={idx} style={{ marginTop: 30 }}>
            <h2 style={{ color }}>{icon} {type} 신호</h2>
            {list.length===0? <p>없음</p> : (
              <ul>
                {list.map(s => (
                  <li key={s} style={{ cursor:'pointer', color }} onClick={()=>alert(summaries[s]||'')}>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default App;

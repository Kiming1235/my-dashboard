// src/App.js
import React, { useState } from 'react';
import { fetchCandleData, fetchAllSymbols } from './hooks/useCandles';
import { calculateRSI, calculateEMA, calculateMACD } from './utils/indicators';
import { getAdvice } from './utils/advisor';
import { getGPTAnalysis } from './utils/gpt';

// 거래 모드별 시간프레임 옵션
const TIMEFRAME_OPTIONS = {
  short: ["1m", "5m", "15m", "30m"],
  long:  ["1h", "4h", "1d"]
};

function App() {
  const [mode, setMode] = useState('short');
  const [frame, setFrame] = useState('5m');
  const [signals, setSignals] = useState({ long: [], short: [], hold: [] });
  const [metrics, setMetrics] = useState({});             // 보조지표 저장
  const [gptSummaries, setGptSummaries] = useState({});     // GPT 결과 캐시
  const [loading, setLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);

  const loadSignals = async () => {
    setLoading(true);
    const all = await fetchAllSymbols();
    const top10 = all.slice(0, 10);
    const longs = [];
    const shorts = [];
    const hold = [];
    const newMetrics = {};

    for (const sym of top10) {
      try {
        const candles = await fetchCandleData(sym, frame, 100);
        const closes = candles.map(c => c.close);
        if (closes.length < 30) continue;

        const rsi = calculateRSI(closes).at(-1);
        const { histogram } = calculateMACD(closes);
        const macdHist = histogram.at(-1);
        const ema12 = calculateEMA(closes, 12).at(-1);
        const ema26 = calculateEMA(closes, 26).at(-1);

        newMetrics[sym] = { rsi, macdHist, emaShort: ema12, emaLong: ema26 };
        // GPT에게 판단 분류를 맡깁니다
const gptText = await getGPTAnalysis({
  rsi: newMetrics[sym].rsi.toFixed(2),
  macdHist: newMetrics[sym].macdHist.toFixed(4),
  emaShort: newMetrics[sym].emaShort.toFixed(2),
  emaLong: newMetrics[sym].emaLong.toFixed(2)
});
summaries[sym] = gptText;

// '판단: 롱/숏/관망' 파싱
const match = gptText.match(/판단:\s*(롱|숏|관망)/);
const decision = match ? match[1] : '관망';

if (decision === '롱') longs.push(sym);
else if (decision === '숏') shorts.push(sym);
else hold.push(sym);

      } catch (e) {
        console.warn(sym, '분석 실패', e);
      }
    }

    setMetrics(newMetrics);
    setSignals({ long: longs, short: shorts, hold });
    setLoading(false);
  };

  const handleClick = async (sym) => {
    setSelectedSymbol(sym);
    if (!gptSummaries[sym]) {
      const data = metrics[sym];
      setGptSummaries(prev => ({ ...prev, [sym]: '분석 중...' }));
      const text = await getGPTAnalysis({
        rsi: data.rsi.toFixed(2),
        macdHist: data.macdHist.toFixed(4),
        emaShort: data.emaShort.toFixed(2),
        emaLong: data.emaLong.toFixed(2)
      });
      setGptSummaries(prev => ({ ...prev, [sym]: text }));
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: 'Arial', textAlign: 'center' }}>
      <h1>📊 AI 트레이딩 신호 스캐너</h1>

      {/* 모드 선택 */}
      <div>
        <label style={{ margin: '0 12px' }}>
          <input type="radio" checked={mode==='short'} onChange={() => { setMode('short'); setFrame('5m'); }} /> 단기 매매
        </label>
        <label style={{ margin: '0 12px' }}>
          <input type="radio" checked={mode==='long'} onChange={() => { setMode('long'); setFrame('1h'); }} /> 장기 매매
        </label>
      </div>

      {/* 프레임 선택 */}
      <div style={{ marginTop: 12 }}>
        {TIMEFRAME_OPTIONS[mode].map(tf => (
          <label key={tf} style={{ margin: '0 8px' }}>
            <input type="radio" checked={frame===tf} onChange={() => setFrame(tf)} /> {tf}
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
      <div style={{ marginTop: 30, background: '#f2f2f2', padding: 10, borderRadius: 8, display: 'inline-block' }}>
        <p>총 분석 종목: {signals.long.length + signals.short.length + signals.hold.length}</p>
        <p style={{ color: 'green' }}>🟢 롱: {signals.long.length}</p>
        <p style={{ color: 'red' }}>🔴 숏: {signals.short.length}</p>
        <p style={{ color: 'gray' }}>⏸️ 관망: {signals.hold.length}</p>
      </div>

      {/* 신호 리스트 */}
      {['롱','숏','관망'].map((type,idx) => {
        const list = type==='롱' ? signals.long : type==='숏' ? signals.short : signals.hold;
        const icon = type==='롱' ? '📈' : type==='숏' ? '📉' : '⏸️';
        const color = type==='롱' ? 'green' : type==='숏' ? 'red' : 'gray';
        return (
          <div key={idx} style={{ marginTop: 30 }}>
            <h2 style={{ color }}>{icon} {type} 신호</h2>
            {list.length===0 ? <p>없음</p> : (
              <ul style={{ listStyle:'none', padding:0 }}>
                {list.map(s => (
                  <li key={s} style={{ cursor:'pointer', color, margin:'8px 0' }} onClick={() => handleClick(s)}>
                    {s}
                    {selectedSymbol===s && gptSummaries[s] && (
                      <div style={{ margin:'8px auto', padding:16, background:'#222', borderRadius:8, maxWidth:800, textAlign:'left', wordBreak:'break-word' }}>
                        <pre style={{ whiteSpace:'pre-wrap', color:'#fff' }}>{gptSummaries[s]}</pre>
                      </div>
                    )}
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

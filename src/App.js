// src/App.js
import React, { useState } from 'react';
import { fetchCandleData, fetchAllSymbols } from './hooks/useCandles';
import { calculateRSI, calculateEMA, calculateMACD } from './utils/indicators';
import { getGPTAnalysis } from './utils/gpt';

// 거래 모드별 시간프레임 옵션
const TIMEFRAME_OPTIONS = {
  short: ['1m', '5m', '15m', '30m'],
  long:  ['1h', '4h', '1d']
};

// 타임프레임별 추세 길이 설정
const TREND_LENGTHS = {
  '1m': 3, '5m': 3,
  '15m': 5, '30m': 5,
  '1h': 7, '4h': 7,
  '1d': 10
};

function App() {
  const [mode, setMode] = useState('short');
  const [frame, setFrame] = useState('5m');
  const [signals, setSignals] = useState({ long: [], short: [], hold: [] });
  const [metrics, setMetrics] = useState({});
  const [gptSummaries, setGptSummaries] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);

  const loadSignals = async () => {
    setLoading(true);
    const allSymbols = await fetchAllSymbols();
    const topSymbols = allSymbols.slice(0, 10);
    const longs = [], shorts = [], hold = [];
    const newMetrics = {};
    const summaries = {};
    const len = TREND_LENGTHS[frame] || 5;

    for (const sym of topSymbols) {
      try {
        const candles = await fetchCandleData(sym, frame, 100);
        const closes = candles.map(c => c.close);
        if (closes.length < len + 1) continue;

        // 지표 계산
        const rsiArr = calculateRSI(closes);
        const recentRsi = rsiArr.slice(-len);
        const { histogram } = calculateMACD(closes);
        const recentMacd = histogram.slice(-len);
        const ema12 = calculateEMA(closes, 12).at(-1);
        const ema26 = calculateEMA(closes, 26).at(-1);

        newMetrics[sym] = { recentRsi, recentMacd, emaShort: ema12, emaLong: ema26 };

        // GPT 분석 호출
        const gptText = await getGPTAnalysis(sym, {
          recentRsi: recentRsi.join(', '),
          recentMacd: recentMacd.join(', '),
          emaShort: ema12.toFixed(2),
          emaLong: ema26.toFixed(2),
          timeframe: frame
        });
        summaries[sym] = gptText;

        // '판단: 롱/숏/관망' 파싱
        const match = gptText.match(/판단:\s*(롱|숏|관망)/);
        const decision = match ? match[1] : '관망';
        if (decision === '롱') longs.push(sym);
        else if (decision === '숏') shorts.push(sym);
        else hold.push(sym);
      } catch (e) {
        console.warn(`${sym} 분석 실패:`, e);
      }
    }

    setMetrics(newMetrics);
    setSignals({ long: longs, short: shorts, hold });
    setGptSummaries(summaries);
    setLoading(false);
  };

  const handleClick = async (sym) => {
    setSelectedSymbol(sym);
    // 이미 호출된 요약이 없으면 호출
    if (!gptSummaries[sym] && metrics[sym]) {
      const { recentRsi, recentMacd, emaShort, emaLong } = metrics[sym];
      setGptSummaries(prev => ({ ...prev, [sym]: '분석 중...' }));
      const text = await getGPTAnalysis(sym, {
        recentRsi: recentRsi.join(', '),
        recentMacd: recentMacd.join(', '),
        emaShort: emaShort.toFixed(2),
        emaLong: emaLong.toFixed(2),
        timeframe: frame
      });
      setGptSummaries(prev => ({ ...prev, [sym]: text }));
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: 'Arial', textAlign: 'center' }}>
      <h1>📊 AI 트레이딩 신호 스캐너</h1>

      {/* 모드 및 프레임 선택 */}
      <div>
        {['short','long'].map(m => (
          <label key={m} style={{ margin: '0 12px' }}>
            <input
              type="radio"
              checked={mode === m}
              onChange={() => { setMode(m); setFrame(m === 'short' ? '5m' : '1h'); }}
            /> {m === 'short' ? '단기 매매' : '장기 매매'}
          </label>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        {TIMEFRAME_OPTIONS[mode].map(tf => (
          <label key={tf} style={{ margin: '0 8px' }}>
            <input
              type="radio"
              checked={frame === tf}
              onChange={() => setFrame(tf)}
            /> {tf}
          </label>
        ))}
      </div>

      {/* 분석 실행 */}
      <button onClick={loadSignals} disabled={loading} style={{ marginTop: 20 }}>
        {loading ? '분석 중...' : `🔍 ${frame} 신호 로드`}
      </button>

      {/* 분석 결과 */}
      <div style={{ marginTop: 30, display: 'inline-block', background: '#f2f2f2', padding: 10, borderRadius: 8 }}>
        <p>총 분석 종목: {signals.long.length + signals.short.length + signals.hold.length}</p>
        <p style={{ color: 'green' }}>🟢 롱: {signals.long.length}</p>
        <p style={{ color: 'red' }}>🔴 숏: {signals.short.length}</p>
        <p style={{ color: 'gray' }}>⏸️ 관망: {signals.hold.length}</p>
      </div>

      {/* 신호 리스트 */}
      {['롱','숏','관망'].map((label, idx) => {
        const arr = label === '롱' ? signals.long : label === '숏' ? signals.short : signals.hold;
        const icon = label === '롱' ? '📈' : label === '숏' ? '📉' : '⏸️';
        const color = label === '롱' ? 'green' : label === '숏' ? 'red' : 'gray';
        return (
          <div key={idx} style={{ marginTop: 30 }}>
            <h2 style={{ color }}>{icon} {label} 신호</h2>
            {arr.length === 0
              ? <p>없음</p>
              : <ul style={{ listStyle: 'none', padding: 0 }}>
                  {arr.map(sym => (
                    <li
                      key={sym}
                      style={{ cursor: 'pointer', color, margin: '8px 0' }}
                      onClick={() => handleClick(sym)}
                    >
                      {sym}
                      {selectedSymbol === sym && gptSummaries[sym] && (
                        <div style={{ margin: '8px auto', padding: 16, background: '#222', borderRadius: 8, maxWidth: 800, textAlign: 'left', wordBreak: 'break-word' }}>
                          <pre style={{ whiteSpace: 'pre-wrap', color: '#fff' }}>{gptSummaries[sym]}</pre>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
            }
          </div>
        );
      })}
    </div>
  );
}

export default App;

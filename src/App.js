// src/App.js
import React, { useState } from 'react';
import { fetchCandleData, fetchAllSymbols } from './hooks/useCandles';
import { calculateRSI, calculateEMA, calculateMACD } from './utils/indicators';
import { getGPTAnalysis } from './utils/gpt';

// 모드별 & 프레임별 설정
const TIMEFRAME_OPTIONS = {
  short: ['1m', '5m', '15m', '30m'],
  long:  ['1h', '4h', '1d', '1w', '1M']
};

// 타임프레임별 추세 길이 설정
const TREND_LENGTHS = {
  '1m': 3,  '5m': 3,
  '15m': 5, '30m': 5,
  '1h': 7,  '4h': 7,
  '1d': 10, '1w': 10,
  '1M': 10
};

export default function App() {
  const [mode, setMode] = useState('short');
  const [frame, setFrame] = useState('5m');
  const [signals, setSignals] = useState({ long: [], short: [], hold: [] });
  const [gptSummaries, setGptSummaries] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);

  const loadSignals = async () => {
    setLoading(true);
    const allSymbols = await fetchAllSymbols();
    const top10 = allSymbols.slice(0, 10);
    const longs = [], shorts = [], hold = [];
    const len = TREND_LENGTHS[frame] || 5;
    const summaries = {};

    for (const sym of top10) {
      try {
        const candles = await fetchCandleData(sym, frame, 100);
        const closes = candles.map(c => c.close);
        if (closes.length < len + 1) continue;

        const rsiArr = calculateRSI(closes);
        const recentRsi = rsiArr.slice(-len);
        const { histogram } = calculateMACD(closes);
        const recentMacd = histogram.slice(-len);
        const ema12 = calculateEMA(closes, 12).at(-1);
        const ema26 = calculateEMA(closes, 26).at(-1);

        const gptText = await getGPTAnalysis(sym, {
          recentRsi: recentRsi.join(', '),
          recentMacd: recentMacd.join(', '),
          emaShort: ema12.toFixed(2),
          emaLong: ema26.toFixed(2),
          timeframe: frame
        });
        summaries[sym] = gptText;

        const m = gptText.match(/판단:\s*(롱|숏|관망)/);
        const d = m ? m[1] : '관망';
        if (d === '롱') longs.push(sym);
        else if (d === '숏') shorts.push(sym);
        else hold.push(sym);
      } catch (e) {
        console.warn(sym, '분석 실패', e);
      }
    }

    setSignals({ long: longs, short: shorts, hold });
    setGptSummaries(summaries);
    setLoading(false);
  };

  return (
    <div style={{ padding: 40, fontFamily: 'Arial', textAlign: 'center' }}>
      <h1>📊 AI 트레이딩 신호 스캐너</h1>

      {/* 모드 선택 */}
      <div>
        <label style={{ margin: '0 12px' }}>
          <input
            type="radio"
            checked={mode === 'short'}
            onChange={() => { setMode('short'); setFrame('5m'); }}
          /> 단기 매매
        </label>
        <label style={{ margin: '0 12px' }}>
          <input
            type="radio"
            checked={mode === 'long'}
            onChange={() => { setMode('long'); setFrame('1h'); }}
          /> 장기 매매
        </label>
      </div>

      {/* 프레임 선택 */}
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

      {/* 신호 로드 버튼 */}
      <div style={{ marginTop: 20 }}>
        <button onClick={loadSignals} disabled={loading}>
          {loading ? '분석 중...' : `🔍 ${frame} 신호 로드`}
        </button>
      </div>

      {/* 통계 요약 */}
      <div style={{
        marginTop: 30,
        background: '#f2f2f2',
        padding: 10,
        borderRadius: 8,
        display: 'inline-block'
      }}>
        <p>총 분석 종목: {signals.long.length + signals.short.length + signals.hold.length}</p>
        <p style={{ color: 'green' }}>🟢 롱: {signals.long.length}</p>
        <p style={{ color: 'red' }}>🔴 숏: {signals.short.length}</p>
        <p style={{ color: 'gray' }}>⏸️ 관망: {signals.hold.length}</p>
      </div>

      {/* 신호 리스트 */}
      {['롱', '숏', '관망'].map((type, idx) => {
        const list = type === '롱' ? signals.long : type === '숏' ? signals.short : signals.hold;
        const icon = type === '롱' ? '📈' : type === '숏' ? '📉' : '⏸️';
        const color = type === '롱' ? 'green' : type === '숏' ? 'red' : 'gray';

        return (
          <div key={idx} style={{ marginTop: 30 }}>
            <h2 style={{ color }}>{icon} {type} 신호</h2>
            {list.length === 0 ? <p>없음</p> : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {list.map(sym => (
                  <li
                    key={sym}
                    style={{ cursor: 'pointer', color, margin: '8px 0' }}
                    onClick={() => setSelectedSymbol(sym)}
                  >
                    {sym}
                    {selectedSymbol === sym && gptSummaries[sym] && (
                      <div style={{
                        margin: '8px auto',
                        padding: 16,
                        background: '#222',
                        borderRadius: 8,
                        maxWidth: 800,
                        textAlign: 'left',
                        wordBreak: 'break-word'
                      }}>
                        <pre style={{ whiteSpace: 'pre-wrap', color: '#fff' }}>
                          {gptSummaries[sym]}
                        </pre>
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

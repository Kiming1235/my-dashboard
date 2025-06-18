// src/App.js
import React, { useState } from 'react';
import { fetchCandleData, fetchAllSymbols } from './hooks/useCandles';
import { calculateRSI, calculateEMA, calculateMACD } from './utils/indicators';
import { getGPTAnalysis } from './utils/gpt';

// 거래 모드별 시간프레임 옵션
const TIMEFRAME_OPTIONS = {
  short: ['1m','5m','15m','30m'],
  long:  ['1h','4h','1d']
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

  // 캔들+지표 로드 (상위 10개 심볼)
  const loadSignals = async () => {
    setLoading(true);
    const allSymbols = await fetchAllSymbols();
    const topSymbols = allSymbols.slice(0, 10);
    const newMetrics = {};

    const len = TREND_LENGTHS[frame] || 5;
    for (const sym of topSymbols) {
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

        newMetrics[sym] = { recentRsi, recentMacd, emaShort: ema12, emaLong: ema26 };
      } catch (err) {
        console.warn(sym, '지표 계산 실패:', err);
      }
    }

    setMetrics(newMetrics);
    setSignals({ long: [], short: [], hold: [] });
    setLoading(false);
  };

  // 심볼 클릭 시 GPT 분석 호출 및 신호 분류 업데이트
  const handleClick = async (sym) => {
    setSelectedSymbol(sym);
    const m = metrics[sym];
    if (!m) return;
    if (!gptSummaries[sym]) {
      setGptSummaries(prev => ({ ...prev, [sym]: '분석 중...' }));
      const { recentRsi, recentMacd, emaShort, emaLong } = m;
      const text = await getGPTAnalysis(sym, {
        recentRsi: recentRsi.join(', '),
        recentMacd: recentMacd.join(', '),
        emaShort: emaShort.toFixed(2),
        emaLong: emaLong.toFixed(2),
        timeframe: frame
      });
      setGptSummaries(prev => ({ ...prev, [sym]: text }));

      const match = text.match(/판단:\s*(롱|숏|관망)/);
      const decision = match ? match[1] : '관망';
      setSignals(prev => {
        const { long, short, hold } = prev;
        // remove sym from all
        const clean = {
          long: long.filter(s=>s!==sym),
          short: short.filter(s=>s!==sym),
          hold: hold.filter(s=>s!==sym)
        };
        if (decision === '롱') clean.long.push(sym);
        else if (decision === '숏') clean.short.push(sym);
        else clean.hold.push(sym);
        return clean;
      });
    }
  };

  return (
    <div style={{ padding:40, fontFamily:'Arial', textAlign:'center' }}>
      <h1>📊 AI 트레이딩 신호 스캐너</h1>

      {/* 모드/프레임 선택 */}
      <div>
        {['short','long'].map(m=> (
          <label key={m} style={{ margin:'0 12px' }}>
            <input
              type='radio'
              checked={mode===m}
              onChange={()=>{setMode(m); setFrame(m==='short'?'5m':'1h');}}
            /> {m==='short'?'단기':'장기'}
          </label>
        ))}
      </div>
      <div style={{ marginTop:12 }}>
        {TIMEFRAME_OPTIONS[mode].map(tf=>(
          <label key={tf} style={{ margin:'0 8px' }}>
            <input
              type='radio'
              checked={frame===tf}
              onChange={()=>setFrame(tf)}
            /> {tf}
          </label>
        ))}
      </div>

      {/* 캔들+지표 로드 */}
      <button onClick={loadSignals} disabled={loading} style={{ marginTop:20 }}>
        {loading?'로딩...':'지표 로드'}
      </button>

      {/* 신호 리스트 */}
      {['롱','숏','관망'].map((type,idx)=>(
        <div key={idx} style={{ marginTop:30 }}>
          <h2>{type} 신호</h2>
          <ul style={{ listStyle:'none', padding:0 }}>
            {signals[type.toLowerCase()].length===0 && <li>없음</li>}
            {signals[type.toLowerCase()].map(sym=>(
              <li key={sym} style={{ cursor:'pointer', margin:'8px 0' }} onClick={()=>handleClick(sym)}>
                {sym}
                {selectedSymbol===sym && <pre style={{ textAlign:'left', margin:'8px auto', padding:16, background:'#222', color:'#fff', maxWidth:800 }}>{gptSummaries[sym]}</pre>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default App;

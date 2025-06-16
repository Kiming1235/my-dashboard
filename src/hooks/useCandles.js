// src/hooks/useCandles.js

// 개별 코인의 캔들 데이터 불러오기
export const fetchCandleData = async (symbol, interval = "15m", limit = 100) => {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const data = await res.json();

    return data.map(c => ({
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
      time: c[0],
    }));
  } catch (error) {
    console.error(`캔들 데이터 불러오기 실패: ${symbol}`, error);
    return [];
  }
};

// 전체 심볼 목록 불러오기 (USDT 마켓만)
export const fetchAllSymbols = async () => {
  try {
    const res = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    const data = await res.json();

    const symbols = data.symbols
      .filter(s => s.quoteAsset === "USDT" && s.status === "TRADING")
      .map(s => s.symbol);

    return symbols;
  } catch (error) {
    console.error("심볼 목록 불러오기 실패:", error);
    return [];
  }
};

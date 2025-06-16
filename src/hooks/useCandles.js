export async function fetchCandleData(symbol = "BTCUSDT", interval = "5m", limit = 100) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.map(candle => parseFloat(candle[4])); // 종가만 추출
  } catch (error) {
    console.error("캔들 데이터를 불러오지 못했습니다:", error);
    return [];
  }
}

// src/utils/advisor.js

export function getAdvice({ rsi, macdHist, emaShort, emaLong }) {
  let recommendation = "관망";
  let reasons = [];

  if (rsi < 30) reasons.push("📉 RSI가 30 이하로 과매도 상태입니다.");
  if (macdHist > 0) reasons.push("📈 MACD가 골든크로스(상승 전환) 상태입니다.");
  if (emaShort > emaLong) reasons.push("📊 단기 EMA가 장기 EMA를 상향 돌파했습니다.");

  if (reasons.length >= 2) {
    recommendation = "롱";
  } else if (rsi > 70 && macdHist < 0) {
    recommendation = "숏";
    reasons = [
      "📉 RSI가 70 이상으로 과매수 상태입니다.",
      "📉 MACD가 데드크로스(하락 전환) 상태입니다.",
    ];
  }

  return {
    recommendation,
    reasons,
  };
}

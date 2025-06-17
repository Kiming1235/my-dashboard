// src/utils/advisor.js

/**
 * 보조지표에 기반한 롱, 숏, 관망 추천 함수
 * 
 * @param {{ rsi: number, macdHist: number, emaShort: number, emaLong: number }} params
 * @returns {{ recommendation: string, reasons: string[] }}
 */
export function getAdvice({ rsi, macdHist, emaShort, emaLong }) {
  const reasons = [];

  // RSI 평가
  if (rsi < 30) reasons.push("RSI가 30 이하로 과매도 구간에 있습니다.");
  else if (rsi > 70) reasons.push("RSI가 70 이상으로 과매수 구간에 있습니다.");
  else reasons.push(`RSI가 ${rsi.toFixed(2)}로 중립 구간에 있습니다.`);

  // EMA 추세 평가
  if (emaShort > emaLong) reasons.push("단기 EMA가 장기 EMA보다 높아 상승 추세입니다.");
  else if (emaShort < emaLong) reasons.push("단기 EMA가 장기 EMA보다 낮아 하락 추세입니다.");
  else reasons.push("EMA 단기와 장기가 동일하여 횡보 상태입니다.");

  // MACD 히스토그램 모멘텀 평가
  if (macdHist > 0) reasons.push("MACD 히스토그램이 양수로 상승 모멘텀을 보입니다.");
  else if (macdHist < 0) reasons.push("MACD 히스토그램이 음수로 하락 모멘텀을 보입니다.");
  else reasons.push("MACD 히스토그램이 0으로 모멘텀이 없습니다.");

  // 기본 추천은 관망
  let recommendation = "관망";

  // 롱(매수) 조건: 과매도 + 모멘텀 전환 + 상승추세
  if (rsi < 30 && macdHist > 0 && emaShort > emaLong) {
    recommendation = "롱";
  }
  // 숏(매도) 조건: 하락 모멘텀 + 하락추세
  else if (macdHist < 0 && emaShort < emaLong) {
    recommendation = "숏";
  }

  return { recommendation, reasons };
}

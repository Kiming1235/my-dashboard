// src/utils/gpt.js

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY; // .env에 REACT_APP_OPENAI_API_KEY 설정 필요

/**
 * GPT 분석 요청 함수
 * @param {string} symbol - 코인 심볼 (예: BTCUSDT)
 * @param {{ recentRsi: string|number[], recentMacd: string|number[], emaShort: string, emaLong: string, timeframe: string }} params
 * @returns {Promise<string>} GPT 응답 텍스트
 */
export async function getGPTAnalysis(symbol, { recentRsi, recentMacd, emaShort, emaLong, timeframe }) {
  // recentRsi/recentMacd가 배열 또는 문자열일 수 있으므로 안전하게 처리
  const rsiList = Array.isArray(recentRsi)
    ? recentRsi
    : recentRsi
      ? recentRsi.split(/\s*,\s*/)
      : [];
  const macdList = Array.isArray(recentMacd)
    ? recentMacd
    : recentMacd
      ? recentMacd.split(/\s*,\s*/)
      : [];
  const count = rsiList.length;
  const rsiText = rsiList.join(', ');
  const macdText = macdList.join(', ');

  const prompt = `
아래는 ${symbol}의 ${timeframe}봉 기준 최근 ${count}개 구간 기술 지표 흐름입니다:

- RSI(최근 ${count}개): ${rsiText}
- MACD 히스토그램(최근 ${count}개): ${macdText}
- EMA(12) 최신값: ${emaShort}
- EMA(26) 최신값: ${emaLong}

위 지표들을 참고하여:
당신은 숙련된 암호화폐 트레이딩 분석가입니다.

위의 RSI, MACD, EMA 지표 요약을 및 과거 지표를 활용을 하여 현재 시점의 시장 상황을 분석하세요.

요구 사항:
- 투자자가 이해하기 쉬운 자연스러운 말투 사용
- 전문 용어는 간단히 풀어 설명
- 숫자 값에 근거한 해석을 포함할 것
- 강한 의견이 아닌 '경향' 중심의 표현
- 길이는 3~5문장
- 제목, 번호, 마크다운 사용 금지
- 너무 신중하고 보수적이지 말것
- 과거지표를 활용할것
- 마지막 문장은 반드시 다음 형식으로 끝낼 것: 판단: 롱 / 숏  , 관망은 최소한으로
`.trim();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '당신은 전문 암호화폐 트레이딩 분석가입니다.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 350,
    }),
  });

  const data = await response.json();
  if (data?.choices?.[0]?.message?.content) {
    return data.choices[0].message.content.trim();
  }

  console.error('GPT 응답 형식 오류:', data);
  return 'GPT 분석 실패';
}

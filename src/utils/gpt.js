// src/utils/gpt.js
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

export async function getGPTAnalysis(symbol, { recentRsi, recentMacd, emaShort, emaLong, timeframe }) {
  // 안전하게 문자열로 변환
  const rsiStr  = Array.isArray(recentRsi)   ? recentRsi.join(', ')   : (recentRsi ?? '');
  const macdStr = Array.isArray(recentMacd)  ? recentMacd.join(', ')  : (recentMacd  ?? '');

  const prompt = `
아래는 ${symbol}의 ${timeframe}봉 기준 최근 기술 지표 흐름입니다:

- RSI (최근 ${rsiStr.split(', ').length}개): ${rsiStr}
- MACD 히스토그램 (최근 ${macdStr.split(', ').length}개): ${macdStr}
- EMA(12) 최신값: ${emaShort}
- EMA(26) 최신값: ${emaLong}

당신은 숙련된 암호화폐 트레이딩 분석가입니다.

위의 RSI, MACD, EMA 지표 요약 및 과거 지표를 활용하여 현재 시점의 시장 상황을 분석하세요.

요구 사항:
- 투자자가 이해하기 쉬운 자연스러운 말투 사용
- 전문 용어는 간단히 풀어 설명
- 숫자 값에 근거한 해석을 포함할 것
- 강한 의견이 아닌 '경향' 중심의 표현
- 문장 길이는 3~5줄, 핵심 설명 후 가독성을 위해 다음 줄에서 설명할 것
- 제목, 번호, 마크다운 사용 금지
- 너무 신중하고 보수적이지 말 것
- 과거 지표를 활용할 것
- 마지막 문장은 반드시 다음 형식으로 끝낼 것: 판단: 롱 / 숏  , 관망은 최소한으로
`.trim();

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '당신은 전문 암호화폐 트레이딩 분석가입니다.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    })
  });

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    console.error('GPT 응답 오류:', json);
    return 'GPT 분석 실패';
  }
  return content;
}

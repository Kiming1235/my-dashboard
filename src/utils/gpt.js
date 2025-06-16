const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

export async function getGPTAnalysis(indicatorSummary) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `
당신은 숙련된 암호화폐 트레이딩 분석가입니다.

아래 RSI, MACD, EMA 지표 요약을 바탕으로 현재 시점의 시장 상황을 분석하세요.

요구 사항:
- 투자자가 이해하기 쉬운 자연스러운 말투 사용
- 전문 용어는 간단히 풀어 설명
- 숫자 값에 근거한 해석을 포함할 것
- 강한 의견이 아닌 '경향' 중심의 표현
- 길이는 3~5문장
- 제목, 번호, 마크다운 사용 금지
- 마지막 문장은 반드시 다음 형식으로 끝낼 것: 판단: 매수 / 매도 / 관망

            `
          },
          {
            role: "user",
            content: typeof indicatorSummary === "string" ? indicatorSummary : JSON.stringify(indicatorSummary),
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("GPT 응답 형식 오류:", data);
      return "GPT 분석에 실패했습니다: " + data.error.message;
    }

    return data.choices?.[0]?.message?.content || "GPT 분석 결과를 이해할 수 없습니다.";
  } catch (error) {
    console.error("GPT 통신 오류:", error);
    return "GPT 요청 중 오류가 발생했습니다.";
  }
}

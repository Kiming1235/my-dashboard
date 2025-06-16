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
당신은 숙련된 암호화폐 트레이딩 전문가입니다.
아래의 보조지표 데이터(RSI, MACD, EMA, 볼린저밴드 등)를 기반으로 다음의 기준에 따라 분석을 작성해 주세요:

1. 현재 가격의 위치가 상승/하락 추세인지 평가
2. 각 보조지표가 의미하는 바를 개별적으로 해석
3. 지표들 간의 종합 판단을 통해 매수 / 매도 / 관망 중 어떤 전략이 유효한지 결정
4. 그 근거를 명확하고 간결하게 설명
5. 단기(1~4시간), 중기(1일), 장기(1주)의 관점에서 요약 제시

※ 결과는 투자 조언이 아닌 분석 관점으로, 신중한 판단을 유도하도록 작성해주세요.`
          },
          {
            role: "user",
            content: typeof indicatorSummary === "string" ? indicatorSummary : JSON.stringify(indicatorSummary),
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
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

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
당신은 숙련된 암호화폐 분석가입니다.
아래 지표 요약을 바탕으로 단기 관점에서 분석을 작성하세요.

요구 사항:
- 문장 구조는 간결하고 일상적인 말투
- 번호나 굵은 글씨, 마크다운 없이 자연어 설명만 작성
- 분석 분량은 3~5문장 이내

마지막 줄에는 '👉 판단: 매수/매도/관망 중 하나'를 명시하세요.
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

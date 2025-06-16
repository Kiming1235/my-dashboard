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
            content:
              "당신은 전문 암호화폐 분석가입니다. 주어진 기술적 지표 요약을 바탕으로 매수/매도 관점에서 투자자에게 설명해주세요.",
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

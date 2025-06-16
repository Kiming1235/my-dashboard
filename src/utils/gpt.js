const OPENAI_API_KEY = "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";

export async function getGPTAnalysis({ rsi, macdHist, emaShort, emaLong }) {
  const prompt = `
비트코인 5분봉 기준 보조지표 분석 결과:

- RSI: ${rsi}
- MACD 히스토그램: ${macdHist}
- EMA(12): ${emaShort}
- EMA(26): ${emaLong}

이 정보를 바탕으로 현재 시장이 롱 진입에 적합한지, 숏이 더 나은지, 관망이 좋은지 판단하고 그 이유를 분석해줘.
답변은 트레이더가 조언해주는 말투로 해줘.
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    // ✅ 방어 코드: 응답 확인
    if (!data || !data.choices || !data.choices[0]?.message?.content) {
      console.warn("GPT 응답 형식 오류:", data);
      return "GPT 분석 응답을 이해할 수 없습니다. (응답 오류)";
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("GPT 분석 요청 실패:", error);
    return "GPT 분석 요청 중 오류가 발생했습니다.";
  }
}

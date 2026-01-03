import { GoogleGenAI } from "@google/genai";
import { UpbitTicker, UpbitCandle, AIAnalysisResult, GroundingSource, NewsArticle } from '../types';

// Initialize Gemini Client
// NOTE: process.env.API_KEY is injected by the environment.
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export const analyzeCoin = async (
  marketName: string,
  ticker: UpbitTicker,
  candles: UpbitCandle[]
): Promise<AIAnalysisResult> => {
  try {
    // Prepare recent price history for the prompt
    const recentHistory = candles.slice(-20).map(c => 
      `Time: ${c.candle_date_time_kst.substring(5, 16)}, Open: ${c.opening_price}, Close: ${c.trade_price}, Vol: ${c.candle_acc_trade_volume.toFixed(2)}`
    ).join('\n');

    const prompt = `
      You are a professional cryptocurrency analyst. Analyze the following Coin: ${marketName} (${ticker.market}).
      
      Current Data:
      - Price: ${ticker.trade_price} KRW
      - 24h Change: ${ticker.signed_change_rate * 100}%
      - 24h Volume: ${ticker.acc_trade_volume_24h.toFixed(0)}

      Recent Candle Data (Last 20 periods):
      ${recentHistory}

      Task:
      1. Perform a technical analysis based on the provided price data (Trend, Support/Resistance).
      2. SEARCH the web using Google Search for the latest relevant news about this coin or the general crypto market impacting this coin today.
      3. Combine technicals and news to determine a CLEAR market sentiment: 'Bullish' (Positive/Buy), 'Bearish' (Negative/Sell), or 'Neutral' (Sideways/Hold).
      4. Write a short, impactful, one-sentence Title in Korean summarizing the main reason for this sentiment.
      5. Write a detailed analysis in Korean Markdown.

      Output JSON Format:
      {
        "sentiment": "Bullish" | "Bearish" | "Neutral",
        "title": "Korean Title",
        "content": "Korean Markdown Content"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable Grounding
        responseMimeType: "application/json"
      },
    });

    // Extract grounding chunks for news links
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    let result;
    try {
      result = JSON.parse(response.text || "{}");
    } catch (e) {
      // Fallback in case JSON parsing fails, though unlikely with responseMimeType
      return {
        sentiment: 'Neutral',
        title: `${marketName} 분석 결과`,
        text: response.text || "분석 결과를 불러올 수 없습니다.",
        sources
      };
    }

    return {
      sentiment: result.sentiment || 'Neutral',
      title: result.title || `${marketName} 현황 분석`,
      text: result.content || "내용 없음",
      sources
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      sentiment: 'Neutral',
      title: "분석 실패",
      text: "현재 분석 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해주세요.",
      sources: []
    };
  }
};

export const getNewsBriefing = async (news: NewsArticle[]): Promise<string> => {
  if (news.length === 0) return "뉴스 데이터가 없습니다.";

  try {
    const headlines = news.slice(0, 10).map(n => `- ${n.title} (Source: ${n.source})`).join('\n');
    
    const prompt = `
      Here are the latest cryptocurrency news headlines:
      ${headlines}

      Task:
      Summarize the key market sentiment and major events based on these headlines into 3 concise bullet points.
      
      Requirements:
      1. **MUST be written in KOREAN (한국어).**
      2. Keep it brief and easy to read.
      3. Focus on the most important information.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "뉴스 요약을 생성할 수 없습니다.";
  } catch (error) {
    console.error("News Briefing Error:", error);
    return "AI 뉴스 요약 서비스 연결 실패";
  }
};

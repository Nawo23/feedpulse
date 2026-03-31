import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiAnalysis {
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  priority_score: number;
  summary: string;
  tags: string[];
}

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return new GoogleGenerativeAI(apiKey);
};

export const analyseFeedback = async (
  title: string,
  description: string
): Promise<GeminiAnalysis | null> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Analyse this product feedback and return ONLY valid JSON with no markdown or backticks.

Title: ${title}
Description: ${description}

Return a JSON object with exactly these fields:
{
  "category": "Bug" | "Feature Request" | "Improvement" | "Other",
  "sentiment": "Positive" | "Neutral" | "Negative",
  "priority_score": number between 1 and 10,
  "summary": "One concise sentence summarising the feedback",
  "tags": ["array", "of", "relevant", "tags", "max 5"]
}

Only return the raw JSON object. No explanation, no markdown.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean) as GeminiAnalysis;
    parsed.priority_score = Math.max(1, Math.min(10, parsed.priority_score));
    return parsed;
  } catch (err) {
    console.error('Gemini analysis failed:', err);
    return null;
  }
};

export const generateWeeklySummary = async (
  feedbackItems: Array<{ title: string; description: string; ai_category?: string }>
): Promise<string | null> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const feedbackText = feedbackItems
      .map((f, i) => `${i + 1}. [${f.ai_category || 'Unknown'}] ${f.title}`)
      .join('\n');
    const prompt = `Based on these ${feedbackItems.length} product feedback items from the last 7 days, identify the top 3 themes in 3-5 sentences.\n\n${feedbackText}`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('Gemini weekly summary failed:', err);
    return null;
  }
};
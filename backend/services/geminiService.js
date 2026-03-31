const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeFeedback(title, description) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Analyze this product feedback. Return ONLY valid JSON with keys: sentiment (Positive/Neutral/Negative), priority_score (1-10), summary. Feedback Title: ${title}. Description: ${description}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // You will need to parse this text to get JSON
    return JSON.parse(text); 
}

module.exports = { analyzeFeedback };
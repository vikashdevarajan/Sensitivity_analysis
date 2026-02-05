
import { GoogleGenAI, Type } from "@google/genai";
import { MatrixData, AnalysisResults, AdvisoryReport } from "../types";

export async function generateAdvisory(data: MatrixData, results: AnalysisResults): Promise<AdvisoryReport> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are a Strategic Business Advisor. Your task is to interpret a mathematical Game Theory model for a business owner who wants clear, jargon-free advice.
    
    Context:
    - Primary Entity (You): ${data.entityAName}
    - Opponent/Competitor: ${data.entityBName}
    - Your Available Moves: ${data.rowLabels.join(', ')}
    - Their Available Moves: ${data.colLabels.join(', ')}
    - Results Matrix (Positive numbers are good for you, negative are good for them): ${JSON.stringify(data.payoffs)}
    
    Calculated Results:
    - Overall Game Value: ${results.gameValue} (If positive, ${data.entityAName} is in a stronger position)
    - Optimal Play Style: ${results.isPure ? 'Single focus' : 'Mixed/Unpredictable'}
    - Your Best Move Mix: ${results.rowStrategies.map((s, i) => `${data.rowLabels[i]}: ${(s*100).toFixed(0)}%`).join(', ')}

    Please provide a report with these exact sections:
    1. Executive Summary: What is the current situation in plain English? Who has the upper hand?
    2. Strategic Advisory: Explain *why* the recommended move mix works. What should ${data.entityAName} do immediately to win or minimize loss?
    3. Sensitivity Analysis: If market conditions or competitor costs shift slightly, which move becomes too risky to use?
    4. Recommendations: 3-5 clear, numbered action steps.
    5. selfReportedGameValue: The Game Value you calculated from the data.
    6. internalReasoningScore: Confidence (0.0 to 1.0) in this analysis.

    IMPORTANT: Write for a human, not a computer. Use phrases like "If you lean too heavily on..." or "Your best bet is to..."
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          executiveSummary: { type: Type.STRING },
          strategicAdvisory: { type: Type.STRING },
          sensitivityAnalysis: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          selfReportedGameValue: { type: Type.NUMBER },
          internalReasoningScore: { type: Type.NUMBER }
        },
        required: ["executiveSummary", "strategicAdvisory", "sensitivityAnalysis", "recommendations", "selfReportedGameValue", "internalReasoningScore"]
      }
    }
  });

  return JSON.parse(response.text.trim()) as AdvisoryReport;
}

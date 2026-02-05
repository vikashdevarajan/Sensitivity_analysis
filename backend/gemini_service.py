import json
import os
from typing import List
import google.generativeai as genai
from pydantic import BaseModel

class MatrixData(BaseModel):
    rows: int
    cols: int
    rowLabels: List[str]
    colLabels: List[str]
    payoffs: List[List[int]]
    entityAName: str
    entityBName: str

class SensitivityResults(BaseModel):
    baseScores: dict
    optimalChoice: str
    marketShare: dict
    tippingPoints: List[dict]
    riskAssessment: dict
    stabilityIndex: float
    competitiveGaps: dict

class AdvisoryReport(BaseModel):
    executiveSummary: str
    strategicAdvisory: str
    sensitivityAnalysis: str
    recommendations: List[str]
    selfReportedGameValue: float
    internalReasoningScore: float

async def generate_advisory(data: MatrixData, results: SensitivityResults) -> AdvisoryReport:
    """Generate strategic advisory focused on business sensitivity analysis"""
    
    # Configure Gemini API
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")
    
    genai.configure(api_key=api_key)
    
    # Try different model names for free tier
    model_names = [
        'gemini-pro',
        'gemini-1.5-flash-latest',
        'models/gemini-pro'
    ]
    
    model = None
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name)
            test_response = model.generate_content("Hello")
            print(f"Successfully connected using model: {model_name}")
            break
        except Exception as e:
            print(f"Failed to use model {model_name}: {str(e)}")
            continue
    
    if model is None:
        raise Exception("No working Gemini model found")
    
    # Build comprehensive business prompt
    prompt = f"""
    You are a Senior Business Strategy Consultant analyzing market positioning for {data.entityAName}'s {data.yourProduct or 'product'} in the {data.entityBName} market.

    PRODUCT CONTEXT:
    Company: {data.entityAName}
    Your Product: {data.yourProduct or 'Main Product'}
    Market: {data.entityBName}
    
    MARKET ANALYSIS DATA:
    Products/Options: {', '.join(data.rowLabels)}
    Evaluation Criteria: {', '.join(data.colLabels)}
    Performance Matrix: {data.payoffs}
    
    SENSITIVITY ANALYSIS RESULTS:
    Current Market Leader: {results.optimalChoice}
    Utility Scores: {results.baseScores}
    Market Share Predictions: {results.marketShare}
    Market Stability Index: {results.stabilityIndex}/1.0
    Risk Level: {results.riskAssessment.get('level', 'Unknown')}
    
    CRITICAL TIPPING POINTS:
    {results.tippingPoints[:3] if results.tippingPoints else 'No major vulnerabilities detected'}
    
    COMPETITIVE POSITIONING:
    {results.competitiveGaps}

    As a strategic consultant, provide a comprehensive business report in JSON format focusing specifically on {data.yourProduct or 'the product'}:
    {{
        "executiveSummary": "What is {data.yourProduct or 'your product'}'s current competitive position in the {data.entityBName}? Is {data.yourProduct or 'the product'}'s market leadership secure or vulnerable?",
        "strategicAdvisory": "Based on the sensitivity analysis, what are the 2-3 most critical strategic moves {data.entityAName} should make for {data.yourProduct or 'their product'}? Focus on strengthening weak areas or defending against competitive threats.",
        "sensitivityAnalysis": "Which market factors pose the biggest risk to {data.yourProduct or 'the product'}'s position? What changes in consumer preferences or competitor actions could shift market leadership away from {data.yourProduct or 'this product'}?",
        "recommendations": [
            "List 4-5 specific actionable recommendations for {data.yourProduct or 'the product'}",
            "Focus on criteria where small improvements yield big competitive advantages for {data.yourProduct or 'this product'}",
            "Include defensive strategies against identified vulnerabilities for {data.yourProduct or 'the product'}",
            "Suggest market research or product development priorities for {data.yourProduct or 'this product'}"
        ],
        "selfReportedGameValue": {max(results.baseScores.values())},
        "internalReasoningScore": 88
    }}

    CONTEXT: This analysis is specifically for {data.entityAName}'s {data.yourProduct or 'product'} competing in the {data.entityBName}. Focus on practical, implementable strategies that address the sensitivity analysis findings for this specific product.

    Return ONLY valid JSON, no markdown formatting.
    """

    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean response
        if response_text.startswith('```json'):
            response_text = response_text[7:-3]
        elif response_text.startswith('```'):
            response_text = response_text[3:-3]
        
        advisory_data = json.loads(response_text)
        return AdvisoryReport(**advisory_data)
        
    except Exception as e:
        print(f"AI generation failed: {e}")
        # Business-focused fallback
        return AdvisoryReport(
            executiveSummary=f"{data.entityAName} currently leads with {results.optimalChoice}, holding {results.marketShare.get(results.optimalChoice, 0)}% predicted market share. Stability index: {results.stabilityIndex}.",
            strategicAdvisory=f"Focus on strengthening competitive advantages in key criteria. {len(results.tippingPoints)} sensitivity points identified that could shift market dynamics.",
            sensitivityAnalysis=f"Market position shows {results.riskAssessment.get('level', 'moderate')} risk. Critical factors: {', '.join(data.colLabels[:3])}. Monitor competitor moves in these areas.",
            recommendations=[
                f"Strengthen performance in lowest-scoring criteria: {data.colLabels[0]}",
                "Monitor competitor improvements that could trigger market shifts",
                "Invest in criteria with highest consumer weight sensitivity",
                "Develop contingency plans for identified tipping points",
                "Regular market research to track consumer preference changes"
            ],
            selfReportedGameValue=max(results.baseScores.values()),
            internalReasoningScore=80.0
        )
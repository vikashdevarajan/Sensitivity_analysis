from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Tuple, Dict, Any
import inspect
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Strategix Business Sensitivity Analysis API",
    description="Backend API for multi-criteria decision analysis and market sensitivity testing",
    version="2.0.0"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import our modules
from game_logic import solve_game, SensitivityResults
from ai_fetch import build_ai_matrix
from gemini_service import generate_advisory, AdvisoryReport

# Pydantic models for request/response
class WeightSet(BaseModel):
    fuel: float = 0.30
    safety: float = 0.25
    tech: float = 0.20
    service: float = 0.15
    price: float = 0.10

class MatrixData(BaseModel):
    rows: int
    cols: int
    rowLabels: List[str]
    colLabels: List[str]
    payoffs: List[List[int]]
    entityAName: str
    entityBName: str
    yourProduct: Optional[str] = None
    weights: Optional[WeightSet] = None

class GameAnalysisRequest(BaseModel):
    matrixData: MatrixData

class GameAnalysisResponse(BaseModel):
    results: Dict[str, Any]
    advisory: Dict[str, Any]

class AIFetchRequest(BaseModel):
    prompt: str
    segment: Optional[str] = None

class AIFetchResponse(BaseModel):
    matrixData: MatrixData
    rawData: List[Dict[str, Any]]


class MCPAIFetchToolRequest(BaseModel):
    prompt: str
    segment: Optional[str] = None


class MCPToolStringResponse(BaseModel):
    tool: str
    status: str
    output: str


async def _run_ai_fetch(prompt: str, segment: Optional[str]) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Compatibility wrapper for build_ai_matrix signatures across deployments."""
    parameters = inspect.signature(build_ai_matrix).parameters
    if "segment" in parameters:
        return await build_ai_matrix(prompt, segment)
    return await build_ai_matrix(prompt)


def _build_mcp_summary_text(
    matrix_data: MatrixData,
    raw_payload: List[Dict[str, Any]],
    results: SensitivityResults,
) -> str:
    labels = matrix_data.rowLabels
    payoffs = matrix_data.payoffs
    your_product = matrix_data.yourProduct or (labels[0] if labels else "N/A")
    your_index = labels.index(your_product) if your_product in labels else 0
    your_row = payoffs[your_index] if payoffs and your_index < len(payoffs) else []

    top_criterion = "N/A"
    weak_criterion = "N/A"
    if your_row and matrix_data.colLabels:
        best_idx = max(range(len(your_row)), key=lambda i: your_row[i])
        worst_idx = min(range(len(your_row)), key=lambda i: your_row[i])
        top_criterion = f"{matrix_data.colLabels[best_idx]} ({your_row[best_idx]}/10)"
        weak_criterion = f"{matrix_data.colLabels[worst_idx]} ({your_row[worst_idx]}/10)"

    top_features_text = "N/A"
    if raw_payload:
        first = raw_payload[0]
        feats = first.get("key_features", [])
        if isinstance(feats, list) and feats:
            top_features_text = ", ".join(str(item) for item in feats[:3])

    lines = [
        "Strategix MCP Tool Result",
        f"Cars: {', '.join(labels)}",
        f"Segment: {matrix_data.entityBName}",
        f"Leader: {results.optimalChoice}",
        f"Your Product: {your_product}",
        f"Market Share: {results.marketShare}",
        f"Stability Index: {results.stabilityIndex}",
        f"Risk Level: {results.riskAssessment.get('level', 'N/A')}",
        f"Top Criterion: {top_criterion}",
        f"Weakest Criterion: {weak_criterion}",
        f"Tipping Points: {len(results.tippingPoints)}",
        f"Reference Features ({labels[0] if labels else 'car'}): {top_features_text}",
        f"Quantized Matrix: {payoffs}",
    ]
    return "\n".join(lines)

@app.get("/")
async def root():
    return {
        "message": "Strategix Business Sensitivity Analysis API", 
        "version": "2.0.0",
        "focus": "Multi-criteria decision analysis for business strategy"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Business Sensitivity Analysis API"}

@app.post("/analyze", response_model=GameAnalysisResponse)
async def analyze_business_decision(request: GameAnalysisRequest):
    """
    Perform sensitivity analysis for business decision-making
    """
    try:
        # Perform sensitivity analysis
        results = solve_game(request.matrixData)
        
        # Generate strategic advisory
        advisory = await generate_advisory(request.matrixData, results)
        
        return GameAnalysisResponse(
            results=results.model_dump(),
            advisory=advisory.model_dump()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/ai/fetch", response_model=AIFetchResponse)
async def ai_fetch_matrix(request: AIFetchRequest):
    """Fetch and quantize car data using AI and web sources"""
    try:
        matrix_data, raw_payload = await _run_ai_fetch(request.prompt, request.segment)
        return AIFetchResponse(matrixData=MatrixData(**matrix_data), rawData=raw_payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI fetch failed: {str(e)}")


@app.get("/mcp/explain", response_model=MCPToolStringResponse)
async def mcp_explain():
    """MCP help endpoint describing tool purpose and expected input format."""
    output = "\n".join([
        "Strategix MCP Integration",
        "Purpose: Expose AI car comparison quantization + sensitivity summary for agent/tool use.",
        "Primary Tool Endpoint: POST /mcp/tools/ai-fetch-summary",
        "Input JSON:",
        "{",
        '  "prompt": "Baleno, i20, Swift",',
        '  "segment": "HATCHBACK"',
        "}",
        "Rules:",
        "- prompt must contain exactly 3 comma-separated car names.",
        "- segment must be one of: HATCHBACK, COMPACT_SEDAN, MID_SIZE_SEDAN, COMPACT_SUV, MID_SIZE_SUV.",
        "Output:",
        "- Returns a compact plain-text summary with key metrics: leader, market share, stability, risk, and quantized matrix.",
    ])
    return MCPToolStringResponse(tool="mcp-explain", status="ok", output=output)


@app.post("/mcp/tools/ai-fetch-summary", response_model=MCPToolStringResponse)
async def mcp_ai_fetch_summary(request: MCPAIFetchToolRequest):
    """MCP tool endpoint: run AI fetch flow and return compact key-metrics summary as plain text."""
    try:
        matrix_data, raw_payload = await _run_ai_fetch(request.prompt, request.segment)
        matrix_model = MatrixData(**matrix_data)
        results = solve_game(matrix_model)
        summary = _build_mcp_summary_text(matrix_model, raw_payload, results)
        return MCPToolStringResponse(tool="ai-fetch-summary", status="ok", output=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MCP tool failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
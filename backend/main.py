from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Tuple, Dict, Any
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
import numpy as np
from typing import List, Tuple, Optional, Dict, Any
from pydantic import BaseModel

class ProductContext(BaseModel):
    primary_product: str
    segment: str
    competitors: str  # Change from List[str] to str

class MatrixData(BaseModel):
    rows: int    
    cols: int
    rowLabels: List[str]  # Car models: ["Baleno", "Polo", "i20"]
    colLabels: List[str]  # Criteria: ["Fuel", "Safety", "Tech", "Service", "Price"]
    payoffs: List[List[int]]  # Scores matrix
    entityAName: str  # Company name: "Maruti Suzuki"
    entityBName: str  # Market context: "Compact Car Segment"
    yourProduct: Optional[str] = None  # Specific product name: "Baleno"
    weights: Optional[Dict[str, float]] = None

class ConfidenceMetrics(BaseModel):
    overallScore: float
    dataQuality: float
    modelReliability: float
    marketStability: float
    predictionAccuracy: float

class ScenarioAnalysis(BaseModel):
    scenarioName: str
    newLeader: str
    marketShareShift: Dict[str, float]
    impactScore: float

class StrengthArea(BaseModel):
    criterion: str
    score: int
    recommendation: str

class InvestmentArea(BaseModel):
    criterion: str
    currentScore: int
    targetScore: int
    priority: str
    recommendation: str

class WeaknessArea(BaseModel):
    criterion: str
    score: int
    competitorBest: int
    gap: int
    recommendation: str

class SensitivityResults(BaseModel):
    baseScores: Dict[str, float]  # Base utility scores for each car
    optimalChoice: str  # Current market leader
    marketShare: Dict[str, float]  # Predicted market share
    tippingPoints: List[Dict[str, Any]]  # Critical change points
    riskAssessment: Dict[str, Any]  # Risk factors
    stabilityIndex: float  # How stable is current position (0-1)
    competitiveGaps: Dict[str, Dict[str, float]]  # Gaps vs competitors
    # New fields
    productContext: Optional[ProductContext] = None
    confidenceMetrics: Optional[ConfidenceMetrics] = None
    criteriaSensitivity: Optional[Dict[str, float]] = None
    scenarioAnalysis: Optional[List[ScenarioAnalysis]] = None
    strengths: Optional[List[StrengthArea]] = None
    weaknesses: Optional[List[WeaknessArea]] = None  # Added weaknesses
    investmentAreas: Optional[List[InvestmentArea]] = None
    yourProductAnalysis: Optional[Dict[str, Any]] = None  # Analysis focused on user's product

class WeightSet(BaseModel):
    fuel: float = 0.3
    safety: float = 0.25
    tech: float = 0.2
    service: float = 0.15
    price: float = 0.1

def detect_product_context(entity_name: str, market_segment: str, your_product: str = None) -> ProductContext:
    """Detect product context based on company, market segment, and user's product"""
    entity_lower = entity_name.lower()
    segment_lower = market_segment.lower()
    
    # Use user-provided product name if available
    primary_product = your_product if your_product else "Main Product"
    
    # Automotive mappings
    if "maruti" in entity_lower or "suzuki" in entity_lower:
        if "compact" in segment_lower or "car" in segment_lower:
            return ProductContext(
                primary_product=primary_product or "Baleno",
                segment="Compact Car Segment",
                competitors="Polo, i20"  # String instead of list
            )
    elif "apple" in entity_lower:
        if "smartphone" in segment_lower or "mobile" in segment_lower:
            return ProductContext(
                primary_product=primary_product or "iPhone",
                segment="Premium Smartphone Market",
                competitors="Galaxy S, Pixel"
            )
    elif "tesla" in entity_lower:
        if "electric" in segment_lower or "ev" in segment_lower:
            return ProductContext(
                primary_product=primary_product or "Model 3",
                segment="Electric Vehicle Market",
                competitors="Polestar 2, BMW i4"
            )
    elif "samsung" in entity_lower:
        if "smartphone" in segment_lower:
            return ProductContext(
                primary_product=primary_product or "Galaxy S",
                segment="Android Smartphone Market",
                competitors="iPhone, Pixel"
            )
    elif "google" in entity_lower:
        if "smartphone" in segment_lower:
            return ProductContext(
                primary_product=primary_product or "Pixel",
                segment="Android Premium Market",
                competitors="Galaxy S, OnePlus"
            )
    
    # Default fallback
    return ProductContext(
        primary_product=primary_product or f"{entity_name} Product",
        segment=market_segment,
        competitors="Competitor A, Competitor B"
    )

def calculate_confidence_metrics(data: MatrixData, results: Dict[str, Any]) -> ConfidenceMetrics:
    """Calculate confidence metrics for the analysis"""
    
    # Data Quality (based on score variance and completeness)
    score_variance = np.var([score for row in data.payoffs for score in row])
    data_quality = min(100, 60 + (score_variance / 10) * 40)  # Higher variance = better data spread
    
    # Model Reliability (based on number of options and criteria)
    model_reliability = min(100, 50 + (data.rows * data.cols * 2))
    
    # Market Stability (inverse of number of tipping points)
    stability_factor = len(results.get('tippingPoints', []))
    market_stability = max(20, 100 - (stability_factor * 15))
    
    # Prediction Accuracy (based on score margins)
    scores = list(results.get('baseScores', {}).values())
    if len(scores) >= 2:
        sorted_scores = sorted(scores, reverse=True)
        margin = sorted_scores[0] - sorted_scores[1]
        prediction_accuracy = min(100, 50 + (margin * 10))
    else:
        prediction_accuracy = 75
    
    # Overall score (weighted average)
    overall_score = (
        data_quality * 0.25 +
        model_reliability * 0.20 +
        market_stability * 0.30 +
        prediction_accuracy * 0.25
    )
    
    return ConfidenceMetrics(
        overallScore=round(overall_score, 1),
        dataQuality=round(data_quality, 1),
        modelReliability=round(model_reliability, 1),
        marketStability=round(market_stability, 1),
        predictionAccuracy=round(prediction_accuracy, 1)
    )

def calculate_criteria_sensitivity(data: MatrixData, base_weights: WeightSet) -> Dict[str, float]:
    """Calculate sensitivity percentage for each criterion"""
    sensitivity_scores = {}
    base_scores = calculate_utility_scores(data, base_weights)
    current_leader = max(base_scores.keys(), key=lambda x: base_scores[x])
    
    criteria = ["fuel", "safety", "tech", "service", "price"]
    
    for criterion in criteria:
        changes_count = 0
        total_tests = 0
        
        # Test various weight changes
        for weight_change in [-0.20, -0.15, -0.10, -0.05, 0.05, 0.10, 0.15, 0.20]:
            test_weights = WeightSet(**base_weights.model_dump())
            current_weight = getattr(test_weights, criterion)
            new_weight = max(0.01, min(0.50, current_weight + weight_change))
            setattr(test_weights, criterion, new_weight)
            
            # Renormalize
            total_weight = sum([test_weights.fuel, test_weights.safety, test_weights.tech, test_weights.service, test_weights.price])
            test_weights.fuel /= total_weight
            test_weights.safety /= total_weight
            test_weights.tech /= total_weight
            test_weights.service /= total_weight
            test_weights.price /= total_weight
            
            # Calculate new scores
            new_scores = calculate_utility_scores(data, test_weights)
            new_leader = max(new_scores.keys(), key=lambda x: new_scores[x])
            
            total_tests += 1
            if new_leader != current_leader:
                changes_count += 1
        
        sensitivity_percentage = (changes_count / total_tests) * 100 if total_tests > 0 else 0
        sensitivity_scores[criterion] = round(sensitivity_percentage, 1)
    
    return sensitivity_scores

def generate_scenario_analysis(data: MatrixData, base_weights: WeightSet) -> List[ScenarioAnalysis]:
    """Generate what-if scenario analysis"""
    scenarios = []
    
    scenario_configs = [
        ("Safety Focus (+20%)", "safety", 0.20),
        ("Tech Innovation (+25%)", "tech", 0.25),
        ("Price Sensitivity (+15%)", "price", 0.15),
        ("Fuel Economy (+18%)", "fuel", 0.18),
        ("Service Quality (+12%)", "service", 0.12)
    ]
    
    for scenario_name, criterion, boost in scenario_configs:
        test_weights = WeightSet(**base_weights.model_dump())
        
        # Boost the criterion weight
        current_weight = getattr(test_weights, criterion)
        new_weight = min(0.50, current_weight + boost)
        setattr(test_weights, criterion, new_weight)
        
        # Renormalize all weights
        total_weight = sum([test_weights.fuel, test_weights.safety, test_weights.tech, test_weights.service, test_weights.price])
        test_weights.fuel /= total_weight
        test_weights.safety /= total_weight
        test_weights.tech /= total_weight
        test_weights.service /= total_weight
        test_weights.price /= total_weight
        
        # Calculate new scores and market share
        new_scores = calculate_utility_scores(data, test_weights)
        new_leader = max(new_scores.keys(), key=lambda x: new_scores[x])
        new_market_share = calculate_market_share(new_scores)
        
        # Calculate impact score (difference from base)
        base_scores = calculate_utility_scores(data, base_weights)
        impact_score = abs(new_scores[new_leader] - max(base_scores.values()))
        
        scenarios.append(ScenarioAnalysis(
            scenarioName=scenario_name,
            newLeader=new_leader,
            marketShareShift=new_market_share,
            impactScore=impact_score
        ))
    
    return scenarios

def identify_strengths_and_investments(data: MatrixData, your_product: str = None) -> Tuple[List[StrengthArea], List[WeaknessArea], List[InvestmentArea]]:
    """Identify competitive strengths, weaknesses, and investment opportunities for YOUR product"""
    strengths = []
    weaknesses = []
    investments = []
    
    if not data.rowLabels or not data.colLabels:
        return strengths, weaknesses, investments
    
    # Find YOUR product index (not just the first one)
    primary_product = your_product or data.rowLabels[0]
    try:
        primary_idx = data.rowLabels.index(primary_product)
    except ValueError:
        primary_idx = 0
        primary_product = data.rowLabels[0]
    
    for j, criterion in enumerate(data.colLabels):
        primary_score = data.payoffs[primary_idx][j]
        
        # Calculate competitor scores for this criterion
        competitor_scores = [data.payoffs[i][j] for i in range(len(data.rowLabels)) if i != primary_idx]
        max_competitor_score = max(competitor_scores) if competitor_scores else 0
        avg_competitor_score = sum(competitor_scores) / len(competitor_scores) if competitor_scores else 0
        
        # STRENGTH: Your product leads in this criterion
        if primary_score >= 8 and primary_score >= max_competitor_score:
            strengths.append(StrengthArea(
                criterion=criterion.lower(),
                score=primary_score,
                recommendation=f"Leverage your strong {criterion.lower()} performance in marketing. You lead competitors here!"
            ))
        
        # WEAKNESS: Your product is behind competitors
        elif primary_score < max_competitor_score:
            gap = max_competitor_score - primary_score
            if gap >= 1:  # At least 1 point behind
                weaknesses.append(WeaknessArea(
                    criterion=criterion.lower(),
                    score=primary_score,
                    competitorBest=max_competitor_score,
                    gap=gap,
                    recommendation=f"Competitors outscore you by {gap} points in {criterion.lower()}. Consider improvements."
                ))
        
        # Investment opportunity: Score < 7 or significantly behind
        if primary_score < 7 or (max_competitor_score - primary_score) >= 2:
            gap = max(0, max_competitor_score - primary_score)
            priority = "High" if gap >= 3 else "Medium" if gap >= 2 else "Low"
            
            investments.append(InvestmentArea(
                criterion=criterion.lower(),
                currentScore=primary_score,
                targetScore=min(10, max_competitor_score + 1),
                priority=priority,
                recommendation=f"Invest in {criterion.lower()} to close the competitive gap"
            ))
    
    return strengths, weaknesses, investments

def analyze_your_product(data: MatrixData, base_scores: Dict[str, float], market_share: Dict[str, float], your_product: str) -> Dict[str, Any]:
    """Generate analysis specifically for YOUR selected product"""
    
    # Find your product's position
    try:
        your_idx = data.rowLabels.index(your_product)
    except ValueError:
        your_idx = 0
        your_product = data.rowLabels[0]
    
    your_score = base_scores.get(your_product, 0)
    your_share = market_share.get(your_product, 0)
    
    # Rank your product
    sorted_products = sorted(base_scores.items(), key=lambda x: x[1], reverse=True)
    your_rank = next((i + 1 for i, (name, _) in enumerate(sorted_products) if name == your_product), 1)
    
    # Find leader and gap
    leader = sorted_products[0][0]
    leader_score = sorted_products[0][1]
    gap_to_leader = leader_score - your_score if leader != your_product else 0
    
    # Find who you're ahead of and behind
    ahead_of = [name for name, score in base_scores.items() if score < your_score and name != your_product]
    behind = [name for name, score in base_scores.items() if score > your_score and name != your_product]
    
    # Position assessment
    if your_rank == 1:
        position = "Market Leader"
        position_detail = f"{your_product} currently leads the market with {your_share:.1f}% predicted share."
    elif your_rank == 2:
        position = "Strong Challenger"
        position_detail = f"{your_product} is the #2 player, {gap_to_leader:.2f} points behind {leader}."
    else:
        position = "Competitive Underdog"
        position_detail = f"{your_product} ranks #{your_rank}, needs strategic improvements to compete."
    
    return {
        "yourProduct": your_product,
        "yourScore": your_score,
        "yourShare": your_share,
        "yourRank": your_rank,
        "totalProducts": len(data.rowLabels),
        "position": position,
        "positionDetail": position_detail,
        "marketLeader": leader,
        "gapToLeader": gap_to_leader,
        "aheadOf": ahead_of,
        "behind": behind,
        "isLeader": your_rank == 1
    }

def calculate_utility_scores(data: MatrixData, weights: WeightSet) -> Dict[str, float]:
    """Calculate weighted utility scores for each alternative"""
    scores = {}
    
    # Convert weights to list matching column order
    weight_values = [weights.fuel, weights.safety, weights.tech, weights.service, weights.price]
    
    for i, car in enumerate(data.rowLabels):
        utility = sum(data.payoffs[i][j] * weight_values[j] for j in range(data.cols))
        scores[car] = round(utility, 2)
    
    return scores

def find_tipping_points(data: MatrixData, base_weights: WeightSet) -> List[Dict[str, Any]]:
    """Find critical points where market leadership changes"""
    tipping_points = []
    base_scores = calculate_utility_scores(data, base_weights)
    current_leader = max(base_scores.keys(), key=lambda x: base_scores[x])
    
    # Test each criterion's sensitivity
    criteria = ["fuel", "safety", "tech", "service", "price"]
    
    for i, criterion in enumerate(criteria):
        # Test what happens if we change this criterion's weight
        for weight_change in [-0.15, -0.10, -0.05, 0.05, 0.10, 0.15]:
            test_weights = WeightSet(**base_weights.model_dump())
            
            # Adjust the weight (ensure it stays positive)
            current_weight = getattr(test_weights, criterion)
            new_weight = max(0.01, current_weight + weight_change)
            setattr(test_weights, criterion, new_weight)
            
            # Renormalize weights to sum to 1
            total_weight = (test_weights.fuel + test_weights.safety + 
                          test_weights.tech + test_weights.service + test_weights.price)
            
            test_weights.fuel /= total_weight
            test_weights.safety /= total_weight
            test_weights.tech /= total_weight
            test_weights.service /= total_weight
            test_weights.price /= total_weight
            
            # Calculate new scores
            new_scores = calculate_utility_scores(data, test_weights)
            new_leader = max(new_scores.keys(), key=lambda x: new_scores[x])
            
            # If leadership changes, record the tipping point
            if new_leader != current_leader:
                tipping_points.append({
                    "criterion": criterion,
                    "weightChange": weight_change,
                    "newWeight": round(new_weight, 3),
                    "previousLeader": current_leader,
                    "newLeader": new_leader,
                    "scoreChange": round(new_scores[new_leader] - base_scores[current_leader], 2),
                    "marketImpact": f"{criterion.title()} importance shifts market leadership"
                })
    
    return tipping_points

def calculate_competitive_gaps(data: MatrixData) -> Dict[str, Dict[str, float]]:
    """Calculate gaps between competitors on each criterion"""
    gaps = {}
    
    for i, car1 in enumerate(data.rowLabels):
        gaps[car1] = {}
        for j, car2 in enumerate(data.rowLabels):
            if car1 != car2:
                # Calculate average gap across all criteria
                gap = sum(data.payoffs[i][k] - data.payoffs[j][k] for k in range(data.cols)) / data.cols
                gaps[car1][car2] = round(gap, 2)
    
    return gaps

def assess_market_stability(base_scores: Dict[str, float], tipping_points: List[Dict]) -> float:
    """Calculate how stable the current market position is"""
    if not tipping_points:
        return 1.0  # Very stable if no tipping points found
    
    # Count critical changes
    leadership_changes = len(tipping_points)
    
    # Calculate score margins
    sorted_scores = sorted(base_scores.values(), reverse=True)
    if len(sorted_scores) >= 2:
        leader_margin = sorted_scores[0] - sorted_scores[1]
        stability = min(1.0, leader_margin / 10.0)  # Normalize to 0-1
    else:
        stability = 0.5
    
    # Adjust for number of vulnerabilities
    vulnerability_factor = max(0.1, 1.0 - (leadership_changes * 0.1))
    
    return round(stability * vulnerability_factor, 3)

def calculate_market_share(scores: Dict[str, float]) -> Dict[str, float]:
    """Calculate predicted market share based on utility scores"""
    # Use softmax to convert scores to probabilities
    max_score = max(scores.values())
    exp_scores = {car: np.exp(score - max_score) for car, score in scores.items()}
    total_exp = sum(exp_scores.values())
    
    market_share = {car: round(exp_score / total_exp * 100, 1) 
                   for car, exp_score in exp_scores.items()}
    
    return market_share

def solve_game(data: MatrixData) -> SensitivityResults:
    """Main function to perform sensitivity analysis"""
    
    # Handle weights from frontend
    if data.weights and isinstance(data.weights, dict):
        base_weights = WeightSet(
            fuel=data.weights.get('fuel', 0.30),
            safety=data.weights.get('safety', 0.25),
            tech=data.weights.get('tech', 0.20),
            service=data.weights.get('service', 0.15),
            price=data.weights.get('price', 0.10)
        )
    elif hasattr(data, 'weights') and hasattr(data.weights, 'fuel'):
        base_weights = data.weights
    else:
        base_weights = WeightSet(
            fuel=0.30,
            safety=0.25,
            tech=0.20,
            service=0.15,
            price=0.10
        )
    
    print(f"DEBUG: Using weights - Fuel: {base_weights.fuel:.3f}, Safety: {base_weights.safety:.3f}, Tech: {base_weights.tech:.3f}, Service: {base_weights.service:.3f}, Price: {base_weights.price:.3f}")
    
    # Calculate base utility scores
    base_scores = calculate_utility_scores(data, base_weights)
    print(f"DEBUG: Utility scores - {base_scores}")
    
    # Find market leader
    optimal_choice = max(base_scores.keys(), key=lambda x: base_scores[x])
    print(f"DEBUG: Market leader - {optimal_choice}")
    
    # Calculate market share
    market_share = calculate_market_share(base_scores)
    
    # Find tipping points
    tipping_points = find_tipping_points(data, base_weights)
    
    # Calculate competitive gaps
    competitive_gaps = calculate_competitive_gaps(data)
    
    # Assess stability
    stability_index = assess_market_stability(base_scores, tipping_points)
    
    # Generate new analytics - use yourProduct from data
    your_product = data.yourProduct or data.rowLabels[0]
    product_context = detect_product_context(data.entityAName, data.entityBName, your_product)
    
    # Create results dict for confidence calculation
    results_dict = {
        'baseScores': base_scores,
        'tippingPoints': tipping_points
    }
    
    confidence_metrics = calculate_confidence_metrics(data, results_dict)
    criteria_sensitivity = calculate_criteria_sensitivity(data, base_weights)
    scenario_analysis = generate_scenario_analysis(data, base_weights)
    
    # Get strengths, weaknesses, investments for YOUR product specifically
    strengths, weaknesses, investment_areas = identify_strengths_and_investments(data, your_product)
    
    # Generate YOUR product specific analysis
    your_product_analysis = analyze_your_product(data, base_scores, market_share, your_product)
    
    # Risk assessment
    risk_factors = []
    if stability_index < 0.7:
        risk_factors.append("Market position vulnerable to weight shifts")
    if len(tipping_points) > 5:
        risk_factors.append("Multiple sensitivity points detected")
    
    leader_score = base_scores[optimal_choice]
    second_best_score = sorted(base_scores.values(), reverse=True)[1]
    if leader_score - second_best_score < 2.0:
        risk_factors.append("Narrow competitive advantage")
    
    risk_assessment = {
        "level": "High" if len(risk_factors) >= 2 else "Medium" if len(risk_factors) == 1 else "Low",
        "factors": risk_factors,
        "recommendation": "Focus on strengthening weak criteria" if len(risk_factors) > 0 else "Maintain current strategy"
    }
    
    return SensitivityResults(
        baseScores=base_scores,
        optimalChoice=optimal_choice,
        marketShare=market_share,
        tippingPoints=tipping_points,
        riskAssessment=risk_assessment,
        stabilityIndex=stability_index,
        competitiveGaps=competitive_gaps,
        productContext=product_context,
        confidenceMetrics=confidence_metrics,
        criteriaSensitivity=criteria_sensitivity,
        scenarioAnalysis=scenario_analysis,
        strengths=strengths,
        weaknesses=weaknesses,
        investmentAreas=investment_areas,
        yourProductAnalysis=your_product_analysis
    )
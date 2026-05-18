import asyncio
import json
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple

import google.generativeai as genai
from firecrawl import FirecrawlApp
from pydantic import BaseModel, Field
from config import (
    GEMINI_TECH_SCORE_MODEL,
    FIRECRAWL_REQUEST_DELAY,
    GEMINI_REQUEST_DELAY,
    TECH_SCORE_FALLBACK
)

# Rate limiting state (runtime tracking)
_last_firecrawl_time = 0.0
_last_gemini_time = 0.0

class CarData(BaseModel):
    car_name: str = Field(description="Exact car model name")
    price_inr: Optional[float] = Field(description="Ex-showroom price in INR, numbers only", default=None)
    arai_mileage_kmpl: Optional[float] = Field(description="ARAI mileage in km/l, numbers only", default=None)
    power_bhp: Optional[float] = Field(description="Engine power in BHP, numbers only", default=None)
    safety_rating: Optional[float] = Field(description="Crash test star rating (0-5)", default=None)
    service_score: Optional[int] = Field(description="J.D. Power India CSI service satisfaction score (0-1000)", default=None)
    key_features: List[str] = Field(description="3-5 top tech/safety features")

class ModelResolution(BaseModel):
    cars: List[str]
    market_segment: str


SEGMENT_BOUNDS: Dict[str, Dict[str, Dict[str, float]]] = {
    "HATCHBACK": {
        "Price": {"min": 390000, "max": 1150000},
        "Mileage": {"min": 16.0, "max": 26.0},
        "Performance": {"min": 65.0, "max": 125.0},
        "Safety": {"min": 0, "max": 5},
        "Service": {"min": 700, "max": 950},
    },
    "COMPACT_SEDAN": {
        "Price": {"min": 650000, "max": 1050000},
        "Mileage": {"min": 18.0, "max": 25.0},
        "Performance": {"min": 65.0, "max": 100.0},
        "Safety": {"min": 0, "max": 5},
        "Service": {"min": 700, "max": 950},
    },
    "MID_SIZE_SEDAN": {
        "Price": {"min": 900000, "max": 2050000},
        "Mileage": {"min": 15.0, "max": 27.5},
        "Performance": {"min": 100.0, "max": 165.0},
        "Safety": {"min": 2, "max": 5},
        "Service": {"min": 700, "max": 950},
    },
    "COMPACT_SUV": {
        "Price": {"min": 750000, "max": 1600000},
        "Mileage": {"min": 16.0, "max": 23.0},
        "Performance": {"min": 80.0, "max": 135.0},
        "Safety": {"min": 0, "max": 5},
        "Service": {"min": 700, "max": 950},
    },
    "MID_SIZE_SUV": {
        "Price": {"min": 1080000, "max": 2300000},
        "Mileage": {"min": 13.0, "max": 28.0},
        "Performance": {"min": 100.0, "max": 205.0},
        "Safety": {"min": 3, "max": 5},
        "Service": {"min": 700, "max": 950},
    },
}


SEGMENT_LABELS: Dict[str, str] = {
    "HATCHBACK": "Hatchback Segment",
    "COMPACT_SEDAN": "Compact Sedan Segment",
    "MID_SIZE_SEDAN": "Mid-Size Sedan Segment",
    "COMPACT_SUV": "Compact SUV Segment",
    "MID_SIZE_SUV": "Mid-Size SUV Segment",
}


def _rate_limit_firecrawl() -> None:
    """Rate limit Firecrawl requests to avoid 429 errors"""
    global _last_firecrawl_time
    elapsed = time.time() - _last_firecrawl_time
    if elapsed < FIRECRAWL_REQUEST_DELAY:
        wait = FIRECRAWL_REQUEST_DELAY - elapsed
        print(f"      (rate limit: waiting {wait:.1f}s)")
        time.sleep(wait)
    _last_firecrawl_time = time.time()


def _rate_limit_gemini() -> None:
    """Rate limit Gemini requests to avoid 429 errors"""
    global _last_gemini_time
    elapsed = time.time() - _last_gemini_time
    if elapsed < GEMINI_REQUEST_DELAY:
        wait = GEMINI_REQUEST_DELAY - elapsed
        time.sleep(wait)
    _last_gemini_time = time.time()


def _configure_gemini() -> None:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")
    genai.configure(api_key=api_key)


def _clean_json(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
    return cleaned.strip()


def _parse_json(text: str) -> Dict[str, Any]:
    return json.loads(_clean_json(text))


def _extract_number(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).lower().replace(",", "")
    multiplier = 1.0
    if "lakh" in text or "lac" in text:
        multiplier = 100000.0
    if "crore" in text:
        multiplier = 10000000.0
    matches = re.findall(r"\d+(?:\.\d+)?", text)
    if not matches:
        return None
    return float(matches[0]) * multiplier


def _clamp(value: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, value))


def _normalize_by_bounds(
    value: Optional[float],
    min_val: float,
    max_val: float,
    invert: bool = False,
) -> int:
    if value is None:
        return int(round(TECH_SCORE_FALLBACK))
    if max_val <= min_val:
        return int(round(TECH_SCORE_FALLBACK))
    ratio = (value - min_val) / (max_val - min_val)
    ratio = _clamp(ratio, 0.0, 1.0)
    if invert:
        ratio = 1.0 - ratio
    score = 1.0 + ratio * 9.0
    return int(round(_clamp(score, 1.0, 10.0)))


def parse_comma_separated_cars(input_string: str) -> List[str]:
    """Parse comma-separated car names directly from user input"""
    print(f"\n[AI MATRIX] User input: {input_string}")
    print(f"[STEP 0/3] Parsing car models...")
    
    # Split by comma and clean whitespace
    cars = [car.strip() for car in input_string.split(",") if car.strip()]
    
    if not cars:
        raise ValueError("No car names provided")
    
    if len(cars) != 3:
        raise ValueError("Please provide exactly 3 car names separated by commas")
    print(f"✓ Parsed cars: {cars}")
    return cars


def _build_firecrawl_agent_prompt(car_name: str) -> str:
    brand_name = car_name.split()[0] if car_name.strip() else car_name
    return f"""
Search reliable Indian automotive websites (like CarDekho, CarWale, Autocar India, and manufacturer websites)
for the top-end variant of {car_name} and extract:
- Ex-showroom price in INR (numbers only)
- Official ARAI mileage in km/l (numbers only)
- Engine power in BHP (numbers only)
- Crash test safety star rating (0 to 5), preferably Bharat NCAP or Global NCAP

For service score, do this exactly:
Search automotive news sites (like Autocar India) or official press releases for the most recent
"J.D. Power India Customer Service Index (CSI) Study" mass-market rankings.
Find the exact customer satisfaction score for brand {brand_name} on the 1,000-point scale.
Return only the final integer as service_score.

For technology features, search Indian automotive sites for the top-end variant of {car_name} and list
advanced features, prioritizing: touchscreen size, sunroof, 360-degree camera, ADAS, connected car tech.

Return strictly in schema-compatible values.
"""


def _resolve_firecrawl_api_key() -> str:
    api_key = os.getenv("FIRECRAWL_API_KEY")
    if not api_key:
        raise ValueError("FIRECRAWL_API_KEY environment variable is not set")
    return api_key


async def fetch_car_data(car_name: str) -> CarData:
    """Fetch car data using Firecrawl Agent with direct schema extraction."""
    print(f"\n[AI FETCH] Starting fetch for: {car_name}")
    
    app = FirecrawlApp(api_key=_resolve_firecrawl_api_key())

    def run_fetch() -> CarData:
        try:
            print(f"  [1/2] Running Firecrawl agent for {car_name}...")
            _rate_limit_firecrawl()
            result = app.agent(
                prompt=_build_firecrawl_agent_prompt(car_name),
                schema=CarData,
            )

            payload: Any = result
            if hasattr(result, "data"):
                payload = result.data
            if isinstance(payload, CarData):
                car_data = payload
            elif hasattr(payload, "model_dump"):
                car_data = CarData(**payload.model_dump())
            elif isinstance(payload, dict):
                car_data = CarData(**payload)
            else:
                raise ValueError("Firecrawl agent returned unsupported payload format")

            if not car_data.car_name:
                car_data.car_name = car_name

            print(f"  [2/2] Agent extraction complete")
            print(
                f"  ✓ {car_name}: Price=₹{car_data.price_inr}, Mileage={car_data.arai_mileage_kmpl}km/l, "
                f"BHP={car_data.power_bhp}, Safety={car_data.safety_rating}★, Service={car_data.service_score}/1000"
            )
            
            return car_data
                
        except Exception as e:
            print(f"  ✗ Fetch failed: {str(e)[:150]}")
            print(f"  ⚠ Using fallback defaults for {car_name}")
            return CarData(
                car_name=car_name,
                price_inr=None,
                arai_mileage_kmpl=None,
                power_bhp=None,
                safety_rating=None,
                service_score=None,
                key_features=["Feature data unavailable"]
            )

    result = await asyncio.to_thread(run_fetch)
    return result


def _build_batch_tech_prompt(car_features: List[Dict[str, Any]]) -> str:
    return f"""
You are grading technology packages for 3 cars comparatively in the Indian market.

Input cars and their extracted feature lists:
{json.dumps(car_features, indent=2)}

Evaluate all three cars relative to each other on technology sophistication.
Focus on ADAS, 360 camera, connected car tech, touchscreen quality/size, sunroof, and premium safety tech.

Return JSON only in this exact format:
{{
  "tech_scores": [
    {{"car_name": "car 1", "score": 1-10}},
    {{"car_name": "car 2", "score": 1-10}},
    {{"car_name": "car 3", "score": 1-10}}
  ]
}}

Rules:
- Scores must be floats or ints in range 1 to 10.
- Use relative grading between these cars only.
- Return all 3 cars in one response.
"""


async def score_tech_batch(cars_data: List[CarData]) -> List[float]:
    """Score technology for all cars in one Gemini call to reduce rate-limit issues."""
    _configure_gemini()
    _rate_limit_gemini()
    model = genai.GenerativeModel(GEMINI_TECH_SCORE_MODEL)
    payload = [
        {"car_name": car.car_name, "key_features": car.key_features}
        for car in cars_data
    ]

    try:
        response = model.generate_content(_build_batch_tech_prompt(payload))
        parsed = _parse_json(response.text)
        scored_items = parsed.get("tech_scores", [])
        scores_by_name: Dict[str, float] = {}
        for item in scored_items:
            if not isinstance(item, dict):
                continue
            name = str(item.get("car_name", "")).strip()
            score_raw = item.get("score")
            try:
                score_val = float(score_raw)
            except Exception:
                continue
            if name:
                scores_by_name[name.lower()] = _clamp(score_val, 1.0, 10.0)

        ordered_scores: List[float] = []
        for car in cars_data:
            ordered_scores.append(scores_by_name.get(car.car_name.lower(), TECH_SCORE_FALLBACK))

        print(f"      Batch tech scores: {ordered_scores}")
        return ordered_scores
    except Exception as e:
        print(f"      ⚠ Batch tech scoring failed: {str(e)[:120]}")
        return [TECH_SCORE_FALLBACK for _ in cars_data]


def quantize_car_data(
    raw: CarData,
    tech_score: float,
    bounds: Dict[str, Dict[str, float]],
) -> Dict[str, int]:
    price = _extract_number(raw.price_inr)
    mileage = _extract_number(raw.arai_mileage_kmpl)
    service = _extract_number(raw.service_score)
    power_bhp = _extract_number(raw.power_bhp)

    quantized = {
        "Mileage": _normalize_by_bounds(
            mileage,
            bounds["Mileage"]["min"],
            bounds["Mileage"]["max"],
            invert=False,
        ),
        "Service": _normalize_by_bounds(
            service,
            bounds["Service"]["min"],
            bounds["Service"]["max"],
            invert=False,
        ),
        "Tech": int(round(_clamp(tech_score, 1.0, 10.0))),
        "Price": _normalize_by_bounds(
            price,
            bounds["Price"]["min"],
            bounds["Price"]["max"],
            invert=True,
        ),
        "Performance": _normalize_by_bounds(
            power_bhp,
            bounds["Performance"]["min"],
            bounds["Performance"]["max"],
            invert=False,
        ),
    }
    
    print(
        f"      Raw Data: Price=₹{price}, Mileage={mileage}km/l, Service={service}/1000, "
        f"BHP={power_bhp}, Safety={raw.safety_rating}★"
    )
    print(f"      Quantized: {quantized}")
    
    return quantized


def _build_matrix(cars: List[str], scores: List[Dict[str, int]], market_segment: str) -> Dict[str, Any]:
    col_labels = ["Mileage", "Service", "Tech", "Price", "Performance"]
    payoffs = []
    for score in scores:
        payoffs.append([score[label] for label in col_labels])

    return {
        "rows": len(cars),
        "cols": len(col_labels),
        "rowLabels": cars,
        "colLabels": col_labels,
        "payoffs": payoffs,
        "entityAName": cars[0] if cars else "Auto Market",
        "entityBName": market_segment,
        "yourProduct": cars[0] if cars else None,
    }


async def build_ai_matrix(prompt: str, segment: Optional[str] = None) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Build quantized game matrix from comma-separated car names"""
    cars = parse_comma_separated_cars(prompt)
    segment_key = (segment or "HATCHBACK").strip().upper()
    if segment_key not in SEGMENT_BOUNDS:
        raise ValueError(f"Unknown segment '{segment}'. Valid: {', '.join(SEGMENT_BOUNDS.keys())}")

    market_segment = SEGMENT_LABELS.get(segment_key, segment_key)
    segment_bounds = SEGMENT_BOUNDS[segment_key]
    print(f"✓ Segment bounds: {segment_key} -> {market_segment}")

    print(f"\n[STEP 1/3] Fetching structured car data via Firecrawl agent...")
    raw_data = await asyncio.gather(*[fetch_car_data(car) for car in cars])

    print(f"\n[STEP 2/3] Scoring tech features for all cars via one Gemini call...")
    tech_scores = await score_tech_batch(raw_data)

    print(f"\n[STEP 3/3] Quantizing metrics to 1-10 scale...")
    quantized = [
        quantize_car_data(raw, tech, segment_bounds)
        for raw, tech in zip(raw_data, tech_scores)
    ]
    
    for car_name, q in zip(cars, quantized):
        print(f"  {car_name}: {q}")

    matrix_data = _build_matrix(cars, quantized, market_segment)
    raw_payload = [
        {
            "car_name": raw.car_name,
            "price_inr": raw.price_inr,
            "arai_mileage_kmpl": raw.arai_mileage_kmpl,
            "power_bhp": raw.power_bhp,
            "safety_rating": raw.safety_rating,
            "service_score": raw.service_score,
            "key_features": raw.key_features,
            "tech_score": tech_score,
            "quantized": quant
        }
        for raw, tech_score, quant in zip(raw_data, tech_scores, quantized)
    ]

    print(f"\n✅ AI matrix built successfully!\n")
    return matrix_data, raw_payload

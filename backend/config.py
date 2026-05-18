"""
Centralized configuration for Gemini models used across the application.
Update these values to change which Gemini model is used in each component.
"""

# Model for general chat and car model resolution (in ai_fetch.py)
GEMINI_CHAT_MODEL = "gemini-2.5-flash"

#GEMINI_CHAT_MODEL = "gemini-1.5-flash"

# Model for tech feature scoring (in ai_fetch.py)
GEMINI_TECH_SCORE_MODEL = "gemini-2.5-flash"

#GEMINI_TECH_SCORE_MODEL = "gemini-1.5-flash"

# Model for strategic advisory and analysis (in gemini_service.py)
GEMINI_ADVISORY_MODEL = "gemini-2.5-flash"

#GEMINI_ADVISORY_MODEL = "gemini-1.5-flash"


# Fallback models (if primary model not available)
FALLBACK_MODELS = [
    "gemini-2.5-flash"
]

# API Rate limiting
FIRECRAWL_REQUEST_DELAY = 1.5  # seconds between Firecrawl requests
GEMINI_REQUEST_DELAY = 0.8     # seconds between Gemini requests

# Car data normalization bounds
PRICE_MIN_INR = 550000
PRICE_MAX_INR = 1200000
MILEAGE_MIN_KMPL = 12.0
MILEAGE_MAX_KMPL = 26.0
SAFETY_MIN_STARS = 0.0
SAFETY_MAX_STARS = 5.0
ENGINE_MIN_CC = 998
ENGINE_MAX_CC = 1498

# Fallback values
TECH_SCORE_FALLBACK = 5.0

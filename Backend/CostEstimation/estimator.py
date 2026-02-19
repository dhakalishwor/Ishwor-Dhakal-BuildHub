from dataclasses import dataclass

@dataclass
class EstimateResult:
    min_cost: float
    max_cost: float
    cost_per_sqft: float
    confidence: str
    explanation: list

BASE_RATE_PER_SQFT = {
    "Civil": 800,
    "Electrical": 400,
    "Plumbing": 300,
    "Interior": 500,
    "Painting": 250,
    "Other": 200,
}

LOCATION_MULTIPLIER = {
    "Kathmandu": 1.25,
    "Lalitpur": 1.20,
    "Bhaktapur": 1.15,
    "Pokhara": 1.10,
    "Other": 1.00,
}

QUALITY_MULTIPLIER = {
    "Basic": 0.90,
    "Standard": 1.00,
    "Premium": 1.20,
}

URGENCY_MULTIPLIER = {
    "Normal": 1.00,
    "Urgent": 1.15,
}

COMPLEXITY_MULTIPLIER = {
    "Low": 0.95,
    "Medium": 1.00,
    "High": 1.15,
}

def estimate_cost(category: str, area_sqft: float, location: str, quality: str, urgency: str, complexity: str):
    category = (category or "Other").strip()
    location = (location or "Other").strip()
    quality = (quality or "Standard").strip()
    urgency = (urgency or "Normal").strip()
    complexity = (complexity or "Medium").strip()

    base = BASE_RATE_PER_SQFT.get(category, BASE_RATE_PER_SQFT["Other"])
    loc_m = LOCATION_MULTIPLIER.get(location, LOCATION_MULTIPLIER["Other"])
    q_m = QUALITY_MULTIPLIER.get(quality, QUALITY_MULTIPLIER["Standard"])
    u_m = URGENCY_MULTIPLIER.get(urgency, URGENCY_MULTIPLIER["Normal"])
    c_m = COMPLEXITY_MULTIPLIER.get(complexity, COMPLEXITY_MULTIPLIER["Medium"])

    cost_per_sqft = base * loc_m * q_m * u_m * c_m
    estimated = cost_per_sqft * float(area_sqft)

    # range bands (rule-based uncertainty)
    # smaller projects tend to have higher % uncertainty
    if area_sqft < 500:
        spread = 0.18
        confidence = "Medium"
    elif area_sqft < 1500:
        spread = 0.12
        confidence = "High"
    else:
        spread = 0.10
        confidence = "High"

    min_cost = estimated * (1 - spread)
    max_cost = estimated * (1 + spread)

    explanation = [
        f"Base rate for {category}: NPR {base}/sqft",
        f"Location multiplier ({location}): x{loc_m}",
        f"Quality multiplier ({quality}): x{q_m}",
        f"Urgency multiplier ({urgency}): x{u_m}",
        f"Complexity multiplier ({complexity}): x{c_m}",
        f"Uncertainty spread: ±{int(spread*100)}%",
    ]

    return EstimateResult(
        min_cost=round(min_cost, 2),
        max_cost=round(max_cost, 2),
        cost_per_sqft=round(cost_per_sqft, 2),
        confidence=confidence,
        explanation=explanation,
    )

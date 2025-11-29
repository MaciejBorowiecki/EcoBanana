from pydantic import BaseModel

class ScanResultResponse(BaseModel):
    """
    Defines the JSON structure returned to the frontend.
    """
    plant_name: str         # Polish name (e.g., "Barszcz")
    latin_name: str         # Scientific name
    confidence: float       # AI certainty (0.0 - 1.0)
    is_invasive: bool       # True if dangerous/invasive
    message: str            # Warning message for the user
from pydantic import BaseModel

class ScanResultResponse(BaseModel):
    plant_name: str
    latin_name: str
    confidence: float
    is_invasive: bool
    message: str
    points: int   # <-- Nowe pole!
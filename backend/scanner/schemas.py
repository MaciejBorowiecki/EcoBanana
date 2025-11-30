from pydantic import BaseModel

class ScanResultResponse(BaseModel):
    plant_name: str
    latin_name: str
    confidence: float
    is_invasive: bool
    message: str
    points: int
    
    
class PlantEntry(BaseModel):
    polish_name: str
    latin_name: str 
    invasiveness: str
    points: int 
    description: str = ""
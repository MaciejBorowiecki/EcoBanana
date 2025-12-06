from fastapi import APIRouter, UploadFile, File
from .schemas import ScanResultResponse, PlantEntry
from .ai_engine import ai_engine
from .plant_service import plant_db
from typing import List
import data.data_base_funtions as df


router = APIRouter()

@router.post("/scan", response_model=ScanResultResponse)
async def scan_plant(file: UploadFile = File(...)):
    # read and sent to Pla@netAPi
    image_data = await file.read()
    
    # Use trained model (for mvp API)
    ai_result = await ai_engine.predict(image_data)
    
    if not ai_result:
        return {
            "plant_name": "Error",
            "latin_name": "Error",
            "confidence": 0.0,
            "is_invasive": False,
            "message": "Failed to process the photo.",
            "points": 0
        }

    # Printf console info
    print(f"AI recognized: {ai_result.get('latin_name', 'Unknown')} ({ai_result.get('confidence', 0):.2%})")

    # Look for result in csv
    plant_info = plant_db.find_by_ai_label(ai_result)

    if plant_info:
        # Plant is marked as invasive
        base_points = int(plant_info['points'])
        multiplier = 10
        
        # Hardcoded for mvp
        df.log_discovery("1", plant_info["polish_name"], "52.229896, 21.009313")
        return {
            "plant_name": plant_info['polish_name'],
            "latin_name": plant_info['latin_name'],
            "confidence": round(ai_result['confidence'], 2),
            "is_invasive": True,
            "message": f"Invasive species identified: {plant_info['polish_name']}",
            "points": base_points * multiplier
        }
    else:
        # Plant is not in csv which mean 
        return {
            "plant_name": ai_result.get('english_name', 'Unknown'),
            "latin_name": ai_result.get('latin_name', 'Unknown'),
            "confidence": round(ai_result['confidence'], 2),
            "is_invasive": False,
            "message": "This looks like a safe plant (not in the IAS - Invasive Alien Species database).",
            "points": 0
        }
        
@router.get("/plants", response_model=List[PlantEntry])
def get_knowledge_base():
    return plant_db.get_all_plants()

@router.get("/profile", response_model=int)
def get_user_points():
    # Hardcoded one user of points for mvp
    return df.user_get_points("Janusz")
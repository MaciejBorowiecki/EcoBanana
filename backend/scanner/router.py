from fastapi import APIRouter, UploadFile, File, HTTPException
from .schemas import ScanResultResponse
from .ai_engine import ai_engine
from .plant_service import plant_db

router = APIRouter()

@router.post("/scan", response_model=ScanResultResponse)
async def scan_plant(file: UploadFile = File(...)):
    """
    Endpoint to receive an image file and return plant analysis.
    """
    print(f"📸 Received file: {file.filename}")

    # 1. Read file bytes
    image_data = await file.read()

    # 2. Run AI Inference (Local)
    ai_result = ai_engine.predict(image_data)
    
    if not ai_result:
        # Fallback if AI fails completely
        return {
            "plant_name": "Error",
            "latin_name": "N/A",
            "confidence": 0.0,
            "is_invasive": False,
            "message": "Could not process image."
        }

    english_label = ai_result['label']
    confidence = ai_result['confidence']
    print(f"🤖 AI detected: '{english_label}' with {confidence:.2f} confidence")

    # 3. Match English label with Polish CSV Database
    plant_info = plant_db.find_by_ai_label(english_label)

    if plant_info:
        # Found in our database
        polish_name = plant_info['nazwa_polska']
        latin_name = plant_info['nazwa_lacinska']
        invasiveness = int(plant_info['stopien_inwazyjnosci'])
        
        is_invasive = invasiveness > 0
        
        # Generate message based on invasiveness level
        if invasiveness == 2:
            msg = "⛔ DANGER! Highly invasive or toxic plant detected!"
        elif invasiveness == 1:
            msg = "⚠️ Warning: Invasive plant detected."
        else:
            msg = "✅ Safe / Native plant."
            
    else:
        # Not found in CSV (Unknown plant)
        polish_name = f"Other Plant ({english_label})"
        latin_name = "Unknown"
        is_invasive = False
        msg = "This plant is not listed in our invasive species database."

    # 4. Return result
    return {
        "plant_name": polish_name,
        "latin_name": latin_name,
        "confidence": round(confidence, 2),
        "is_invasive": is_invasive,
        "message": msg
    }
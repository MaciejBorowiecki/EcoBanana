from fastapi import APIRouter, UploadFile, File
from .schemas import ScanResultResponse
from .ai_engine import ai_engine
from .plant_service import plant_db

# --- TEJ LINIJKI BRAKOWAŁO U CIEBIE: ---
router = APIRouter()
# ---------------------------------------

@router.post("/scan", response_model=ScanResultResponse)
async def scan_plant(file: UploadFile = File(...)):
    # 1. Odczyt i wysyłka do Pl@ntNet
    image_data = await file.read()
    
    # Używamy Twojego silnika AI (pamiętaj o await, jeśli używasz wersji async)
    ai_result = await ai_engine.predict(image_data)
    
    if not ai_result:
        return {
            "plant_name": "Błąd",
            "latin_name": "Error",
            "confidence": 0.0,
            "is_invasive": False,
            "message": "Nie udało się przetworzyć zdjęcia.",
            "points": 0
        }

    # Logujemy co przyszło
    print(f"AI rozpoznało: {ai_result.get('latin_name', 'Unknown')} ({ai_result.get('confidence', 0):.2%})")

    # 2. Szukanie w CSV (przekazujemy cały obiekt ai_result)
    plant_info = plant_db.find_by_ai_label(ai_result)

    if plant_info:
        # ZNALEZIONO INWAZYJNĄ W CSV
        return {
            "plant_name": plant_info['polish_name'],
            "latin_name": plant_info['latin_name'],
            "confidence": round(ai_result['confidence'], 2),
            "is_invasive": True,
            "message": f"Zidentyfikowano gatunek inwazyjny: {plant_info['polish_name']}",
            "points": int(plant_info['points'])
        }
    else:
        # NIE MA W CSV (bezpieczna lub nieznana)
        return {
            "plant_name": ai_result.get('english_name', 'Unknown'),
            "latin_name": ai_result.get('latin_name', 'Unknown'),
            "confidence": round(ai_result['confidence'], 2),
            "is_invasive": False,
            "message": "To wygląda na bezpieczną roślinę (brak w bazie IGO).",
            "points": 0
        }
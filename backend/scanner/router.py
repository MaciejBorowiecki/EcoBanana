from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException
from .schemas import ScanResultResponse
# ZMIANA: Importujemy nową funkcję
from .services import identify_plant_with_api 

router = APIRouter()

@router.post("/scan", response_model=ScanResultResponse)
async def scan_plant(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    x_user_id: int = Header(..., alias="x-user-id") 
):
    # 1. Czytamy plik
    image_data = await file.read()

    # 2. Wysyłamy do PRAWDZIWEGO AI
    result = await identify_plant_with_api(image_data)
    
    # Logowanie w konsoli dla pewności
    print(f"User {x_user_id} znalazł: {result['plant_name']} ({result['confidence']*100}%)")

    # 3. Zwracamy wynik
    return ScanResultResponse(**result)
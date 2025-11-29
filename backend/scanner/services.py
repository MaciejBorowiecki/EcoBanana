import httpx
import json

# Twój klucz API (docelowo trzymaj go w pliku .env, ale na start wklej tu)
PLANTNET_API_KEY = "TU_WKLEJ_SWOJ_KLUCZ_Z_MY_PLANTNET_ORG"
PLANTNET_URL = f"https://my-api.plantnet.org/v2/identify/all?api-key={PLANTNET_API_KEY}"

# Lista inwazyjna (uproszczona na potrzeby skanera)
# W przyszłości pobierzesz to z bazy danych
INVASIVE_SPECIES = {
    "Heracleum sosnowskyi": "Barszcz Sosnowskiego",
    "Heracleum mantegazzianum": "Barszcz Mantegazziego",
    "Reynoutria japonica": "Rdestowiec ostrokończysty",
    "Reynoutria sachalinensis": "Rdestowiec sachaliński",
    "Solidago canadensis": "Nawłoć kanadyjska",
    "Impatiens glandulifera": "Niecierpek gruczołowaty",
    "Ailanthus altissima": "Bożodrzew gruczołowaty"
}

async def identify_plant_with_api(image_bytes: bytes) -> dict:
    """
    Wysyła zdjęcie do Pl@ntNet API i interpretuje wynik.
    """
    
    # Przygotowanie plików do wysyłki (multipart/form-data)
    files = {
        'images': ('image.jpg', image_bytes)
    }
    
    # Parametry dodatkowe (opcjonalne, np. organy rośliny)
    data = {
        'organs': ['auto'] # 'auto', 'leaf', 'flower' etc.
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(PLANTNET_URL, files=files, data=data, timeout=10.0)
            
            # Obsługa błędów API
            if response.status_code != 200:
                print(f"Błąd API: {response.text}")
                return {
                    "plant_name": "Nieznana roślina",
                    "latin_name": "Unknown",
                    "confidence": 0.0,
                    "is_invasive": False,
                    "message": "Błąd połączenia z serwerem rozpoznawania."
                }

            result_json = response.json()
            
            # Pobieramy najlepszy wynik (pierwszy na liście)
            best_match = result_json['results'][0]
            score = best_match['score']  # Pewność od 0 do 1
            latin_name = best_match['species']['scientificNameWithoutAuthor']
            common_names = best_match['species']['commonNames']
            
            # Wybieramy nazwę polską, jeśli jest, jak nie to łacińską
            plant_name = latin_name
            if common_names and len(common_names) > 0:
                # API często zwraca angielskie, ale czasem polskie. 
                # Na razie bierzemy pierwszą dostępną.
                plant_name = common_names[0]

            # Sprawdzamy czy to inwazyjny gatunek
            is_invasive = latin_name in INVASIVE_SPECIES
            
            # Jeśli inwazyjny, nadpisujemy nazwę naszą polską nazwą z listy
            message = "To bezpieczna roślina."
            if is_invasive:
                plant_name = INVASIVE_SPECIES[latin_name]
                message = "UWAGA! Wykryto gatunek inwazyjny!"

            return {
                "plant_name": plant_name,
                "latin_name": latin_name,
                "confidence": round(score, 2), # np. 0.95
                "is_invasive": is_invasive,
                "message": message
            }

        except Exception as e:
            print(f"Wyjątek: {e}")
            return {
                "plant_name": "Błąd systemu",
                "latin_name": "Error",
                "confidence": 0.0,
                "is_invasive": False,
                "message": "Wystąpił błąd podczas analizy zdjęcia."
            }
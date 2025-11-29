import os
import httpx
import json
from dotenv import load_dotenv

# Ładujemy zmienne z pliku .env
load_dotenv()

class PlantNetAPI:
    def __init__(self):
        self.api_key = os.getenv("PLANTNET_API_KEY")
        if not self.api_key:
            print("UWAGA: Brak klucza PLANTNET_API_KEY w pliku .env!")
        else:
            print("Pl@ntNet API: Klucz załadowany.")
            
        # Endpoint API (szukamy we wszystkich florach świata)
        self.api_url = f"https://my-api.plantnet.org/v2/identify/all?api-key={self.api_key}"

    async def predict(self, image_bytes: bytes):
        if not self.api_key:
            return None

        try:
            # Pl@ntNet wymaga przesłania pliku w formacie multipart
            files = {
                'images': ('image.jpg', image_bytes)
            }
            
            # Parametr 'organs' jest wymagany, 'auto' działa najlepiej dla ogólnych zdjęć
            data = {
                'organs': ['auto']
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(self.api_url, files=files, data=data, timeout=15.0)

            if response.status_code != 200:
                print(f"Błąd API Pl@ntNet: {response.text}")
                return None

            result_json = response.json()
            
            # Pobieramy najlepszy wynik
            best_match = result_json['results'][0]
            
            # Pl@ntNet zwraca nazwę naukową (Latin) i pewność (Score)
            latin_name = best_match['species']['scientificNameWithoutAuthor']
            score = best_match['score']
            
            # Pobieramy też nazwy potoczne (Common names) jeśli są dostępne
            common_names = best_match['species'].get('commonNames', [])
            english_name = common_names[0] if common_names else latin_name

            return {
                "latin_name": latin_name,   # Np. "Heracleum sosnowskyi"
                "english_name": english_name,
                "confidence": score
            }

        except Exception as e:
            print(f"Wyjątek połączenia z API: {e}")
            return None

# Singleton
ai_engine = PlantNetAPI()
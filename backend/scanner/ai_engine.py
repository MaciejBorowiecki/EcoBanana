import os
import httpx
import json
from dotenv import load_dotenv

# Load .env variables (API key for mvp)
load_dotenv()

class PlantNetAPI:
    def __init__(self):
        self.api_key = os.getenv("PLANTNET_API_KEY")
        if not self.api_key:
            print("WARNING: Missing PLANTNET_API_KEY in .env file!")
        else:
            print("Pl@ntNet API: Key loaded.")
            
        # Endpoint API (mvp)
        self.api_url = f"[https://my-api.plantnet.org/v2/identify/all?api-key=](https://my-api.plantnet.org/v2/identify/all?api-key=){self.api_key}"

    async def predict(self, image_bytes: bytes):
        if not self.api_key:
            return None

        try:
            # Pl@Net API date format
            files = {
                'images': ('image.jpg', image_bytes)
            }
            
            # Necessity for Pl@Net API
            data = {
                'organs': ['auto']
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(self.api_url, files=files, data=data, timeout=15.0)

            if response.status_code != 200:
                print(f"Pl@ntNet API Error: {response.text}")
                return None

            result_json = response.json()
            
            # Get best result
            best_match = result_json['results'][0]
            
            # Get latin_name and predict accuracy
            latin_name = best_match['species']['scientificNameWithoutAuthor']
            score = best_match['score']
            
            # Get all known common names
            common_names = best_match['species'].get('commonNames', [])
            english_name = common_names[0] if common_names else latin_name

            return {
                "latin_name": latin_name,   # E.g. "Heracleum sosnowskyi"
                "english_name": english_name,
                "confidence": score
            }

        except Exception as e:
            print(f"API connection exception: {e}")
            return None

# Singleton
ai_engine = PlantNetAPI()
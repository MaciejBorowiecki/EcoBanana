import csv
import os
from typing import Optional, Dict

# Ustawiamy ścieżkę do Twojego nowego pliku
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, 'data', 'parsed_plants_dp.csv')

class PlantDatabase:
    def __init__(self):
        self.plants = []
        self.load_database()

    def load_database(self):
        """Wczytuje Twój plik parsed_plants_dp.csv do pamięci."""
        if not os.path.exists(CSV_PATH):
            print(f"BŁĄD: Nie znaleziono pliku bazy danych: {CSV_PATH}")
            return

        with open(CSV_PATH, mode='r', encoding='utf-8') as f:
            # Twój plik CSV nie ma spacji po przecinkach, więc standardowy reader jest OK
            reader = csv.DictReader(f)
            
            for row in reader:
                # Normalizujemy dane dla łatwiejszego wyszukiwania
                # Zamieniamy na małe litery, żeby 'Kudzu' i 'kudzu' było tym samym
                if row['english_name']:
                    row['search_key'] = row['english_name'].lower()
                else:
                    row['search_key'] = ""
                
                # Dodajemy też nazwę łacińską do wyszukiwania (bo AI czasem zwraca łacinę)
                if row['latin_name']:
                    row['latin_search_key'] = row['latin_name'].lower()
                
                self.plants.append(row)
        
        print(f"Załadowano {len(self.plants)} gatunków z pliku parsed_plants_dp.csv.")

    def find_by_ai_label(self, ai_result: dict) -> Optional[Dict]:
        """
        Teraz przyjmujemy cały słownik z AI, a nie tylko etykietę.
        Szukamy priorytetowo po nazwie ŁACIŃSKIEJ.
        """
        if not ai_result:
            return None
            
        ai_latin = ai_result.get('latin_name', '').lower()
        ai_english = ai_result.get('english_name', '').lower()
        
        # Iterujemy po bazie CSV
        for plant in self.plants:
            # 1. PRIORYTET: Porównanie po łacinie (Bardzo dokładne)
            csv_latin = plant.get('latin_search_key', '')
            
            if csv_latin and ai_latin:
                # Sprawdzamy czy nazwy są identyczne lub jedna zawiera drugą
                if csv_latin == ai_latin or csv_latin in ai_latin or ai_latin in csv_latin:
                    return plant
            
            # 2. ZAPASOWO: Porównanie po angielsku (jeśli łacina zawiedzie)
            csv_eng = plant.get('search_key', '')
            if csv_eng and ai_english:
                if csv_eng in ai_english or ai_english in csv_eng:
                    return plant
        
        return None

# Singleton
plant_db = PlantDatabase()
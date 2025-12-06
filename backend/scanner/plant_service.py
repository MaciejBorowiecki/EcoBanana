import csv
import os
from typing import Optional, Dict, List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, 'data', 'parsed_plants_dp.csv')

class PlantDatabase:
    def __init__(self):
        self.plants = []
        self.load_database()

    def load_database(self):
        """Loads your parsed_plants_dp.csv file into memory."""
        if not os.path.exists(CSV_PATH):
            print(f"ERROR: Database file not found: {CSV_PATH}")
            return

        with open(CSV_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                # Normalise data
                if row['english_name']:
                    row['search_key'] = row['english_name'].lower()
                else:
                    row['search_key'] = ""
                
                # Add latin name
                if row['latin_name']:
                    row['latin_search_key'] = row['latin_name'].lower()
                
                self.plants.append(row)
        
        print(f"Loaded {len(self.plants)} species from parsed_plants_dp.csv.")

    def find_by_ai_label(self, ai_result: dict) -> Optional[Dict]:
        """
        Now we accept the whole dictionary from AI, not just the label.
        We search primarily by LATIN name.
        """
        if not ai_result:
            return None
            
        ai_latin = ai_result.get('latin_name', '').lower()
        ai_english = ai_result.get('english_name', '').lower()
        
        for plant in self.plants:
            # Set priority for latin names
            csv_latin = plant.get('latin_search_key', '')
            
            if csv_latin and ai_latin:
                # looking for plant
                if csv_latin == ai_latin or csv_latin in ai_latin or ai_latin in csv_latin:
                    return plant
            
            # looking for english name - lower priority
            csv_eng = plant.get('search_key', '')
            if csv_eng and ai_english:
                if csv_eng in ai_english or ai_english in csv_eng:
                    return plant
        
        return None

    def get_all_plants(self) -> List[Dict]:
        return self.plants
    
# Singleton
plant_db = PlantDatabase()
import csv
import os
from typing import Optional, Dict

# Path to the CSV file relative to this script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, 'data', 'plants.csv')

class PlantDatabase:
    """
    Manages reading data from the CSV file.
    """
    def __init__(self):
        self.plants = []
        self.load_database()

    def load_database(self):
        """Loads CSV data into memory at startup."""
        if not os.path.exists(CSV_PATH):
            print(f"ERROR: Database file not found at {CSV_PATH}")
            return

        with open(CSV_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Split 'ai_tags' string into a list for easier searching
                # "hogweed|cow parsnip" -> ['hogweed', 'cow parsnip']
                row['ai_tags'] = row['ai_tags'].lower().split('|')
                self.plants.append(row)
        
        print(f"Loaded {len(self.plants)} plants from CSV database.")

    def find_by_ai_label(self, ai_label: str) -> Optional[Dict]:
        """
        Searches for a plant in the database using the AI output label.
        """
        normalized_label = ai_label.lower()
        
        for plant in self.plants:
            # Check if any tag from CSV is present in the AI label
            # e.g. if AI says "giant hogweed", and tag is "hogweed", it's a match.
            if any(tag in normalized_label for tag in plant['ai_tags']):
                return plant
        
        return None

# Singleton instance
plant_db = PlantDatabase()
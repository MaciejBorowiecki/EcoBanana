from transformers import pipeline
from PIL import Image
import io

class LocalPlantAI:
    """
    Handles local AI inference using Hugging Face Transformers.
    It downloads the model once and keeps it in memory.
    """
    def __init__(self):
        print("Loading AI Model (microsoft/resnet-50)... This might take a while on first run.")
        # We use ResNet-50 because it's lightweight and good at general object classification
        self.classifier = pipeline("image-classification", model="microsoft/resnet-50")
        print("AI Model loaded successfully!")

    def predict(self, image_bytes: bytes):
        """
        Takes raw image bytes, converts to PIL Image, and runs inference.
        """
        try:
            # Convert bytes to Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Run inference
            results = self.classifier(image)
            
            # The model returns a list of dictionaries. Example:
            # [{'score': 0.98, 'label': 'daisy'}, {'score': 0.01, 'label': 'bee'}]
            # We take the best result (index 0).
            best_match = results[0]
            
            return {
                "label": best_match['label'],  # English name (e.g. 'daisy')
                "confidence": best_match['score']
            }
        except Exception as e:
            print(f"AI Prediction Error: {e}")
            return None

# Singleton instance - ensures we load the model only once
ai_engine = LocalPlantAI()
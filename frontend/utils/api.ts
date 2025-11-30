// utils/api.ts

// ---------------------------------------------------------
// KONFIGURACJA POŁĄCZENIA
// ---------------------------------------------------------
// ZMIEŃ TO NA ADRES IP LAPTOPA Z BACKENDEM!
// Jeśli kolega ma np. 192.168.0.15, wpisz to tutaj.
const API_URL = 'http://10.137.235.39:5555/scanner/scan';

// ---------------------------------------------------------
// TYPY DANYCH (INTERFEJSY)
// ---------------------------------------------------------

// To jest format, którego oczekuje Twój Frontend (Index.tsx)
export interface ScanResult {
  isInvasive: boolean;
  plantName: string;
  description: string;
  pointsEarned: number;
  reportId?: string;
  capturedImageUri?: string;
}

// POPRAWIONE: Format z Backendu (teraz poprawne typy TypeScript)
interface BackendResponse {
  plant_name: string;
  latin_name: string;
  confidence: number;   // W Pythonie float -> w TS number
  is_invasive: boolean; // W Pythonie bool -> w TS boolean
  message: string;      // W Pythonie str -> w TS string
  points: number;       // W Pythonie int -> w TS number
}

export interface UserProfile {
  points: number;
  level: string;
  scansCount: number;
}

export interface PlantKnowledgeEntry {
  polish_name: string;
  latin_name: string;
  invasiveness: string;
  points: number;
}
// ---------------------------------------------------------
// FUNKCJE API
// ---------------------------------------------------------

/**
 * Wysyła zdjęcie do prawdziwego backendu FastAPI.
 */
export const analyzePlant = async (
  photoUri: string, 
  location: { lat: number; lng: number } | null
): Promise<ScanResult> => {
  
  console.log(`[API] Wysyłanie zdjęcia do: ${API_URL}`);

  try {
    // 1. Przygotowanie formularza (Multipart)
    const formData = new FormData();

    // Dodajemy plik - nazwa 'file' musi się zgadzać z router.py
    formData.append('file', {
      uri: photoUri,
      name: 'scan.jpg',
      type: 'image/jpeg',
    } as any);

    // 2. Strzał do serwera (POST)
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        // Content-Type ustawi się samo
      },
    });

    // 3. Obsługa błędów HTTP
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera (${response.status}): ${errorText}`);
    }

    // 4. Parsowanie odpowiedzi z backendu
    const data: BackendResponse = await response.json();
    console.log('[API] Otrzymano odpowiedź:', data);

    // 5. Mapowanie danych z Backendu na Frontend
    return {
      isInvasive: data.is_invasive,
      plantName: data.plant_name,   
      description: data.message,    
      pointsEarned: data.points,    
      reportId: '#ID-' + Math.floor(Math.random() * 10000), 
      capturedImageUri: photoUri    
    };

  } catch (error) {
    console.error('[API Error]', error);
    throw error;
  }
};

/**
 * Pobieranie profilu użytkownika (Mock).
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        points: 0, 
        level: 'Początkujący',
        scansCount: 0
      });
    }, 500);
  });
};
export const getPlantsDatabase = async (): Promise<PlantKnowledgeEntry[]> => {
  // Zamieniamy końcówkę '/scan' na '/plants' w adresie URL
  // (Zakładając, że API_URL to 'http://.../scanner/scan')
  const PLANTS_URL = API_URL.replace('/scanner/scan', '/scanner/plants');
  
  console.log(`[API] Pobieranie bazy wiedzy z: ${PLANTS_URL}`);

  try {
    const response = await fetch(PLANTS_URL);
    if (!response.ok) throw new Error("Błąd pobierania bazy");
    
    const data = await response.json();
    return data; // Zwraca listę roślin z backendu
  } catch (error) {
    console.error("Błąd bazy wiedzy:", error);
    return []; // Zwracamy pustą listę w razie błędu, żeby apka nie padła
  }
};
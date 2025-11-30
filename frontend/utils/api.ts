// utils/api.ts

// 🛑 WPISZ TU IP LAPTOPA Z BACKENDEM!
const API_IP = '10.137.235.39'; 
const API_PORT = '5555';
const API_BASE_URL = `http://${API_IP}:${API_PORT}/scanner`; 

// --- TYPY ---

export interface ScanResult {
  isInvasive: boolean;
  plantName: string;
  description: string;
  pointsEarned: number;
  reportId?: string;
  capturedImageUri?: string;
}

export interface PlantKnowledgeEntry {
  polish_name: string;
  latin_name: string;
  invasiveness: string;
  points: number;
}

// --- FUNKCJE API ---

export const analyzePlant = async (photoUri: string): Promise<ScanResult> => {
  const URL = `${API_BASE_URL}/scan`;
  console.log(`[API] Skanowanie: ${URL}`);

  try {
    const formData = new FormData();
    // Backend oczekuje tylko pliku 'file'. Lokalizacja i user są hardcoded w Pythonie.
    formData.append('file', {
      uri: photoUri,
      name: 'scan.jpg',
      type: 'image/jpeg',
    } as any);
    
    const response = await fetch(URL, { method: 'POST', body: formData });
    
    if (!response.ok) {
      const txt = await response.text();
      console.error('Błąd skanowania:', txt);
      throw new Error("Błąd serwera");
    }

    const data = await response.json();
    
    // Mapujemy odpowiedź z routera kolegów
    return {
      isInvasive: data.is_invasive,
      plantName: data.plant_name,
      description: data.message,
      pointsEarned: data.points,
      // Backend nie zwraca obrazka ani ID raportu, generujemy fake dla UI
      reportId: '#MVP-' + Math.floor(Math.random() * 1000), 
      capturedImageUri: photoUri 
    };
  } catch (e) { console.error(e); throw e; }
};

export const getPlantsDatabase = async (): Promise<PlantKnowledgeEntry[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/plants`);
    if (!response.ok) return [];
    return await response.json();
  } catch (e) {
    console.error("Błąd bazy wiedzy:", e);
    return [];
  }
};

// NOWE: Pobieranie punktów Janusza
export const getUserPoints = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`);
    // Router zwraca "response_model=int", więc dostaniemy np. 1250
    if (!response.ok) return 0;
    const points = await response.json();
    return Number(points); // Upewniamy się, że to liczba
  } catch (e) {
    console.error("Błąd profilu:", e);
    return 0; // W razie błędu 0 pkt
  }
};
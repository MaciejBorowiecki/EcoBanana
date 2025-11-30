// utils/api.ts

// IP of host (mvp implementation)
const API_IP = '10.137.235.39'; 
const API_PORT = '5555';
const API_BASE_URL = `http://${API_IP}:${API_PORT}/scanner`; 

// Types

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

// API Functions

export const analyzePlant = async (photoUri: string): Promise<ScanResult> => {
  const URL = `${API_BASE_URL}/scan`;
  console.log(`[API] Skanowanie: ${URL}`);

  try {
    const formData = new FormData();
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
    
    return {
      isInvasive: data.is_invasive,
      plantName: data.plant_name,
      description: data.message,
      pointsEarned: data.points,
      reportId: '#MVP-' + Math.floor(Math.random() * 1000), // MVP implementation
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

// Getting user points
export const getUserPoints = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`);
    if (!response.ok) return 0;
    const points = await response.json();
    return Number(points); 
  } catch (e) {
    console.error("Błąd profilu:", e);
    return 0; // In case of error, 0 points.
  }
};